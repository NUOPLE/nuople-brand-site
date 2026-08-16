import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Work, WorkListResponse, WorkCreateRequest, WorkUpdateRequest, IdResponse, SuccessResponse } from '@shared/api.interface';
export declare class WorkService {
    private readonly db;
    constructor(db: PostgresJsDatabase);
    private get sql();
    getList(params: {
        page: number;
        pageSize: number;
        keyword?: string;
        category?: string;
    }): Promise<WorkListResponse>;
    getById(id: string): Promise<Work>;
    create(dto: WorkCreateRequest): Promise<IdResponse>;
    update(id: string, dto: WorkUpdateRequest): Promise<SuccessResponse>;
    remove(id: string): Promise<SuccessResponse>;
}
