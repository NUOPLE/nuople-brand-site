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
exports.WorkService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const connection_1 = require("../../database/connection");
const schema_1 = require("../../database/schema");
let WorkService = class WorkService {
    db;
    constructor(db) {
        this.db = db;
    }
    async getList(params) {
        const { page, pageSize, keyword, category } = params;
        const conditions = [];
        if (keyword) {
            conditions.push((0, drizzle_orm_1.like)(schema_1.work.title, `%${keyword}%`));
        }
        if (category) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.work.category, category));
        }
        const where = conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
        const [countResult, items] = await Promise.all([
            this.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.work)
                .where(where),
            this.db
                .select({
                id: schema_1.work.id,
                title: schema_1.work.title,
                category: schema_1.work.category,
                client: schema_1.work.client,
                year: schema_1.work.year,
                coverImage: schema_1.work.coverImage,
            })
                .from(schema_1.work)
                .where(where)
                .orderBy((0, drizzle_orm_1.desc)(schema_1.work.createdAt))
                .limit(pageSize)
                .offset((page - 1) * pageSize),
        ]);
        const total = Number(countResult[0]?.count ?? 0);
        return {
            items: items,
            total,
        };
    }
    async getById(id) {
        const rows = await this.db.select().from(schema_1.work).where((0, drizzle_orm_1.eq)(schema_1.work.id, id)).limit(1);
        if (rows.length === 0) {
            throw new common_1.NotFoundException('作品不存在');
        }
        const row = rows[0];
        return {
            id: row.id,
            title: row.title,
            category: row.category,
            client: row.client,
            industry: row.industry,
            designType: row.designType,
            year: row.year,
            description: row.description,
            tags: row.tags,
            content: row.content,
            coverImage: row.coverImage,
            heroImage: row.heroImage,
            gallery: row.gallery,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
        };
    }
    async create(dto) {
        const result = await this.db
            .insert(schema_1.work)
            .values({
            title: dto.title,
            category: dto.category,
            client: dto.client,
            industry: dto.industry,
            designType: dto.designType,
            year: dto.year,
            description: dto.description,
            tags: dto.tags,
            content: dto.content,
            coverImage: dto.coverImage,
            heroImage: dto.heroImage,
            gallery: dto.gallery,
        })
            .returning({ id: schema_1.work.id });
        return { id: result[0].id };
    }
    async update(id, dto) {
        const result = await this.db
            .update(schema_1.work)
            .set({
            title: dto.title,
            category: dto.category,
            client: dto.client,
            industry: dto.industry,
            designType: dto.designType,
            year: dto.year,
            description: dto.description,
            tags: dto.tags,
            content: dto.content,
            coverImage: dto.coverImage,
            heroImage: dto.heroImage,
            gallery: dto.gallery,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.work.id, id))
            .returning({ id: schema_1.work.id });
        if (result.length === 0) {
            throw new common_1.NotFoundException('作品不存在');
        }
        return { success: true };
    }
    async remove(id) {
        const result = await this.db
            .delete(schema_1.work)
            .where((0, drizzle_orm_1.eq)(schema_1.work.id, id))
            .returning({ id: schema_1.work.id });
        if (result.length === 0) {
            throw new common_1.NotFoundException('作品不存在');
        }
        return { success: true };
    }
};
exports.WorkService = WorkService;
exports.WorkService = WorkService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(connection_1.DRIZZLE_DATABASE)),
    __metadata("design:paramtypes", [Function])
], WorkService);
