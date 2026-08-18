import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, logPoolStats } from '../../database/connection';
import { getCache, setCache, delCachePattern } from '../../common/cache';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type { DashboardStats, RecentMessage, CategoryStat } from '@shared/api.interface';

const rawLog = globalThis.console.log.bind(globalThis.console);
const rawError = globalThis.console.error.bind(globalThis.console);

const STATS_TIMEOUT_MS = 10000;
const STATS_CACHE_TTL = 15;
const STATS_CACHE_KEY = 'dashboard:stats';

const logger = new Logger('DashboardService');

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      const err = new Error(`DB operation timed out after ${ms}ms: ${label}`);
      rawError(`[DashboardService] TIMEOUT: ${label} after ${ms}ms`);
      reject(err);
    }, ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

const EMPTY_STATS: DashboardStats = {
  totalWorks: 0,
  totalMessages: 0,
  unreadMessages: 0,
  totalKeywordRules: 0,
  recentMessages: [],
  categoryStats: [],
};

@Injectable()
export class DashboardService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private get rawSql(): ReturnType<typeof import('postgres')> {
    return (this.db as unknown as { $client: ReturnType<typeof import('postgres')> }).$client;
  }

  async getStats(): Promise<DashboardStats> {
    rawLog('[DashboardService] getStats STEP1 enter');
    logPoolStats('dashboard-before');

    const cached = getCache<DashboardStats>(STATS_CACHE_KEY);
    if (cached) {
      rawLog('[DashboardService] getStats returning cached result');
      return cached;
    }
    try {
      const sql = this.rawSql;
      const result = await withTimeout(
        (async () => {
          rawLog('[DashboardService] getStats STEP2 inside withTimeout, running 6 parallel SELECTs...');
          const [
            totalWorksRows,
            totalMessagesRows,
            unreadMessagesRows,
            totalKeywordRulesRows,
            recentMessagesRows,
            categoryStatsRows,
          ] = await Promise.all([
            sql`SELECT COUNT(*)::bigint AS count FROM work`,
            sql`SELECT COUNT(*)::bigint AS count FROM message`,
            sql`SELECT COUNT(*)::bigint AS count FROM message WHERE is_read = FALSE`,
            sql`SELECT COUNT(*)::bigint AS count FROM keyword_rule`,
            sql`
              SELECT id, name, content, _created_at, is_read
              FROM message
              ORDER BY _created_at DESC
              LIMIT 5
            `,
            sql`SELECT category, COUNT(*)::bigint AS count FROM work GROUP BY category`,
          ]);
          rawLog('[DashboardService] getStats STEP3 all 6 queries returned');

          const recentMessages: RecentMessage[] = recentMessagesRows.map((m: any) => ({
            id: m.id,
            name: m.name,
            content: m.content,
            createdAt: new Date(m._created_at).toISOString(),
            isRead: m.is_read,
          }));

          const categoryStats: CategoryStat[] = categoryStatsRows.map((row: any) => ({
            category: row.category,
            count: Number(row.count),
          }));

          return {
            totalWorks: Number(totalWorksRows[0]?.count ?? 0),
            totalMessages: Number(totalMessagesRows[0]?.count ?? 0),
            unreadMessages: Number(unreadMessagesRows[0]?.count ?? 0),
            totalKeywordRules: Number(totalKeywordRulesRows[0]?.count ?? 0),
            recentMessages,
            categoryStats,
          };
        })(),
        STATS_TIMEOUT_MS,
        'dashboard-stats',
      );
       rawLog('[DashboardService] getStats STEP4 success');
       logPoolStats('dashboard-after');
       setCache(STATS_CACHE_KEY, result, STATS_CACHE_TTL);
       return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      rawError(`[DashboardService] getStats FAILED (returning zeros): ${msg}`);
      if (err instanceof Error && err.stack) {
        rawError(`[DashboardService] Stack: ${err.stack}`);
      }
      let current: unknown = err;
      for (let depth = 0; depth < 4 && current && typeof current === 'object'; depth += 1) {
        const { code, severity, detail, schema, table, hint } = current as {
          code?: unknown;
          severity?: unknown;
          detail?: unknown;
          schema?: unknown;
          table?: unknown;
          hint?: unknown;
        };
        if (code !== undefined || detail !== undefined) {
          rawError(
            `[DashboardService] PostgresError depth=${depth}: code=${code}, severity=${severity}, detail=${detail}, schema=${schema}, table=${table}, hint=${hint}`,
          );
        }
        const { cause } = current as { cause?: unknown };
        current = cause;
      }
       logger.error(`getStats failed, returning empty stats: ${msg}`);
       logPoolStats('dashboard-failed');
       return EMPTY_STATS;
    }
  }

  clearCache(): void {
    delCachePattern('dashboard:');
  }
}
