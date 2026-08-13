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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const connection_1 = require("../../database/connection");
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("@server/database/schema");
let DashboardService = class DashboardService {
    db;
    constructor(db) {
        this.db = db;
    }
    async getStats() {
        const [totalWorksResult, totalMessagesResult, unreadMessagesResult, totalKeywordRulesResult, recentMessagesResult, categoryStatsResult,] = await Promise.all([
            this.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.work),
            this.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.message),
            this.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.message).where((0, drizzle_orm_1.eq)(schema_1.message.isRead, false)),
            this.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.keywordRule),
            this.db
                .select({
                id: schema_1.message.id,
                name: schema_1.message.name,
                content: schema_1.message.content,
                createdAt: schema_1.message.createdAt,
                isRead: schema_1.message.isRead,
            })
                .from(schema_1.message)
                .orderBy((0, drizzle_orm_1.desc)(schema_1.message.createdAt))
                .limit(5),
            this.db
                .select({
                category: schema_1.work.category,
                count: (0, drizzle_orm_1.count)(),
            })
                .from(schema_1.work)
                .groupBy(schema_1.work.category),
        ]);
        const recentMessages = recentMessagesResult.map((m) => ({
            id: m.id,
            name: m.name,
            content: m.content,
            createdAt: m.createdAt.toISOString(),
            isRead: m.isRead,
        }));
        const categoryStats = categoryStatsResult.map((row) => ({
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
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(connection_1.DRIZZLE_DATABASE)),
    __metadata("design:paramtypes", [Function])
], DashboardService);
