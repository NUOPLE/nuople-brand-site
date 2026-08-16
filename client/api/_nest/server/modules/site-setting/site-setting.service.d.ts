import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { SiteSettings } from '@shared/api.interface';
export declare class SiteSettingService {
    private readonly db;
    constructor(db: PostgresJsDatabase);
    getSettings(): Promise<SiteSettings>;
    updateSettings(settings: SiteSettings): Promise<{
        success: true;
    }>;
}
