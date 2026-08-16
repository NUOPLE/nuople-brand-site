import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { DashboardStats } from '@shared/api.interface';
export declare class DashboardService {
    private readonly db;
    constructor(db: PostgresJsDatabase);
    private get rawSql();
    getStats(): Promise<DashboardStats>;
}
