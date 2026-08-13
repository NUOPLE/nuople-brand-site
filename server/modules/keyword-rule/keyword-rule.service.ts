import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE } from '../../database/connection';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, lt, gt, asc, desc, max } from 'drizzle-orm';

import { keywordRule } from '../../database/schema';
import type {
  KeywordRuleListResponse,
  KeywordRuleCreateRequest,
  KeywordRuleUpdateRequest,
  KeywordRuleMoveRequest,
  KeywordRule as KeywordRuleType,
  IdResponse,
  SuccessResponse,
} from '@shared/api.interface';

@Injectable()
export class KeywordRuleService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async list(): Promise<KeywordRuleListResponse> {
    const rules: KeywordRuleType[] = await this.db
      .select({
        id: keywordRule.id,
        keywords: keywordRule.keywords,
        replyContent: keywordRule.replyContent,
        sortOrder: keywordRule.sortOrder,
      })
      .from(keywordRule)
      .orderBy(asc(keywordRule.sortOrder));
    return { items: rules };
  }

  async create(dto: KeywordRuleCreateRequest): Promise<IdResponse> {
    const maxResult = await this.db
      .select({ max: max(keywordRule.sortOrder) })
      .from(keywordRule);
    const currentMax: number = maxResult[0]?.max ?? -1;
    const nextSortOrder: number = currentMax + 1;

    const inserted = await this.db
      .insert(keywordRule)
      .values({
        keywords: dto.keywords,
        replyContent: dto.replyContent,
        sortOrder: nextSortOrder,
      })
      .returning({ id: keywordRule.id });
    return { id: inserted[0].id };
  }

  async update(id: string, dto: KeywordRuleUpdateRequest): Promise<SuccessResponse> {
    const updated = await this.db
      .update(keywordRule)
      .set({
        keywords: dto.keywords,
        replyContent: dto.replyContent,
      })
      .where(eq(keywordRule.id, id))
      .returning({ id: keywordRule.id });
    if (updated.length === 0) {
      throw new NotFoundException('规则不存在');
    }
    return { success: true };
  }

  async remove(id: string): Promise<SuccessResponse> {
    const deleted = await this.db
      .delete(keywordRule)
      .where(eq(keywordRule.id, id))
      .returning({ id: keywordRule.id });
    if (deleted.length === 0) {
      throw new NotFoundException('规则不存在');
    }
    return { success: true };
  }

  async move(id: string, dto: KeywordRuleMoveRequest): Promise<SuccessResponse> {
    const currentArr = await this.db
      .select({
        id: keywordRule.id,
        sortOrder: keywordRule.sortOrder,
      })
      .from(keywordRule)
      .where(eq(keywordRule.id, id));
    if (currentArr.length === 0) {
      throw new NotFoundException('规则不存在');
    }
    const current = currentArr[0];

    let neighborArr: { id: string; sortOrder: number }[];
    if (dto.direction === 'up') {
      neighborArr = await this.db
        .select({
          id: keywordRule.id,
          sortOrder: keywordRule.sortOrder,
        })
        .from(keywordRule)
        .where(lt(keywordRule.sortOrder, current.sortOrder))
        .orderBy(desc(keywordRule.sortOrder))
        .limit(1);
    } else {
      neighborArr = await this.db
        .select({
          id: keywordRule.id,
          sortOrder: keywordRule.sortOrder,
        })
        .from(keywordRule)
        .where(gt(keywordRule.sortOrder, current.sortOrder))
        .orderBy(asc(keywordRule.sortOrder))
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
        .update(keywordRule)
        .set({ sortOrder: neighborSort })
        .where(eq(keywordRule.id, id));
      await tx
        .update(keywordRule)
        .set({ sortOrder: currentSort })
        .where(eq(keywordRule.id, neighbor.id));
    });

    return { success: true };
  }
}
