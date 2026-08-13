import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, like, count, desc } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { DRIZZLE_DATABASE } from '../../database/connection';
import { work } from '../../database/schema';
import type {
  Work,
  WorkListItem,
  WorkListResponse,
  WorkCreateRequest,
  WorkUpdateRequest,
  IdResponse,
  SuccessResponse,
} from '@shared/api.interface';

@Injectable()
export class WorkService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getList(params: {
    page: number;
    pageSize: number;
    keyword?: string;
    category?: string;
  }): Promise<WorkListResponse> {
    const { page, pageSize, keyword, category } = params;
    const conditions = [];
    if (keyword) {
      conditions.push(like(work.title, `%${keyword}%`));
    }
    if (category) {
      conditions.push(eq(work.category, category));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, items] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(work)
        .where(where),
      this.db
        .select({
          id: work.id,
          title: work.title,
          category: work.category,
          client: work.client,
          year: work.year,
          coverImage: work.coverImage,
        })
        .from(work)
        .where(where)
        .orderBy(desc(work.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return {
      items: items as WorkListItem[],
      total,
    };
  }

  async getById(id: string): Promise<Work> {
    const rows = await this.db.select().from(work).where(eq(work.id, id)).limit(1);
    if (rows.length === 0) {
      throw new NotFoundException('作品不存在');
    }
    const row = rows[0]!;
    return {
      id: row.id,
      title: row.title,
      category: row.category as Work['category'],
      client: row.client,
      industry: row.industry,
      designType: row.designType,
      year: row.year,
      description: row.description,
      tags: row.tags,
      content: row.content,
      coverImage: row.coverImage,
      heroImage: row.heroImage,
      gallery: row.gallery as Work['gallery'],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async create(dto: WorkCreateRequest): Promise<IdResponse> {
    const result = await this.db
      .insert(work)
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
      .returning({ id: work.id });
    return { id: result[0]!.id };
  }

  async update(id: string, dto: WorkUpdateRequest): Promise<SuccessResponse> {
    const result = await this.db
      .update(work)
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
      .where(eq(work.id, id))
      .returning({ id: work.id });
    if (result.length === 0) {
      throw new NotFoundException('作品不存在');
    }
    return { success: true };
  }

  async remove(id: string): Promise<SuccessResponse> {
    const result = await this.db
      .delete(work)
      .where(eq(work.id, id))
      .returning({ id: work.id });
    if (result.length === 0) {
      throw new NotFoundException('作品不存在');
    }
    return { success: true };
  }
}
