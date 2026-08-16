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
const connection_1 = require("../../database/connection");
const rawLog = globalThis.console.log.bind(globalThis.console);
const rawError = globalThis.console.error.bind(globalThis.console);
let WorkService = class WorkService {
    db;
    constructor(db) {
        this.db = db;
    }
    get sql() {
        return this.db.$client;
    }
    async getList(params) {
        rawLog(`[WorkService.getList] STEP1 enter page=${params.page} pageSize=${params.pageSize} keyword=${params.keyword ?? ''} category=${params.category ?? ''}`);
        const { page, pageSize, keyword, category } = params;
        const offset = (page - 1) * pageSize;
        const whereKeyword = keyword ? this.sql `WHERE title LIKE ${'%' + keyword + '%'}` : this.sql ``;
        const whereCategory = category ? (keyword ? this.sql ` AND category = ${category}` : this.sql `WHERE category = ${category}`) : this.sql ``;
        rawLog('[WorkService.getList] STEP2 before SQL');
        const [countResult, itemsResult] = await Promise.all([
            this.sql `
        SELECT COUNT(*)::bigint AS count
        FROM work
        ${whereKeyword}
        ${whereCategory}
      `,
            this.sql `
        SELECT id, title, category, client, year, cover_image
        FROM work
        ${whereKeyword}
        ${whereCategory}
        ORDER BY _created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `,
        ]);
        rawLog(`[WorkService.getList] STEP3 SQL returned count=${countResult[0]?.count} rows=${itemsResult.length}`);
        const total = Number(countResult[0]?.count ?? 0);
        const items = itemsResult.map((row) => ({
            id: row.id,
            title: row.title,
            category: row.category,
            client: row.client,
            year: row.year,
            coverImage: row.cover_image,
        }));
        return { items, total };
    }
    async getById(id) {
        rawLog(`[WorkService.getById] STEP1 enter id=${id}`);
        rawLog('[WorkService.getById] STEP2 before SQL');
        const rows = await this.sql `
      SELECT id, title, category, client, industry, design_type, year, description, tags, content, cover_image, hero_image, gallery, _created_at, _updated_at
      FROM work
      WHERE id = ${id}
      LIMIT 1
    `;
        rawLog(`[WorkService.getById] STEP3 SQL returned rows=${rows.length}`);
        if (rows.length === 0) {
            throw new common_1.NotFoundException('作品不存在');
        }
        const row = rows[0];
        let gallery = [];
        try {
            gallery = JSON.parse(row.gallery);
        }
        catch (err) {
            rawError('parse gallery failed', err);
            gallery = [];
        }
        return {
            id: row.id,
            title: row.title,
            category: row.category,
            client: row.client,
            industry: row.industry,
            designType: row.design_type,
            year: row.year,
            description: row.description,
            tags: row.tags,
            content: row.content,
            coverImage: row.cover_image,
            heroImage: row.hero_image,
            gallery,
            createdAt: new Date(row._created_at).toISOString(),
            updatedAt: new Date(row._updated_at).toISOString(),
        };
    }
    async create(dto) {
        rawLog(`[WorkService.create] STEP1 enter title=${dto.title}`);
        rawLog('[WorkService.create] STEP2 before SQL');
        const result = await this.sql `
      INSERT INTO work (title, category, client, industry, design_type, year, description, tags, content, cover_image, hero_image, gallery)
      VALUES (${dto.title}, ${dto.category}, ${dto.client}, ${dto.industry}, ${dto.designType}, ${dto.year}, ${dto.description}, ${dto.tags}, ${dto.content}, ${dto.coverImage}, ${dto.heroImage}, ${JSON.stringify(dto.gallery)}::jsonb)
      RETURNING id
    `;
        rawLog(`[WorkService.create] STEP3 SQL returned id=${result[0]?.id}`);
        return { id: result[0].id };
    }
    async update(id, dto) {
        rawLog(`[WorkService.update] STEP1 enter id=${id}`);
        rawLog('[WorkService.update] STEP2 before SQL');
        const result = await this.sql `
      UPDATE work
      SET title = ${dto.title},
          category = ${dto.category},
          client = ${dto.client},
          industry = ${dto.industry},
          design_type = ${dto.designType},
          year = ${dto.year},
          description = ${dto.description},
          tags = ${dto.tags},
          content = ${dto.content},
          cover_image = ${dto.coverImage},
          hero_image = ${dto.heroImage},
          gallery = ${JSON.stringify(dto.gallery)}::jsonb,
          _updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id
    `;
        rawLog(`[WorkService.update] STEP3 SQL returned rows=${result.length}`);
        if (result.length === 0) {
            throw new common_1.NotFoundException('作品不存在');
        }
        return { success: true };
    }
    async remove(id) {
        rawLog(`[WorkService.remove] STEP1 enter id=${id}`);
        rawLog('[WorkService.remove] STEP2 before SQL');
        const result = await this.sql `
      DELETE FROM work WHERE id = ${id} RETURNING id
    `;
        rawLog(`[WorkService.remove] STEP3 SQL returned rows=${result.length}`);
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
