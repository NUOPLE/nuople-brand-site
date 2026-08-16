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
exports.KeywordRuleService = void 0;
const common_1 = require("@nestjs/common");
const connection_1 = require("../../database/connection");
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../../database/schema");
let KeywordRuleService = class KeywordRuleService {
    db;
    constructor(db) {
        this.db = db;
    }
    async list() {
        const rules = await this.db
            .select({
            id: schema_1.keywordRule.id,
            keywords: schema_1.keywordRule.keywords,
            replyContent: schema_1.keywordRule.replyContent,
            sortOrder: schema_1.keywordRule.sortOrder,
        })
            .from(schema_1.keywordRule)
            .orderBy((0, drizzle_orm_1.asc)(schema_1.keywordRule.sortOrder));
        return { items: rules };
    }
    async create(dto) {
        const maxResult = await this.db
            .select({ max: (0, drizzle_orm_1.max)(schema_1.keywordRule.sortOrder) })
            .from(schema_1.keywordRule);
        const currentMax = maxResult[0]?.max ?? -1;
        const nextSortOrder = currentMax + 1;
        const inserted = await this.db
            .insert(schema_1.keywordRule)
            .values({
            keywords: dto.keywords,
            replyContent: dto.replyContent,
            sortOrder: nextSortOrder,
        })
            .returning({ id: schema_1.keywordRule.id });
        return { id: inserted[0].id };
    }
    async update(id, dto) {
        const updated = await this.db
            .update(schema_1.keywordRule)
            .set({
            keywords: dto.keywords,
            replyContent: dto.replyContent,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.keywordRule.id, id))
            .returning({ id: schema_1.keywordRule.id });
        if (updated.length === 0) {
            throw new common_1.NotFoundException('规则不存在');
        }
        return { success: true };
    }
    async remove(id) {
        const deleted = await this.db
            .delete(schema_1.keywordRule)
            .where((0, drizzle_orm_1.eq)(schema_1.keywordRule.id, id))
            .returning({ id: schema_1.keywordRule.id });
        if (deleted.length === 0) {
            throw new common_1.NotFoundException('规则不存在');
        }
        return { success: true };
    }
    async move(id, dto) {
        const currentArr = await this.db
            .select({
            id: schema_1.keywordRule.id,
            sortOrder: schema_1.keywordRule.sortOrder,
        })
            .from(schema_1.keywordRule)
            .where((0, drizzle_orm_1.eq)(schema_1.keywordRule.id, id));
        if (currentArr.length === 0) {
            throw new common_1.NotFoundException('规则不存在');
        }
        const current = currentArr[0];
        let neighborArr;
        if (dto.direction === 'up') {
            neighborArr = await this.db
                .select({
                id: schema_1.keywordRule.id,
                sortOrder: schema_1.keywordRule.sortOrder,
            })
                .from(schema_1.keywordRule)
                .where((0, drizzle_orm_1.lt)(schema_1.keywordRule.sortOrder, current.sortOrder))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.keywordRule.sortOrder))
                .limit(1);
        }
        else {
            neighborArr = await this.db
                .select({
                id: schema_1.keywordRule.id,
                sortOrder: schema_1.keywordRule.sortOrder,
            })
                .from(schema_1.keywordRule)
                .where((0, drizzle_orm_1.gt)(schema_1.keywordRule.sortOrder, current.sortOrder))
                .orderBy((0, drizzle_orm_1.asc)(schema_1.keywordRule.sortOrder))
                .limit(1);
        }
        if (neighborArr.length === 0) {
            return { success: true };
        }
        const neighbor = neighborArr[0];
        const currentSort = current.sortOrder;
        const neighborSort = neighbor.sortOrder;
        await this.db.transaction(async (tx) => {
            await tx
                .update(schema_1.keywordRule)
                .set({ sortOrder: neighborSort })
                .where((0, drizzle_orm_1.eq)(schema_1.keywordRule.id, id));
            await tx
                .update(schema_1.keywordRule)
                .set({ sortOrder: currentSort })
                .where((0, drizzle_orm_1.eq)(schema_1.keywordRule.id, neighbor.id));
        });
        return { success: true };
    }
};
exports.KeywordRuleService = KeywordRuleService;
exports.KeywordRuleService = KeywordRuleService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(connection_1.DRIZZLE_DATABASE)),
    __metadata("design:paramtypes", [Function])
], KeywordRuleService);
