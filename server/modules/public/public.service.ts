import { Inject, Injectable, Logger, BadRequestException } from '@nestjs/common';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { DRIZZLE_DATABASE } from '../../database/connection';

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

const DB_TIMEOUT_MS = 15000;
const logger = new Logger('PublicService');
const rawLog = globalThis.console.log.bind(globalThis.console);
const rawError = globalThis.console.error.bind(globalThis.console);

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      const err = new Error(`DB operation timed out after ${ms}ms: ${label}`);
      rawError(`[PublicService] TIMEOUT: ${label} after ${ms}ms`);
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

  private get rawSql(): ReturnType<typeof import('postgres')> {
    return (this.db as unknown as { $client: ReturnType<typeof import('postgres')> }).$client;
  }

  async getFeaturedWorks(limit = 5): Promise<PublicFeaturedWorksResponse> {
    const t0 = Date.now();
    rawLog(`[Public] getFeaturedWorks STEP1 enter limit=${limit}`);

    try {
      const sql = this.rawSql;
      rawLog('[Public] getFeaturedWorks STEP2 before SQL');
      const rows = await withTimeout(
        sql`
          SELECT id, title, category, client, year, description, cover_image, tags
          FROM work
          ORDER BY _created_at DESC
          LIMIT ${limit}
        `,
        DB_TIMEOUT_MS,
        'get-featured-works',
      );
      rawLog(`[Public] getFeaturedWorks STEP3 after SQL: ${rows.length} rows`);

      rawLog(
        `[Public] getFeaturedWorks done: ${rows.length} items in ${Date.now() - t0}ms`,
      );

      return {
        items: rows.map((row: any) => ({
          id: row.id,
          title: row.title,
          category: row.category as WorkCategory,
          client: row.client,
          year: row.year,
          description: row.description,
          coverImage: row.cover_image,
          tags: row.tags as string[],
        })),
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      rawError(`[Public] getFeaturedWorks FAILED: ${msg}`);
      logger.error(`getFeaturedWorks failed: ${msg}`);
      return { items: [] };
    }
  }

  async getWorkList(params: {
    page: number;
    pageSize: number;
    category?: string;
  }): Promise<PublicWorkListResponse> {
    const { page, pageSize, category } = params;
    const t0 = Date.now();
    rawLog(`[Public] getWorkList STEP1 enter page=${page} pageSize=${pageSize} category=${category || 'all'}`);

    let total = 0;
    let items: Array<{
      id: string;
      title: string;
      category: string;
      client: string;
      year: string;
      description: string;
      coverImage: string;
      tags: string[];
    }> = [];

    try {
      const sql = this.rawSql;
      const offset = (page - 1) * pageSize;
      rawLog('[Public] getWorkList STEP2 before SQL (count + list parallel)');

      const [countRows, workRows] = await withTimeout(
        category
          ? Promise.all([
              sql`SELECT COUNT(*)::bigint AS count FROM work WHERE category = ${category}`,
              sql`
                SELECT id, title, category, client, year, description, cover_image, tags
                FROM work
                WHERE category = ${category}
                ORDER BY _created_at DESC
                LIMIT ${pageSize}
                OFFSET ${offset}
              `,
            ])
          : Promise.all([
              sql`SELECT COUNT(*)::bigint AS count FROM work`,
              sql`
                SELECT id, title, category, client, year, description, cover_image, tags
                FROM work
                ORDER BY _created_at DESC
                LIMIT ${pageSize}
                OFFSET ${offset}
              `,
            ]),
        DB_TIMEOUT_MS,
        `get-work-list-${page}-${pageSize}-${category || 'all'}`,
      );

      rawLog(`[Public] getWorkList STEP3 after SQL: ${workRows.length} rows, count=${countRows[0]?.count ?? 0}`);

      total = Number(countRows[0]?.count ?? 0);
      items = workRows.map((row: any) => ({
        id: row.id,
        title: row.title,
        category: row.category,
        client: row.client,
        year: row.year,
        description: row.description,
        coverImage: row.cover_image,
        tags: row.tags as string[],
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      rawError(`[Public] getWorkList FAILED: ${msg}`);
      logger.error(`getWorkList failed: ${msg}`);
      return { items: [], total: 0 };
    }

    rawLog(
      `[Public] getWorkList done: ${items.length} items, total=${total} in ${Date.now() - t0}ms`,
    );

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
    rawLog(`[Public] getWorkById STEP1 enter id=${id}`);
    const sql = this.rawSql;
    rawLog('[Public] getWorkById STEP2 before SQL');
    const rows = await sql`
      SELECT id, title, category, client, industry, design_type, year, description,
             tags, content, cover_image, hero_image, gallery, _created_at
      FROM work
      WHERE id = ${id}
      LIMIT 1
    `;
    rawLog(`[Public] getWorkById STEP3 after SQL: ${rows.length} rows`);
    if (rows.length === 0) return null;
    const row: any = rows[0]!;
    let gallery: PublicWorkDetail['gallery'] = [];
    try {
      gallery = JSON.parse(row.gallery) as PublicWorkDetail['gallery'];
    } catch {
      gallery = [];
    }
    return {
      id: row.id,
      title: row.title,
      category: row.category as WorkCategory,
      client: row.client,
      industry: row.industry,
      designType: row.design_type,
      year: row.year,
      description: row.description,
      tags: row.tags as string[],
      content: row.content,
      coverImage: row.cover_image,
      heroImage: row.hero_image,
      gallery,
      createdAt: new Date(row._created_at).toISOString(),
    };
  }

  async getNextWork(id: string): Promise<PublicWorkListItem | null> {
    rawLog(`[Public] getNextWork STEP1 enter id=${id}`);
    const sql = this.rawSql;
    rawLog('[Public] getNextWork STEP2 before SQL (get current)');

    const currentRows = await sql`
      SELECT _created_at
      FROM work
      WHERE id = ${id}
      LIMIT 1
    `;
    if (currentRows.length === 0) return null;
    const currentCreatedAt: any = currentRows[0]!._created_at;

    rawLog('[Public] getNextWork STEP3 before SQL (find next)');

    const rows = await sql`
      SELECT id, title, category, client, year, description, cover_image, tags
      FROM work
      WHERE _created_at < ${currentCreatedAt}
      ORDER BY _created_at DESC
      LIMIT 1
    `;
    rawLog(`[Public] getNextWork STEP4 after SQL: ${rows.length} rows`);

    if (rows.length === 0) return null;
    const row: any = rows[0]!;
    return {
      id: row.id,
      title: row.title,
      category: row.category as WorkCategory,
      client: row.client,
      year: row.year,
      description: row.description,
      coverImage: row.cover_image,
      tags: row.tags as string[],
    };
  }

  async getSiteSettings(): Promise<PublicSiteSettings> {
    const t0 = Date.now();
    rawLog('[Public] getSiteSettings STEP1 enter');

    try {
      const sql = this.rawSql;
      rawLog('[Public] getSiteSettings STEP2 before SQL');
      const rows = await withTimeout(
        sql`SELECT setting_key, setting_value FROM site_setting`,
        DB_TIMEOUT_MS,
        'get-site-settings',
      );
      rawLog(`[Public] getSiteSettings STEP3 after SQL: ${rows.length} rows`);

      rawLog(
        `[Public] getSiteSettings done: ${rows.length} rows in ${Date.now() - t0}ms`,
      );

      const map = new Map<string, string>();
      for (const row of rows as any[]) {
        map.set(row.setting_key, row.setting_value);
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      rawError(`[Public] getSiteSettings FAILED: ${msg}`);
      logger.error(`getSiteSettings failed: ${msg}`);
      return DEFAULT_SETTINGS;
    }
  }

  async getKeywordRules(): Promise<PublicKeywordRulesResponse> {
    rawLog('[Public] getKeywordRules STEP1 enter');
    try {
      const sql = this.rawSql;
      rawLog('[Public] getKeywordRules STEP2 before SQL');
      const rows = await withTimeout(
        sql`
          SELECT id, keywords, reply_content
          FROM keyword_rule
          ORDER BY sort_order ASC, _created_at ASC
        `,
        DB_TIMEOUT_MS,
        'get-keyword-rules',
      );
      rawLog(`[Public] getKeywordRules STEP3 after SQL: ${rows.length} rows`);
      rawLog(`[Public] getKeywordRules done: ${rows.length} rows`);

      return {
        items: (rows as any[]).map((row) => ({
          id: row.id,
          keywords: row.keywords as string[],
          replyContent: row.reply_content,
        })),
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      rawError(`[Public] getKeywordRules FAILED: ${msg}`);
      logger.error(`getKeywordRules failed: ${msg}`);
      return { items: [] };
    }
  }

  async submitMessage(
    dto: PublicMessageSubmitRequest,
  ): Promise<PublicMessageSubmitResponse> {
    rawLog(
      `[Public] submitMessage STEP1 enter name=${dto.name} email=${dto.email} content_len=${dto.content.length}`,
    );
    try {
      const rawSql = (this.db as unknown as { $client: ReturnType<typeof import('postgres')> }).$client;
      if (!rawSql) {
        rawError('[Public] submitMessage FAILED: raw sql client ($client) not available');
        throw new BadRequestException('留言提交失败，请稍后重试');
      }
      rawLog('[Public] submitMessage STEP2 got rawSqlClient via drizzle $client, executing INSERT...');

      const result = await withTimeout(
        (async () => {
          rawLog('[Public] submitMessage STEP3 inside withTimeout, sending SQL...');
          rawLog(`[Public] submitMessage SQL_PREVIEW: INSERT INTO message (name, email, content, is_read) VALUES ('${dto.name}', '${dto.email}', '${dto.content.slice(0, 30)}...', FALSE) RETURNING id`);
          const rows = await rawSql`
            INSERT INTO message (name, email, content, is_read)
            VALUES (${dto.name}, ${dto.email}, ${dto.content}, FALSE)
            RETURNING id, name, email, content, is_read, _created_at
          `;
          rawLog(`[Public] submitMessage STEP4 INSERT returned, rows=${rows.length}`);
          if (rows.length > 0) {
            const r = rows[0] as unknown as Record<string, unknown>;
            rawLog(`[Public] submitMessage STEP4 detail: id=${r.id}, name=${r.name}, _created_at=${r._created_at}`);
          }
          return rows as unknown as Array<{ id: string }>;
        })(),
        DB_TIMEOUT_MS,
        'submit-message-raw',
      );

      rawLog(`[Public] submitMessage STEP5 done: id=${result[0]!.id}`);
      return { success: true, id: result[0]!.id };
    } catch (err) {
      rawError('[Public] submitMessage CATCH err=');
      rawError(err);
      const msg = err instanceof Error ? err.message : String(err);
      rawError(`[Public] submitMessage FAILED: ${msg}`);
      if (err instanceof Error && err.stack) {
        rawError(`[Public] submitMessage Stack: ${err.stack}`);
      }
      let current: unknown = err;
      for (let depth = 0; depth < 4 && current && typeof current === 'object'; depth += 1) {
        const { code, severity, detail, schema, table, column, constraint, cause } =
          current as {
            code?: unknown;
            severity?: unknown;
            detail?: unknown;
            schema?: unknown;
            table?: unknown;
            column?: unknown;
            constraint?: unknown;
            cause?: unknown;
          };
        if (
          code !== undefined ||
          detail !== undefined ||
          table !== undefined
        ) {
          rawError(
            `[Public] submitMessage PostgresError depth=${depth}: code=${code}, severity=${severity}, detail=${detail}, schema=${schema}, table=${table}, column=${column}, constraint=${constraint}`,
          );
        }
        current = cause;
      }
      logger.error(`submitMessage failed: ${msg}`);
      throw new BadRequestException('留言提交失败，请稍后重试');
    }
  }
}
