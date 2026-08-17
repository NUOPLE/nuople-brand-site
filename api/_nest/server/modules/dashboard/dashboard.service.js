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
const cache_1 = require("../../common/cache");
const rawLog = globalThis.console.log.bind(globalThis.console);
const rawError = globalThis.console.error.bind(globalThis.console);
const STATS_TIMEOUT_MS = 10000;
const STATS_CACHE_TTL = 30;
const STATS_CACHE_KEY = 'dashboard:stats';
const logger = new common_1.Logger('DashboardService');
function withTimeout(promise, ms, label) {
    return new Promise((resolve, reject) => {
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
const EMPTY_STATS = {
    totalWorks: 0,
    totalMessages: 0,
    unreadMessages: 0,
    totalKeywordRules: 0,
    recentMessages: [],
    categoryStats: [],
};
let DashboardService = class DashboardService {
    db;
    constructor(db) {
        this.db = db;
    }
    get rawSql() {
        return this.db.$client;
    }
    async getStats() {
        rawLog('[DashboardService] getStats STEP1 enter');
        (0, connection_1.logPoolStats)('dashboard-before');
        const cached = (0, cache_1.getCache)(STATS_CACHE_KEY);
        if (cached) {
            rawLog('[DashboardService] getStats returning cached result');
            return cached;
        }
        try {
            const sql = this.rawSql;
            const result = await withTimeout((async () => {
                rawLog('[DashboardService] getStats STEP2 inside withTimeout, running 6 parallel SELECTs...');
                const [totalWorksRows, totalMessagesRows, unreadMessagesRows, totalKeywordRulesRows, recentMessagesRows, categoryStatsRows,] = await Promise.all([
                    sql `SELECT COUNT(*)::bigint AS count FROM work`,
                    sql `SELECT COUNT(*)::bigint AS count FROM message`,
                    sql `SELECT COUNT(*)::bigint AS count FROM message WHERE is_read = FALSE`,
                    sql `SELECT COUNT(*)::bigint AS count FROM keyword_rule`,
                    sql `
              SELECT id, name, content, _created_at, is_read
              FROM message
              ORDER BY _created_at DESC
              LIMIT 5
            `,
                    sql `SELECT category, COUNT(*)::bigint AS count FROM work GROUP BY category`,
                ]);
                rawLog('[DashboardService] getStats STEP3 all 6 queries returned');
                const recentMessages = recentMessagesRows.map((m) => ({
                    id: m.id,
                    name: m.name,
                    content: m.content,
                    createdAt: new Date(m._created_at).toISOString(),
                    isRead: m.is_read,
                }));
                const categoryStats = categoryStatsRows.map((row) => ({
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
            })(), STATS_TIMEOUT_MS, 'dashboard-stats');
            rawLog('[DashboardService] getStats STEP4 success');
            (0, connection_1.logPoolStats)('dashboard-after');
            (0, cache_1.setCache)(STATS_CACHE_KEY, result, STATS_CACHE_TTL);
            return result;
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            rawError(`[DashboardService] getStats FAILED (returning zeros): ${msg}`);
            if (err instanceof Error && err.stack) {
                rawError(`[DashboardService] Stack: ${err.stack}`);
            }
            let current = err;
            for (let depth = 0; depth < 4 && current && typeof current === 'object'; depth += 1) {
                const { code, severity, detail, schema, table, hint } = current;
                if (code !== undefined || detail !== undefined) {
                    rawError(`[DashboardService] PostgresError depth=${depth}: code=${code}, severity=${severity}, detail=${detail}, schema=${schema}, table=${table}, hint=${hint}`);
                }
                const { cause } = current;
                current = cause;
            }
            logger.error(`getStats failed, returning empty stats: ${msg}`);
            (0, connection_1.logPoolStats)('dashboard-failed');
            return EMPTY_STATS;
        }
    }
    clearCache() {
        (0, cache_1.delCachePattern)('dashboard:');
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(connection_1.DRIZZLE_DATABASE)),
    __metadata("design:paramtypes", [Function])
], DashboardService);
