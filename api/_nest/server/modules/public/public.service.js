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
exports.PublicService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const connection_1 = require("../../database/connection");
const schema_1 = require("../../database/schema");
const DEFAULT_SETTINGS = {
    siteTitle: 'NUOPLE BRAND & ART',
    companyName: '诺品牌设计工作室',
    logoImage: '',
    heroSlogan: 'BRAND & ART',
    heroSubtitle: '专注品牌视觉设计',
    aboutUs: '我们是一家专注于品牌视觉设计的创意工作室，致力于为客户打造独特的品牌形象和视觉体验。\n\n从品牌策略到视觉落地，我们以专业的设计能力和对细节的极致追求，帮助每一个品牌找到属于自己的声音。',
    services: [
        {
            title: 'LOGO设计',
            description: '为品牌打造独一无二的视觉标识，让品牌在市场中脱颖而出。',
        },
        {
            title: 'VIS视觉识别系统',
            description: '构建完整的品牌视觉体系，确保品牌形象的一致性和专业性。',
        },
        {
            title: '包装设计',
            description: '用设计提升产品价值，让包装成为消费者与品牌的第一次对话。',
        },
    ],
    designProcess: [
        { title: '品牌调研', description: '深入了解品牌背景、市场环境与目标受众' },
        { title: '策略定位', description: '明确品牌核心价值与视觉方向' },
        { title: '视觉设计', description: '创意执行，打造专属视觉语言' },
        { title: '落地交付', description: '全链路跟进，确保设计完美呈现' },
    ],
    contact: {
        phone: '400-888-8888',
        email: 'hello@nuople.com',
        address: '北京市朝阳区创意设计园区A座301',
    },
    footer: {
        copyright: '© 2024 NUOPLE BRAND & ART. All rights reserved.',
        socialLinks: 'Weibo / Instagram / Behance',
    },
};
let PublicService = class PublicService {
    db;
    constructor(db) {
        this.db = db;
    }
    async getFeaturedWorks(limit = 5) {
        const items = await this.db
            .select({
            id: schema_1.work.id,
            title: schema_1.work.title,
            category: schema_1.work.category,
            client: schema_1.work.client,
            year: schema_1.work.year,
            description: schema_1.work.description,
            coverImage: schema_1.work.coverImage,
            tags: schema_1.work.tags,
        })
            .from(schema_1.work)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.work.createdAt))
            .limit(limit);
        return {
            items: items.map((row) => ({
                id: row.id,
                title: row.title,
                category: row.category,
                client: row.client,
                year: row.year,
                description: row.description,
                coverImage: row.coverImage,
                tags: row.tags,
            })),
        };
    }
    async getWorkList(params) {
        const { page, pageSize, category } = params;
        const conditions = [];
        if (category) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.work.category, category));
        }
        const where = conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
        const [countResult, items] = await Promise.all([
            this.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.work).where(where),
            this.db
                .select({
                id: schema_1.work.id,
                title: schema_1.work.title,
                category: schema_1.work.category,
                client: schema_1.work.client,
                year: schema_1.work.year,
                description: schema_1.work.description,
                coverImage: schema_1.work.coverImage,
                tags: schema_1.work.tags,
            })
                .from(schema_1.work)
                .where(where)
                .orderBy((0, drizzle_orm_1.desc)(schema_1.work.createdAt))
                .limit(pageSize)
                .offset((page - 1) * pageSize),
        ]);
        const total = Number(countResult[0]?.count ?? 0);
        return {
            items: items.map((row) => ({
                id: row.id,
                title: row.title,
                category: row.category,
                client: row.client,
                year: row.year,
                description: row.description,
                coverImage: row.coverImage,
                tags: row.tags,
            })),
            total,
        };
    }
    async getWorkById(id) {
        const rows = await this.db.select().from(schema_1.work).where((0, drizzle_orm_1.eq)(schema_1.work.id, id)).limit(1);
        if (rows.length === 0)
            return null;
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
        };
    }
    async getNextWork(id) {
        const current = await this.db
            .select({ createdAt: schema_1.work.createdAt })
            .from(schema_1.work)
            .where((0, drizzle_orm_1.eq)(schema_1.work.id, id))
            .limit(1);
        if (current.length === 0)
            return null;
        const rows = await this.db
            .select({
            id: schema_1.work.id,
            title: schema_1.work.title,
            category: schema_1.work.category,
            client: schema_1.work.client,
            year: schema_1.work.year,
            description: schema_1.work.description,
            coverImage: schema_1.work.coverImage,
            tags: schema_1.work.tags,
        })
            .from(schema_1.work)
            .where((0, drizzle_orm_1.asc)(schema_1.work.createdAt))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.work.createdAt))
            .limit(1);
        if (rows.length === 0)
            return null;
        const row = rows[0];
        if (row.id === id)
            return null;
        return {
            id: row.id,
            title: row.title,
            category: row.category,
            client: row.client,
            year: row.year,
            description: row.description,
            coverImage: row.coverImage,
            tags: row.tags,
        };
    }
    async getSiteSettings() {
        const rows = await this.db.select().from(schema_1.siteSetting);
        const map = new Map();
        for (const row of rows) {
            map.set(row.settingKey, row.settingValue);
        }
        const parseJson = (key, fallback) => {
            const val = map.get(key);
            if (!val)
                return fallback;
            try {
                return JSON.parse(val);
            }
            catch {
                return fallback;
            }
        };
        return {
            siteTitle: map.get('site_title') || DEFAULT_SETTINGS.siteTitle,
            companyName: map.get('company_name') || DEFAULT_SETTINGS.companyName,
            logoImage: map.get('logo_image') || DEFAULT_SETTINGS.logoImage,
            heroSlogan: map.get('hero_slogan') || DEFAULT_SETTINGS.heroSlogan,
            heroSubtitle: map.get('hero_subtitle') || DEFAULT_SETTINGS.heroSubtitle,
            aboutUs: map.get('about_us') || DEFAULT_SETTINGS.aboutUs,
            services: parseJson('services', DEFAULT_SETTINGS.services),
            designProcess: parseJson('design_process', DEFAULT_SETTINGS.designProcess),
            contact: parseJson('contact', DEFAULT_SETTINGS.contact),
            footer: parseJson('footer', DEFAULT_SETTINGS.footer),
        };
    }
    async getKeywordRules() {
        const rows = await this.db
            .select({
            id: schema_1.keywordRule.id,
            keywords: schema_1.keywordRule.keywords,
            replyContent: schema_1.keywordRule.replyContent,
        })
            .from(schema_1.keywordRule)
            .orderBy((0, drizzle_orm_1.asc)(schema_1.keywordRule.sortOrder), (0, drizzle_orm_1.asc)(schema_1.keywordRule.createdAt));
        return {
            items: rows.map((row) => ({
                id: row.id,
                keywords: row.keywords,
                replyContent: row.replyContent,
            })),
        };
    }
    async submitMessage(dto) {
        const result = await this.db
            .insert(schema_1.message)
            .values({
            name: dto.name,
            email: dto.email,
            content: dto.content,
            isRead: false,
        })
            .returning({ id: schema_1.message.id });
        return { success: true, id: result[0].id };
    }
};
exports.PublicService = PublicService;
exports.PublicService = PublicService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(connection_1.DRIZZLE_DATABASE)),
    __metadata("design:paramtypes", [Function])
], PublicService);
