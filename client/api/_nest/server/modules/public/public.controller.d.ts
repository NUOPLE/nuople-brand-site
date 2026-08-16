import { PublicService } from './public.service';
import type { PublicWorkListResponse, PublicWorkDetail, PublicSiteSettings, PublicKeywordRulesResponse, PublicMessageSubmitRequest, PublicMessageSubmitResponse, PublicFeaturedWorksResponse } from '@shared/api.interface';
export declare class PublicController {
    private readonly publicService;
    constructor(publicService: PublicService);
    getFeaturedWorks(limit?: string): Promise<PublicFeaturedWorksResponse>;
    getWorkList(page?: string, pageSize?: string, category?: string): Promise<PublicWorkListResponse>;
    getWorkDetail(id: string): Promise<PublicWorkDetail>;
    getNextWork(id: string): Promise<PublicWorkDetail>;
    getSiteSettings(): Promise<PublicSiteSettings>;
    getKeywordRules(): Promise<PublicKeywordRulesResponse>;
    submitMessage(body: PublicMessageSubmitRequest): Promise<PublicMessageSubmitResponse>;
}
