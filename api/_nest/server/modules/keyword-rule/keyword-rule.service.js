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
const rawLog = globalThis.console.log.bind(globalThis.console);
const rawError = globalThis.console.error.bind(globalThis.console);
let KeywordRuleService = class KeywordRuleService {
    db;
    constructor(db) {
        this.db = db;
    }
    get sql() {
        return this.db.$client;
    }
    async list() {
        rawLog(`[KeywordRuleService.list] STEP1 enter`);
        rawLog(`[KeywordRuleService.list] STEP2 before SQL`);
        const rules = await this.sql `
      SELECT id, keywords, reply_content, sort_order
      FROM keyword_rule
      ORDER BY sort_order ASC
    `;
        rawLog(`[KeywordRuleService.list] STEP3 SQL returned rows=${rules.length}`);
        const items = rules.map((row) => ({
            id: row.id,
            keywords: row.keywords ?? [],
            replyContent: row.reply_content,
            sortOrder: row.sort_order,
        }));
        return { items };
    }
    async create(dto) {
        rawLog(`[KeywordRuleService.create] STEP1 enter keywords=${JSON.stringify(dto.keywords)}`);
        rawLog(`[KeywordRuleService.create] STEP2 before max SQL`);
        const maxResult = await this.sql `
      SELECT MAX(sort_order) AS max
      FROM keyword_rule
    `;
        rawLog(`[KeywordRuleService.create] STEP3 max SQL returned max=${maxResult[0]?.max}`);
        const currentMax = maxResult[0]?.max ?? -1;
        const nextSortOrder = currentMax + 1;
        rawLog(`[KeywordRuleService.create] STEP2 before insert SQL`);
        const inserted = await this.sql `
      INSERT INTO keyword_rule (keywords, reply_content, sort_order)
      VALUES (${dto.keywords}, ${dto.replyContent}, ${nextSortOrder})
      RETURNING id
    `;
        rawLog(`[KeywordRuleService.create] STEP3 insert SQL returned rows=${inserted.length}`);
        return { id: inserted[0].id };
    }
    async update(id, dto) {
        rawLog(`[KeywordRuleService.update] STEP1 enter id=${id}`);
        rawLog(`[KeywordRuleService.update] STEP2 before SQL`);
        const updated = await this.sql `
      UPDATE keyword_rule
      SET keywords = ${dto.keywords}, reply_content = ${dto.replyContent}
      WHERE id = ${id}
      RETURNING id
    `;
        rawLog(`[KeywordRuleService.update] STEP3 SQL returned rows=${updated.length}`);
        if (updated.length === 0) {
            throw new common_1.NotFoundException('规则不存在');
        }
        return { success: true };
    }
    async remove(id) {
        rawLog(`[KeywordRuleService.remove] STEP1 enter id=${id}`);
        rawLog(`[KeywordRuleService.remove] STEP2 before SQL`);
        const deleted = await this.sql `
      DELETE FROM keyword_rule
      WHERE id = ${id}
      RETURNING id
    `;
        rawLog(`[KeywordRuleService.remove] STEP3 SQL returned rows=${deleted.length}`);
        if (deleted.length === 0) {
            throw new common_1.NotFoundException('规则不存在');
        }
        return { success: true };
    }
    async move(id, dto) {
        rawLog(`[KeywordRuleService.move] STEP1 enter id=${id} direction=${dto.direction}`);
        rawLog(`[KeywordRuleService.move] STEP2 before current SQL`);
        const currentArr = await this.sql `
      SELECT id, sort_order
      FROM keyword_rule
      WHERE id = ${id}
      LIMIT 1
    `;
        rawLog(`[KeywordRuleService.move] STEP3 current SQL returned rows=${currentArr.length}`);
        if (currentArr.length === 0) {
            throw new common_1.NotFoundException('规则不存在');
        }
        const current = currentArr[0];
        rawLog(`[KeywordRuleService.move] STEP2 before neighbor SQL`);
        let neighborArr;
        if (dto.direction === 'up') {
            neighborArr = await this.sql `
        SELECT id, sort_order
        FROM keyword_rule
        WHERE sort_order < ${current.sort_order}
        ORDER BY sort_order DESC
        LIMIT 1
      `;
        }
        else {
            neighborArr = await this.sql `
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
        await this.sql `
      UPDATE keyword_rule
      SET sort_order = ${neighborSort}
      WHERE id = ${id}
    `;
        rawLog(`[KeywordRuleService.move] STEP3 UPDATE #1 done`);
        rawLog(`[KeywordRuleService.move] STEP2 before UPDATE #2 (neighbor)`);
        await this.sql `
      UPDATE keyword_rule
      SET sort_order = ${currentSort}
      WHERE id = ${neighbor.id}
    `;
        rawLog(`[KeywordRuleService.move] STEP3 UPDATE #2 done`);
        return { success: true };
    }
};
exports.KeywordRuleService = KeywordRuleService;
exports.KeywordRuleService = KeywordRuleService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(connection_1.DRIZZLE_DATABASE)),
    __metadata("design:paramtypes", [Function])
], KeywordRuleService);
