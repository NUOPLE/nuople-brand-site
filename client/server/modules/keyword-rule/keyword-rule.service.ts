import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE } from '../../database/connection';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type {
  KeywordRuleListResponse,
  KeywordRuleCreateRequest,
  KeywordRuleUpdateRequest,
  KeywordRuleMoveRequest,
  KeywordRule as KeywordRuleType,
  IdResponse,
  SuccessResponse,
} from '@shared/api.interface';

const rawLog = globalThis.console.log.bind(globalThis.console);
const rawError = globalThis.console.error.bind(globalThis.console);

@Injectable()
export class KeywordRuleService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private get sql(): ReturnType<typeof import('postgres')> {
    return (this.db as unknown as { $client: ReturnType<typeof import('postgres')> }).$client;
  }

  async list(): Promise<KeywordRuleListResponse> {
    rawLog(`[KeywordRuleService.list] STEP1 enter`);

    rawLog(`[KeywordRuleService.list] STEP2 before SQL`);
    const rules = await this.sql`
      SELECT id, keywords, reply_content, sort_order
      FROM keyword_rule
      ORDER BY sort_order ASC
    `;
    rawLog(`[KeywordRuleService.list] STEP3 SQL returned rows=${rules.length}`);

    const items: KeywordRuleType[] = rules.map((row: any) => ({
      id: row.id,
      keywords: row.keywords ?? [],
      replyContent: row.reply_content,
      sortOrder: row.sort_order,
    }));

    return { items };
  }

  async create(dto: KeywordRuleCreateRequest): Promise<IdResponse> {
    rawLog(`[KeywordRuleService.create] STEP1 enter keywords=${JSON.stringify(dto.keywords)}`);

    rawLog(`[KeywordRuleService.create] STEP2 before max SQL`);
    const maxResult = await this.sql`
      SELECT MAX(sort_order) AS max
      FROM keyword_rule
    `;
    rawLog(`[KeywordRuleService.create] STEP3 max SQL returned max=${maxResult[0]?.max}`);

    const currentMax: number = maxResult[0]?.max ?? -1;
    const nextSortOrder: number = currentMax + 1;

    rawLog(`[KeywordRuleService.create] STEP2 before insert SQL`);
    const inserted = await this.sql`
      INSERT INTO keyword_rule (keywords, reply_content, sort_order)
      VALUES (${dto.keywords}, ${dto.replyContent}, ${nextSortOrder})
      RETURNING id
    `;
    rawLog(`[KeywordRuleService.create] STEP3 insert SQL returned rows=${inserted.length}`);

    return { id: (inserted[0] as any).id };
  }

  async update(id: string, dto: KeywordRuleUpdateRequest): Promise<SuccessResponse> {
    rawLog(`[KeywordRuleService.update] STEP1 enter id=${id}`);

    rawLog(`[KeywordRuleService.update] STEP2 before SQL`);
    const updated = await this.sql`
      UPDATE keyword_rule
      SET keywords = ${dto.keywords}, reply_content = ${dto.replyContent}
      WHERE id = ${id}
      RETURNING id
    `;
    rawLog(`[KeywordRuleService.update] STEP3 SQL returned rows=${updated.length}`);

    if (updated.length === 0) {
      throw new NotFoundException('规则不存在');
    }
    return { success: true };
  }

  async remove(id: string): Promise<SuccessResponse> {
    rawLog(`[KeywordRuleService.remove] STEP1 enter id=${id}`);

    rawLog(`[KeywordRuleService.remove] STEP2 before SQL`);
    const deleted = await this.sql`
      DELETE FROM keyword_rule
      WHERE id = ${id}
      RETURNING id
    `;
    rawLog(`[KeywordRuleService.remove] STEP3 SQL returned rows=${deleted.length}`);

    if (deleted.length === 0) {
      throw new NotFoundException('规则不存在');
    }
    return { success: true };
  }

  async move(id: string, dto: KeywordRuleMoveRequest): Promise<SuccessResponse> {
    rawLog(`[KeywordRuleService.move] STEP1 enter id=${id} direction=${dto.direction}`);

    rawLog(`[KeywordRuleService.move] STEP2 before current SQL`);
    const currentArr = await this.sql`
      SELECT id, sort_order
      FROM keyword_rule
      WHERE id = ${id}
      LIMIT 1
    `;
    rawLog(`[KeywordRuleService.move] STEP3 current SQL returned rows=${currentArr.length}`);

    if (currentArr.length === 0) {
      throw new NotFoundException('规则不存在');
    }
    const current = currentArr[0] as any;

    rawLog(`[KeywordRuleService.move] STEP2 before neighbor SQL`);
    let neighborArr: any[];
    if (dto.direction === 'up') {
      neighborArr = await this.sql`
        SELECT id, sort_order
        FROM keyword_rule
        WHERE sort_order < ${current.sort_order}
        ORDER BY sort_order DESC
        LIMIT 1
      `;
    } else {
      neighborArr = await this.sql`
        SELECT id, sort_order
        FROM keyword_rule
        WHERE sort_order > ${current.sort_order}
        ORDER BY sort_order ASC
        LIMIT 1
      `;
    }
    rawLog(`[KeywordRuleService.move] STEP3 neighbor SQL returned rows=${neighborArr.length}`);

    if (neighborArr.length === 0) {
      return { success: true };
    }
    const neighbor = neighborArr[0];
    const currentSort = current.sort_order;
    const neighborSort = neighbor.sort_order;

    rawLog(`[KeywordRuleService.move] STEP2 before UPDATE #1 (current)`);
    await this.sql`
      UPDATE keyword_rule
      SET sort_order = ${neighborSort}
      WHERE id = ${id}
    `;
    rawLog(`[KeywordRuleService.move] STEP3 UPDATE #1 done`);

    rawLog(`[KeywordRuleService.move] STEP2 before UPDATE #2 (neighbor)`);
    await this.sql`
      UPDATE keyword_rule
      SET sort_order = ${currentSort}
      WHERE id = ${neighbor.id}
    `;
    rawLog(`[KeywordRuleService.move] STEP3 UPDATE #2 done`);

    return { success: true };
  }
}
