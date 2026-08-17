import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { PublicWorkListItem, PublicWorkListResponse, PublicWorkDetail, PublicSiteSettings, PublicKeywordRulesResponse, PublicMessageSubmitRequest, PublicMessageSubmitResponse, PublicMessageDetail, PublicFeaturedWorksResponse } from '@shared/api.interface';
export declare class PublicService {
    private readonly db;
    constructor(db: PostgresJsDatabase);
    private get rawSql();
    healthCheck(): Promise<{
        ok: boolean;
    }>;
    getFeaturedWorks(limit?: number): Promise<PublicFeaturedWorksResponse>;
    getWorkList(params: {
        page: number;
        pageSize: number;
        category?: string;
    }): Promise<PublicWorkListResponse>;
    getWorkById(id: string): Promise<PublicWorkDetail | null>;
    getNextWork(id: string): Promise<PublicWorkListItem | null>;
    getSiteSettings(): Promise<PublicSiteSettings>;
    getKeywordRules(): Promise<PublicKeywordRulesResponse>;
    getMessageById(id: string): Promise<PublicMessageDetail>;
    submitMessage(dto: PublicMessageSubmitRequest): Promise<PublicMessageSubmitResponse>;
}
