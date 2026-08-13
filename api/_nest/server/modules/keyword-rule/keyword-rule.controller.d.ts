import { KeywordRuleService } from './keyword-rule.service';
import type { KeywordRuleListResponse, KeywordRuleCreateRequest, KeywordRuleUpdateRequest, KeywordRuleMoveRequest, IdResponse, SuccessResponse } from '@shared/api.interface';
export declare class KeywordRuleController {
    private readonly keywordRuleService;
    constructor(keywordRuleService: KeywordRuleService);
    list(): Promise<KeywordRuleListResponse>;
    create(body: KeywordRuleCreateRequest): Promise<IdResponse>;
    update(id: string, body: KeywordRuleUpdateRequest): Promise<SuccessResponse>;
    remove(id: string): Promise<SuccessResponse>;
    move(id: string, body: KeywordRuleMoveRequest): Promise<SuccessResponse>;
}
