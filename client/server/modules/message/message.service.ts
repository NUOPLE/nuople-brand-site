import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE } from '../../database/connection';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type {
  Message,
  MessageListItem,
  MessageListResponse,
  MessageStatusFilter,
} from '@shared/api.interface';

const rawLog = globalThis.console.log.bind(globalThis.console);
const rawError = globalThis.console.error.bind(globalThis.console);

@Injectable()
export class MessageService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private get sql(): ReturnType<typeof import('postgres')> {
    return (this.db as unknown as { $client: ReturnType<typeof import('postgres')> }).$client;
  }

  async getList(
    page: number,
    pageSize: number,
    status: MessageStatusFilter,
  ): Promise<MessageListResponse> {
    rawLog(`[MessageService.getList] STEP1 enter page=${page} pageSize=${pageSize} status=${status}`);

    const whereSql = status === 'unread'
      ? this.sql`WHERE is_read = FALSE`
      : status === 'read'
      ? this.sql`WHERE is_read = TRUE`
      : this.sql``;

    const offset = (page - 1) * pageSize;

    rawLog(`[MessageService.getList] STEP2 before SQL`);
    const [itemsResult, totalResult, unreadResult] = await Promise.all([
      this.sql`
        SELECT id, name, email, content, _created_at, is_read, reply_content IS NOT NULL AS has_reply
        FROM message
        ${whereSql}
        ORDER BY _created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `,
      this.sql`
        SELECT COUNT(*)::bigint AS count
        FROM message
        ${whereSql}
      `,
      this.sql`
        SELECT COUNT(*)::bigint AS count
        FROM message
        WHERE is_read = FALSE
      `,
    ]);
    rawLog(`[MessageService.getList] STEP3 SQL returned items=${itemsResult.length} total=${totalResult[0]?.count} unread=${unreadResult[0]?.count}`);

    const items: MessageListItem[] = itemsResult.map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      content: row.content,
      createdAt: new Date(row._created_at).toISOString(),
      isRead: row.is_read,
      hasReply: row.has_reply,
    }));

    const total = Number(totalResult[0]?.count ?? 0);
    const totalUnread = Number(unreadResult[0]?.count ?? 0);

    return { items, total, totalUnread };
  }

  async getById(id: string): Promise<Message> {
    rawLog(`[MessageService.getById] STEP1 enter id=${id}`);

    rawLog(`[MessageService.getById] STEP2 before SQL`);
    const rows = await this.sql`
      SELECT id, name, email, content, is_read, reply_content, replied_at, _created_at
      FROM message
      WHERE id = ${id}
      LIMIT 1
    `;
    rawLog(`[MessageService.getById] STEP3 SQL returned rows=${rows.length}`);

    if (rows.length === 0) {
      throw new NotFoundException('留言不存在');
    }

    const row: any = rows[0];
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      content: row.content,
      createdAt: new Date(row._created_at).toISOString(),
      isRead: row.is_read,
      replyContent: row.reply_content ?? null,
      repliedAt: row.replied_at ? new Date(row.replied_at).toISOString() : null,
    };
  }

  async updateReadStatus(id: string, isRead: boolean): Promise<void> {
    rawLog(`[MessageService.updateReadStatus] STEP1 enter id=${id} isRead=${isRead}`);

    rawLog(`[MessageService.updateReadStatus] STEP2 before SQL`);
    const updated = await this.sql`
      UPDATE message
      SET is_read = ${isRead}, _updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id
    `;
    rawLog(`[MessageService.updateReadStatus] STEP3 SQL returned rows=${updated.length}`);

    if (updated.length === 0) {
      throw new NotFoundException('留言不存在');
    }
  }

  async reply(id: string, replyContent: string): Promise<{ repliedAt: string }> {
    rawLog(`[MessageService.reply] STEP1 enter id=${id}`);

    rawLog(`[MessageService.reply] STEP2 before SQL`);
    const updated = await this.sql`
      UPDATE message
      SET reply_content = ${replyContent},
          replied_at = CURRENT_TIMESTAMP,
          is_read = TRUE,
          _updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING replied_at
    `;
    rawLog(`[MessageService.reply] STEP3 SQL returned rows=${updated.length}`);

    if (updated.length === 0) {
      throw new NotFoundException('留言不存在');
    }

    return { repliedAt: new Date((updated[0] as any).replied_at).toISOString() };
  }

  async delete(id: string): Promise<void> {
    rawLog(`[MessageService.delete] STEP1 enter id=${id}`);

    rawLog(`[MessageService.delete] STEP2 before SQL`);
    const deleted = await this.sql`
      DELETE FROM message
      WHERE id = ${id}
      RETURNING id
    `;
    rawLog(`[MessageService.delete] STEP3 SQL returned rows=${deleted.length}`);

    if (deleted.length === 0) {
      throw new NotFoundException('留言不存在');
    }
  }
}
