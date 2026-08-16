import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { PublicWorkListItem, PublicWorkListResponse, PublicWorkDetail, PublicSiteSettings, PublicKeywordRulesResponse, PublicMessageSubmitRequest, PublicMessageSubmitResponse, PublicFeaturedWorksResponse } from '@shared/api.interface';
export declare class PublicService {
    private readonly db;
    constructor(db: PostgresJsDatabase);
    private get rawSql();
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
    submitMessage(dto: PublicMessageSubmitRequest): Promise<PublicMessageSubmitResponse>;
}
