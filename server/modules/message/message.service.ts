import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, logPoolStats } from '../../database/connection';
import { getCache, setCache, delCachePattern } from '../../common/cache';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type {
  Message,
  MessageListItem,
  MessageListResponse,
  MessageStatusFilter,
} from '@shared/api.interface';

const DB_TIMEOUT_MS = 10000;
const LIST_CACHE_TTL = 10;
const rawLog = globalThis.console.log.bind(globalThis.console);
const rawError = globalThis.console.error.bind(globalThis.console);

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      rawError(`[MessageService] TIMEOUT: ${label} after ${ms}ms`);
      reject(new Error(`DB operation timed out after ${ms}ms: ${label}`));
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
    logPoolStats('getList-before');

    const cacheKey = `message:list:${page}:${pageSize}:${status}`;
    const cached = getCache<MessageListResponse>(cacheKey);
    if (cached) {
      rawLog(`[MessageService.getList] cache hit for ${cacheKey}`);
      return cached;
    }

    const whereSql = status === 'unread'
      ? this.sql`WHERE is_read = FALSE`
      : status === 'read'
      ? this.sql`WHERE is_read = TRUE`
      : this.sql``;

    const offset = (page - 1) * pageSize;

    rawLog(`[MessageService.getList] STEP2 before SQL`);
    const start = Date.now();
    try {
      const [itemsResult, totalResult, unreadResult] = await withTimeout(
        Promise.all([
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
        ]),
        DB_TIMEOUT_MS,
        'message-list',
      );
       const elapsed = Date.now() - start;
       rawLog(`[MessageService.getList] STEP3 done in ${elapsed}ms items=${itemsResult.length} total=${totalResult[0]?.count} unread=${unreadResult[0]?.count}`);
       logPoolStats('getList-after');

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

      setCache(cacheKey, { items, total, totalUnread }, LIST_CACHE_TTL);
      return { items, total, totalUnread };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      rawError(`[MessageService.getList] FAILED after ${Date.now() - start}ms: ${msg}`);
      logPoolStats('getList-failed');
      return { items: [], total: 0, totalUnread: 0 };
    }
  }

  async getById(id: string): Promise<Message> {
    rawLog(`[MessageService.getById] STEP1 enter id=${id}`);

    rawLog(`[MessageService.getById] STEP2 before SQL`);
    try {
      const rows = await withTimeout(
        this.sql`
        SELECT id, name, email, content, is_read, reply_content, replied_at, _created_at
        FROM message
        WHERE id = ${id}
        LIMIT 1
      `,
        DB_TIMEOUT_MS,
        'message-get-by-id',
      );
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
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      rawError(`[MessageService.getById] FAILED: ${msg}`);
      throw err;
    }
  }

  async updateReadStatus(id: string, isRead: boolean): Promise<void> {
    rawLog(`[MessageService.updateReadStatus] STEP1 enter id=${id} isRead=${isRead}`);

    rawLog(`[MessageService.updateReadStatus] STEP2 before SQL`);
    try {
      const updated = await withTimeout(
        this.sql`
        UPDATE message
        SET is_read = ${isRead}, _updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING id
      `,
        DB_TIMEOUT_MS,
        'message-update-read',
      );
      rawLog(`[MessageService.updateReadStatus] STEP3 SQL returned rows=${updated.length}`);

      if (updated.length === 0) {
        throw new NotFoundException('留言不存在');
      }
      delCachePattern('message:');
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      rawError(`[MessageService.updateReadStatus] FAILED: ${msg}`);
      throw err;
    }
  }

  async reply(id: string, replyContent: string): Promise<{ repliedAt: string }> {
    rawLog(`[MessageService.reply] STEP1 enter id=${id}`);

    rawLog(`[MessageService.reply] STEP2 before SQL`);
    try {
      const updated = await withTimeout(
        this.sql`
        UPDATE message
        SET reply_content = ${replyContent},
            replied_at = CURRENT_TIMESTAMP,
            is_read = TRUE,
            _updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING replied_at
      `,
        DB_TIMEOUT_MS,
        'message-reply',
      );
      rawLog(`[MessageService.reply] STEP3 SQL returned rows=${updated.length}`);

      if (updated.length === 0) {
        throw new NotFoundException('留言不存在');
      }

      delCachePattern('message:');
      return { repliedAt: new Date((updated[0] as any).replied_at).toISOString() };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      rawError(`[MessageService.reply] FAILED: ${msg}`);
      throw err;
    }
  }

  async delete(id: string): Promise<void> {
    rawLog(`[MessageService.delete] STEP1 enter id=${id}`);

    rawLog(`[MessageService.delete] STEP2 before SQL`);
    try {
      const deleted = await withTimeout(
        this.sql`
        DELETE FROM message
        WHERE id = ${id}
        RETURNING id
      `,
        DB_TIMEOUT_MS,
        'message-delete',
      );
      rawLog(`[MessageService.delete] STEP3 SQL returned rows=${deleted.length}`);

      if (deleted.length === 0) {
        throw new NotFoundException('留言不存在');
      }
      delCachePattern('message:');
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      rawError(`[MessageService.delete] FAILED: ${msg}`);
      throw err;
    }
  }
}
