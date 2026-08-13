import { SiteSettingService } from './site-setting.service';
import type { SiteSettings, SuccessResponse } from '@shared/api.interface';
export declare class SiteSettingController {
    private readonly siteSettingService;
    constructor(siteSettingService: SiteSettingService);
    getSettings(): Promise<SiteSettings>;
    updateSettings(body: SiteSettings): Promise<SuccessResponse>;
}
