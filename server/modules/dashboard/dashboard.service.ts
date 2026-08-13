import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_DATABASE } from '../../database/connection';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { count, desc, eq } from 'drizzle-orm';

import { work, message, keywordRule } from '@server/database/schema';
import type { DashboardStats, RecentMessage, CategoryStat } from '@shared/api.interface';

@Injectable()
export class DashboardService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getStats(): Promise<DashboardStats> {
    const [
      totalWorksResult,
      totalMessagesResult,
      unreadMessagesResult,
      totalKeywordRulesResult,
      recentMessagesResult,
      categoryStatsResult,
    ] = await Promise.all([
      this.db.select({ count: count() }).from(work),
      this.db.select({ count: count() }).from(message),
      this.db.select({ count: count() }).from(message).where(eq(message.isRead, false)),
      this.db.select({ count: count() }).from(keywordRule),
      this.db
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
      this.db
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
  }
}
