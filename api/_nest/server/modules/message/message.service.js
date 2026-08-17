"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageService = void 0;
const common_1 = require("@nestjs/common");
const connection_1 = require("../../database/connection");
const cache_1 = require("../../common/cache");
const DB_TIMEOUT_MS = 10000;
const LIST_CACHE_TTL = 10;
const rawLog = globalThis.console.log.bind(globalThis.console);
const rawError = globalThis.console.error.bind(globalThis.console);
function withTimeout(promise, ms, label) {
    return new Promise((resolve, reject) => {
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
let MessageService = class MessageService {
    db;
    constructor(db) {
        this.db = db;
    }
    get sql() {
        return this.db.$client;
    }
    async getList(page, pageSize, status) {
        rawLog(`[MessageService.getList] STEP1 enter page=${page} pageSize=${pageSize} status=${status}`);
        (0, connection_1.logPoolStats)('getList-before');
        const cacheKey = `message:list:${page}:${pageSize}:${status}`;
        const cached = (0, cache_1.getCache)(cacheKey);
        if (cached) {
            rawLog(`[MessageService.getList] cache hit for ${cacheKey}`);
            return cached;
        }
        const whereSql = status === 'unread'
            ? this.sql `WHERE is_read = FALSE`
            : status === 'read'
                ? this.sql `WHERE is_read = TRUE`
                : this.sql ``;
        const offset = (page - 1) * pageSize;
        rawLog(`[MessageService.getList] STEP2 before SQL`);
        const start = Date.now();
        try {
            const [itemsResult, totalResult, unreadResult] = await withTimeout(Promise.all([
                this.sql `
            SELECT id, name, email, content, _created_at, is_read, reply_content IS NOT NULL AS has_reply
            FROM message
            ${whereSql}
            ORDER BY _created_at DESC
            LIMIT ${pageSize} OFFSET ${offset}
          `,
                this.sql `
            SELECT COUNT(*)::bigint AS count
            FROM message
            ${whereSql}
          `,
                this.sql `
            SELECT COUNT(*)::bigint AS count
            FROM message
            WHERE is_read = FALSE
          `,
            ]), DB_TIMEOUT_MS, 'message-list');
            const elapsed = Date.now() - start;
            rawLog(`[MessageService.getList] STEP3 done in ${elapsed}ms items=${itemsResult.length} total=${totalResult[0]?.count} unread=${unreadResult[0]?.count}`);
            (0, connection_1.logPoolStats)('getList-after');
            const items = itemsResult.map((row) => ({
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
            (0, cache_1.setCache)(cacheKey, { items, total, totalUnread }, LIST_CACHE_TTL);
            return { items, total, totalUnread };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            rawError(`[MessageService.getList] FAILED after ${Date.now() - start}ms: ${msg}`);
            (0, connection_1.logPoolStats)('getList-failed');
            return { items: [], total: 0, totalUnread: 0 };
        }
    }
    async getById(id) {
        rawLog(`[MessageService.getById] STEP1 enter id=${id}`);
        rawLog(`[MessageService.getById] STEP2 before SQL`);
        try {
            const rows = await withTimeout(this.sql `
        SELECT id, name, email, content, is_read, reply_content, replied_at, _created_at
        FROM message
        WHERE id = ${id}
        LIMIT 1
      `, DB_TIMEOUT_MS, 'message-get-by-id');
            rawLog(`[MessageService.getById] STEP3 SQL returned rows=${rows.length}`);
            if (rows.length === 0) {
                throw new common_1.NotFoundException('留言不存在');
            }
            const row = rows[0];
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
        catch (err) {
            if (err instanceof common_1.NotFoundException)
                throw err;
            const msg = err instanceof Error ? err.message : String(err);
            rawError(`[MessageService.getById] FAILED: ${msg}`);
            throw err;
        }
    }
    async updateReadStatus(id, isRead) {
        rawLog(`[MessageService.updateReadStatus] STEP1 enter id=${id} isRead=${isRead}`);
        rawLog(`[MessageService.updateReadStatus] STEP2 before SQL`);
        try {
            const updated = await withTimeout(this.sql `
        UPDATE message
        SET is_read = ${isRead}, _updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING id
      `, DB_TIMEOUT_MS, 'message-update-read');
            rawLog(`[MessageService.updateReadStatus] STEP3 SQL returned rows=${updated.length}`);
            if (updated.length === 0) {
                throw new common_1.NotFoundException('留言不存在');
            }
            (0, cache_1.delCachePattern)('message:');
        }
        catch (err) {
            if (err instanceof common_1.NotFoundException)
                throw err;
            const msg = err instanceof Error ? err.message : String(err);
            rawError(`[MessageService.updateReadStatus] FAILED: ${msg}`);
            throw err;
        }
    }
    async reply(id, replyContent) {
        rawLog(`[MessageService.reply] STEP1 enter id=${id}`);
        rawLog(`[MessageService.reply] STEP2 before SQL`);
        try {
            const updated = await withTimeout(this.sql `
        UPDATE message
        SET reply_content = ${replyContent},
            replied_at = CURRENT_TIMESTAMP,
            is_read = TRUE,
            _updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING replied_at
      `, DB_TIMEOUT_MS, 'message-reply');
            rawLog(`[MessageService.reply] STEP3 SQL returned rows=${updated.length}`);
            if (updated.length === 0) {
                throw new common_1.NotFoundException('留言不存在');
            }
            (0, cache_1.delCachePattern)('message:');
            return { repliedAt: new Date(updated[0].replied_at).toISOString() };
        }
        catch (err) {
            if (err instanceof common_1.NotFoundException)
                throw err;
            const msg = err instanceof Error ? err.message : String(err);
            rawError(`[MessageService.reply] FAILED: ${msg}`);
            throw err;
        }
    }
    async delete(id) {
        rawLog(`[MessageService.delete] STEP1 enter id=${id}`);
        rawLog(`[MessageService.delete] STEP2 before SQL`);
        try {
            const deleted = await withTimeout(this.sql `
        DELETE FROM message
        WHERE id = ${id}
        RETURNING id
      `, DB_TIMEOUT_MS, 'message-delete');
            rawLog(`[MessageService.delete] STEP3 SQL returned rows=${deleted.length}`);
            if (deleted.length === 0) {
                throw new common_1.NotFoundException('留言不存在');
            }
            (0, cache_1.delCachePattern)('message:');
        }
        catch (err) {
            if (err instanceof common_1.NotFoundException)
                throw err;
            const msg = err instanceof Error ? err.message : String(err);
            rawError(`[MessageService.delete] FAILED: ${msg}`);
            throw err;
        }
    }
};
exports.MessageService = MessageService;
exports.MessageService = MessageService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(connection_1.DRIZZLE_DATABASE)),
    __metadata("design:paramtypes", [Function])
], MessageService);
