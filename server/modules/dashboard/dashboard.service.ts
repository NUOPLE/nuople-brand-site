import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE } from '../../database/connection';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { count, desc, eq } from 'drizzle-orm';

import { work, message, keywordRule } from '@server/database/schema';
import type { DashboardStats, RecentMessage, CategoryStat } from '@shared/api.interface';

const rawLog = globalThis.console.log.bind(globalThis.console);
const rawError = globalThis.console.error.bind(globalThis.console);

const STATS_TIMEOUT_MS = 8000;

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

  async getStats(): Promise<DashboardStats> {
    try {
      const result = await withTimeout(
        this.db.transaction(async (tx) => {
          const [
            totalWorksResult,
            totalMessagesResult,
            unreadMessagesResult,
            totalKeywordRulesResult,
            recentMessagesResult,
            categoryStatsResult,
          ] = await Promise.all([
            tx.select({ count: count() }).from(work),
            tx.select({ count: count() }).from(message),
            tx.select({ count: count() }).from(message).where(eq(message.isRead, false)),
            tx.select({ count: count() }).from(keywordRule),
            tx
              .select({
                id: message.id,
                name: message.name,
                content: message.content,
                createdAt: message.createdAt,
                isRead: message.isRead,
              })
              .from(message)
              .orderBy(desc(message.createdAt))
              .limit(5),
            tx
              .select({
                category: work.category,
                count: count(),
              })
              .from(work)
              .groupBy(work.category),
          ]);

          const recentMessages: RecentMessage[] = recentMessagesResult.map((m) => ({
            id: m.id,
            name: m.name,
            content: m.content,
            createdAt: m.createdAt.toISOString(),
            isRead: m.isRead,
          }));

          const categoryStats: CategoryStat[] = categoryStatsResult.map((row) => ({
            category: row.category,
            count: Number(row.count),
          }));

          return {
            totalWorks: Number(totalWorksResult[0]?.count ?? 0),
            totalMessages: Number(totalMessagesResult[0]?.count ?? 0),
            unreadMessages: Number(unreadMessagesResult[0]?.count ?? 0),
            totalKeywordRules: Number(totalKeywordRulesResult[0]?.count ?? 0),
            recentMessages,
            categoryStats,
          };
        }),
        STATS_TIMEOUT_MS,
        'dashboard-stats',
      );
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      rawError(`[DashboardService] getStats FAILED: ${msg}`);
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
      return EMPTY_STATS;
    }
  }
}
