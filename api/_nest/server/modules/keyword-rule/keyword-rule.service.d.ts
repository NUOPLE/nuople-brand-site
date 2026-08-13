import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { KeywordRuleListResponse, KeywordRuleCreateRequest, KeywordRuleUpdateRequest, KeywordRuleMoveRequest, IdResponse, SuccessResponse } from '@shared/api.interface';
export declare class KeywordRuleService {
    private readonly db;
    constructor(db: PostgresJsDatabase);
    list(): Promise<KeywordRuleListResponse>;
    create(dto: KeywordRuleCreateRequest): Promise<IdResponse>;
    update(id: string, dto: KeywordRuleUpdateRequest): Promise<SuccessResponse>;
    remove(id: string): Promise<SuccessResponse>;
    move(id: string, dto: KeywordRuleMoveRequest): Promise<SuccessResponse>;
}
