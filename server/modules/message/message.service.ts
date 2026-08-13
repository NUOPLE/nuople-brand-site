import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, desc, eq, sql } from 'drizzle-orm';
import { DRIZZLE_DATABASE } from '../../database/connection';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { message } from '../../database/schema';
import type {
  Message,
  MessageListItem,
  MessageListResponse,
  MessageStatusFilter,
} from '@shared/api.interface';

@Injectable()
export class MessageService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getList(
    page: number,
    pageSize: number,
    status: MessageStatusFilter,
  ): Promise<MessageListResponse> {
    const whereConditions = [];
    if (status === 'unread') {
      whereConditions.push(eq(message.isRead, false));
    } else if (status === 'read') {
      whereConditions.push(eq(message.isRead, true));
    }
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [itemsResult, totalResult, unreadResult] = await Promise.all([
      this.db
        .select({
          id: message.id,
          name: message.name,
          email: message.email,
          content: message.content,
          createdAt: message.createdAt,
          isRead: message.isRead,
          hasReply: sql<boolean>`${message.replyContent} IS NOT NULL`,
        })
        .from(message)
        .where(whereClause)
        .orderBy(desc(message.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      this.db
        .select({ count: count() })
        .from(message)
        .where(whereClause),
      this.db
        .select({ count: count() })
        .from(message)
        .where(eq(message.isRead, false)),
    ]);

    const items: MessageListItem[] = itemsResult.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      content: row.content,
      createdAt: row.createdAt.toISOString(),
      isRead: row.isRead,
      hasReply: row.hasReply,
    }));

    const total = Number(totalResult[0]?.count ?? 0);
    const totalUnread = Number(unreadResult[0]?.count ?? 0);

    return { items, total, totalUnread };
  }

  async getById(id: string): Promise<Message> {
    const rows = await this.db
      .select()
      .from(message)
      .where(eq(message.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('留言不存在');
    }

    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      content: row.content,
      createdAt: row.createdAt.toISOString(),
      isRead: row.isRead,
      replyContent: row.replyContent,
      repliedAt: row.repliedAt ? row.repliedAt.toISOString() : null,
    };
  }

  async updateReadStatus(id: string, isRead: boolean): Promise<void> {
    const updated = await this.db
      .update(message)
      .set({ isRead, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(message.id, id))
      .returning({ id: message.id });

    if (updated.length === 0) {
      throw new NotFoundException('留言不存在');
    }
  }

  async reply(id: string, replyContent: string): Promise<{ repliedAt: string }> {
    const updated = await this.db
      .update(message)
      .set({
        replyContent,
        repliedAt: sql`CURRENT_TIMESTAMP`,
        isRead: true,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(message.id, id))
      .returning({ repliedAt: message.repliedAt });

    if (updated.length === 0) {
      throw new NotFoundException('留言不存在');
    }

    return { repliedAt: updated[0].repliedAt!.toISOString() };
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.db
      .delete(message)
      .where(eq(message.id, id))
      .returning({ id: message.id });

    if (deleted.length === 0) {
      throw new NotFoundException('留言不存在');
    }
  }
}
