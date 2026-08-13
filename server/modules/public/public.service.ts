import { Inject, Injectable } from '@nestjs/common';
import { eq, and, like, count, desc, asc } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { DRIZZLE_DATABASE } from '../../database/connection';
import { work, keywordRule, message, siteSetting } from '../../database/schema';
import type {
  PublicWorkListItem,
  PublicWorkListResponse,
  PublicWorkDetail,
  PublicSiteSettings,
  PublicKeywordRule,
  PublicKeywordRulesResponse,
  PublicMessageSubmitRequest,
  PublicMessageSubmitResponse,
  PublicFeaturedWorksResponse,
  ServiceItem,
  ProcessStep,
  ContactInfo,
  FooterInfo,
  WorkCategory,
} from '@shared/api.interface';

const DEFAULT_SETTINGS: PublicSiteSettings = {
  siteTitle: 'NUOPLE BRAND & ART',
  companyName: '诺品牌设计工作室',
  logoImage: '',
  heroSlogan: 'BRAND & ART',
  heroSubtitle: '专注品牌视觉设计',
  aboutUs:
    '我们是一家专注于品牌视觉设计的创意工作室，致力于为客户打造独特的品牌形象和视觉体验。\n\n从品牌策略到视觉落地，我们以专业的设计能力和对细节的极致追求，帮助每一个品牌找到属于自己的声音。',
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

@Injectable()
export class PublicService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getFeaturedWorks(limit = 5): Promise<PublicFeaturedWorksResponse> {
    const items = await this.db
      .select({
        id: work.id,
        title: work.title,
        category: work.category,
        client: work.client,
        year: work.year,
        description: work.description,
        coverImage: work.coverImage,
        tags: work.tags,
      })
      .from(work)
      .orderBy(desc(work.createdAt))
      .limit(limit);

    return {
      items: items.map((row) => ({
        id: row.id,
        title: row.title,
        category: row.category as WorkCategory,
        client: row.client,
        year: row.year,
        description: row.description,
        coverImage: row.coverImage,
        tags: row.tags,
      })),
    };
  }

  async getWorkList(params: {
    page: number;
    pageSize: number;
    category?: string;
  }): Promise<PublicWorkListResponse> {
    const { page, pageSize, category } = params;
    const conditions = [];
    if (category) {
      conditions.push(eq(work.category, category));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, items] = await Promise.all([
      this.db.select({ count: count() }).from(work).where(where),
      this.db
        .select({
          id: work.id,
          title: work.title,
          category: work.category,
          client: work.client,
          year: work.year,
          description: work.description,
          coverImage: work.coverImage,
          tags: work.tags,
        })
        .from(work)
        .where(where)
        .orderBy(desc(work.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return {
      items: items.map((row) => ({
        id: row.id,
        title: row.title,
        category: row.category as WorkCategory,
        client: row.client,
        year: row.year,
        description: row.description,
        coverImage: row.coverImage,
        tags: row.tags,
      })),
      total,
    };
  }

  async getWorkById(id: string): Promise<PublicWorkDetail | null> {
    const rows = await this.db.select().from(work).where(eq(work.id, id)).limit(1);
    if (rows.length === 0) return null;
    const row = rows[0]!;
    return {
      id: row.id,
      title: row.title,
      category: row.category as WorkCategory,
      client: row.client,
      industry: row.industry,
      designType: row.designType,
      year: row.year,
      description: row.description,
      tags: row.tags,
      content: row.content,
      coverImage: row.coverImage,
      heroImage: row.heroImage,
      gallery: row.gallery as PublicWorkDetail['gallery'],
      createdAt: row.createdAt.toISOString(),
    };
  }

  async getNextWork(id: string): Promise<PublicWorkListItem | null> {
    const current = await this.db
      .select({ createdAt: work.createdAt })
      .from(work)
      .where(eq(work.id, id))
      .limit(1);
    if (current.length === 0) return null;

    const rows = await this.db
      .select({
        id: work.id,
        title: work.title,
        category: work.category,
        client: work.client,
        year: work.year,
        description: work.description,
        coverImage: work.coverImage,
        tags: work.tags,
      })
      .from(work)
      .where(asc(work.createdAt))
      .orderBy(asc(work.createdAt))
      .limit(1);

    if (rows.length === 0) return null;
    const row = rows[0]!;
    if (row.id === id) return null;
    return {
      id: row.id,
      title: row.title,
      category: row.category as WorkCategory,
      client: row.client,
      year: row.year,
      description: row.description,
      coverImage: row.coverImage,
      tags: row.tags,
    };
  }

  async getSiteSettings(): Promise<PublicSiteSettings> {
    const rows = await this.db.select().from(siteSetting);
    const map = new Map<string, string>();
    for (const row of rows) {
      map.set(row.settingKey, row.settingValue);
    }

    const parseJson = <T>(key: string, fallback: T): T => {
      const val = map.get(key);
      if (!val) return fallback;
      try {
        return JSON.parse(val) as T;
      } catch {
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
      services: parseJson<ServiceItem[]>('services', DEFAULT_SETTINGS.services),
      designProcess: parseJson<ProcessStep[]>(
        'design_process',
        DEFAULT_SETTINGS.designProcess,
      ),
      contact: parseJson<ContactInfo>('contact', DEFAULT_SETTINGS.contact),
      footer: parseJson<FooterInfo>('footer', DEFAULT_SETTINGS.footer),
    };
  }

  async getKeywordRules(): Promise<PublicKeywordRulesResponse> {
    const rows = await this.db
      .select({
        id: keywordRule.id,
        keywords: keywordRule.keywords,
        replyContent: keywordRule.replyContent,
      })
      .from(keywordRule)
      .orderBy(asc(keywordRule.sortOrder), asc(keywordRule.createdAt));

    return {
      items: rows.map((row) => ({
        id: row.id,
        keywords: row.keywords,
        replyContent: row.replyContent,
      })),
    };
  }

  async submitMessage(
    dto: PublicMessageSubmitRequest,
  ): Promise<PublicMessageSubmitResponse> {
    const result = await this.db
      .insert(message)
      .values({
        name: dto.name,
        email: dto.email,
        content: dto.content,
        isRead: false,
      })
      .returning({ id: message.id });
    return { success: true, id: result[0]!.id };
  }
}
