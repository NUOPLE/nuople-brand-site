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
const drizzle_orm_1 = require("drizzle-orm");
const connection_1 = require("../../database/connection");
const schema_1 = require("../../database/schema");
let MessageService = class MessageService {
    db;
    constructor(db) {
        this.db = db;
    }
    async getList(page, pageSize, status) {
        const whereConditions = [];
        if (status === 'unread') {
            whereConditions.push((0, drizzle_orm_1.eq)(schema_1.message.isRead, false));
        }
        else if (status === 'read') {
            whereConditions.push((0, drizzle_orm_1.eq)(schema_1.message.isRead, true));
        }
        const whereClause = whereConditions.length > 0 ? (0, drizzle_orm_1.and)(...whereConditions) : undefined;
        const [itemsResult, totalResult, unreadResult] = await Promise.all([
            this.db
                .select({
                id: schema_1.message.id,
                name: schema_1.message.name,
                email: schema_1.message.email,
                content: schema_1.message.content,
                createdAt: schema_1.message.createdAt,
                isRead: schema_1.message.isRead,
                hasReply: (0, drizzle_orm_1.sql) `${schema_1.message.replyContent} IS NOT NULL`,
            })
                .from(schema_1.message)
                .where(whereClause)
                .orderBy((0, drizzle_orm_1.desc)(schema_1.message.createdAt))
                .limit(pageSize)
                .offset((page - 1) * pageSize),
            this.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.message)
                .where(whereClause),
            this.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.message)
                .where((0, drizzle_orm_1.eq)(schema_1.message.isRead, false)),
        ]);
        const items = itemsResult.map((row) => ({
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
    async getById(id) {
        const rows = await this.db
            .select()
            .from(schema_1.message)
            .where((0, drizzle_orm_1.eq)(schema_1.message.id, id))
            .limit(1);
        if (rows.length === 0) {
            throw new common_1.NotFoundException('留言不存在');
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
    async updateReadStatus(id, isRead) {
        const updated = await this.db
            .update(schema_1.message)
            .set({ isRead, updatedAt: (0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP` })
            .where((0, drizzle_orm_1.eq)(schema_1.message.id, id))
            .returning({ id: schema_1.message.id });
        if (updated.length === 0) {
            throw new common_1.NotFoundException('留言不存在');
        }
    }
    async reply(id, replyContent) {
        const updated = await this.db
            .update(schema_1.message)
            .set({
            replyContent,
            repliedAt: (0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`,
            isRead: true,
            updatedAt: (0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.message.id, id))
            .returning({ repliedAt: schema_1.message.repliedAt });
        if (updated.length === 0) {
            throw new common_1.NotFoundException('留言不存在');
        }
        return { repliedAt: updated[0].repliedAt.toISOString() };
    }
    async delete(id) {
        const deleted = await this.db
            .delete(schema_1.message)
            .where((0, drizzle_orm_1.eq)(schema_1.message.id, id))
            .returning({ id: schema_1.message.id });
        if (deleted.length === 0) {
            throw new common_1.NotFoundException('留言不存在');
        }
    }
};
exports.MessageService = MessageService;
exports.MessageService = MessageService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(connection_1.DRIZZLE_DATABASE)),
    __metadata("design:paramtypes", [Function])
], MessageService);
