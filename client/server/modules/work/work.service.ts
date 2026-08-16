import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { DRIZZLE_DATABASE } from '../../database/connection';
import type {
  Work,
  WorkListItem,
  WorkListResponse,
  WorkCreateRequest,
  WorkUpdateRequest,
  IdResponse,
  SuccessResponse,
} from '@shared/api.interface';

const rawLog = globalThis.console.log.bind(globalThis.console);
const rawError = globalThis.console.error.bind(globalThis.console);

interface WorkRow {
  id: string;
  title: string;
  category: string;
  client: string;
  industry: string;
  design_type: string;
  year: string;
  description: string;
  tags: string[];
  content: string;
  cover_image: string;
  hero_image: string;
  gallery: string;
  _created_at: string;
  _updated_at: string;
}

interface IdRow {
  id: string;
}

interface CountRow {
  count: string | number;
}

@Injectable()
export class WorkService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private get sql(): ReturnType<typeof import('postgres')> {
    return (this.db as unknown as { $client: ReturnType<typeof import('postgres')> }).$client;
  }

  async getList(params: {
    page: number;
    pageSize: number;
    keyword?: string;
    category?: string;
  }): Promise<WorkListResponse> {
    rawLog(`[WorkService.getList] STEP1 enter page=${params.page} pageSize=${params.pageSize} keyword=${params.keyword ?? ''} category=${params.category ?? ''}`);
    const { page, pageSize, keyword, category } = params;

    const offset = (page - 1) * pageSize;

    const whereKeyword = keyword ? this.sql`WHERE title LIKE ${'%' + keyword + '%'}` : this.sql``;
    const whereCategory = category ? (keyword ? this.sql` AND category = ${category}` : this.sql`WHERE category = ${category}`) : this.sql``;

    rawLog('[WorkService.getList] STEP2 before SQL');
    const [countResult, itemsResult] = await Promise.all([
      this.sql`
        SELECT COUNT(*)::bigint AS count
        FROM work
        ${whereKeyword}
        ${whereCategory}
      `,
      this.sql`
        SELECT id, title, category, client, year, cover_image
        FROM work
        ${whereKeyword}
        ${whereCategory}
        ORDER BY _created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `,
    ]);
    rawLog(`[WorkService.getList] STEP3 SQL returned count=${countResult[0]?.count} rows=${itemsResult.length}`);

    const total = Number((countResult[0] as CountRow)?.count ?? 0);

    const items: WorkListItem[] = itemsResult.map((row: any) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      client: row.client,
      year: row.year,
      coverImage: row.cover_image,
    }));

    return { items, total };
  }

  async getById(id: string): Promise<Work> {
    rawLog(`[WorkService.getById] STEP1 enter id=${id}`);

    rawLog('[WorkService.getById] STEP2 before SQL');
    const rows = await this.sql`
      SELECT id, title, category, client, industry, design_type, year, description, tags, content, cover_image, hero_image, gallery, _created_at, _updated_at
      FROM work
      WHERE id = ${id}
      LIMIT 1
    `;
    rawLog(`[WorkService.getById] STEP3 SQL returned rows=${rows.length}`);

    if (rows.length === 0) {
      throw new NotFoundException('作品不存在');
    }
    const row = rows[0] as WorkRow;

    let gallery: Work['gallery'] = [];
    try {
      gallery = JSON.parse(row.gallery) as Work['gallery'];
    } catch (err) {
      rawError('parse gallery failed', err);
      gallery = [];
    }

    return {
      id: row.id,
      title: row.title,
      category: row.category as Work['category'],
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

  async create(dto: WorkCreateRequest): Promise<IdResponse> {
    rawLog(`[WorkService.create] STEP1 enter title=${dto.title}`);

    rawLog('[WorkService.create] STEP2 before SQL');
    const result = await this.sql`
      INSERT INTO work (title, category, client, industry, design_type, year, description, tags, content, cover_image, hero_image, gallery)
      VALUES (${dto.title}, ${dto.category}, ${dto.client}, ${dto.industry}, ${dto.designType}, ${dto.year}, ${dto.description}, ${dto.tags}, ${dto.content}, ${dto.coverImage}, ${dto.heroImage}, ${JSON.stringify(dto.gallery)}::jsonb)
      RETURNING id
    `;
    rawLog(`[WorkService.create] STEP3 SQL returned id=${(result[0] as IdRow)?.id}`);

    return { id: (result[0] as IdRow).id };
  }

  async update(id: string, dto: WorkUpdateRequest): Promise<SuccessResponse> {
    rawLog(`[WorkService.update] STEP1 enter id=${id}`);

    rawLog('[WorkService.update] STEP2 before SQL');
    const result = await this.sql`
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
      throw new NotFoundException('作品不存在');
    }
    return { success: true };
  }

  async remove(id: string): Promise<SuccessResponse> {
    rawLog(`[WorkService.remove] STEP1 enter id=${id}`);

    rawLog('[WorkService.remove] STEP2 before SQL');
    const result = await this.sql`
      DELETE FROM work WHERE id = ${id} RETURNING id
    `;
    rawLog(`[WorkService.remove] STEP3 SQL returned rows=${result.length}`);

    if (result.length === 0) {
      throw new NotFoundException('作品不存在');
    }
    return { success: true };
  }
}
