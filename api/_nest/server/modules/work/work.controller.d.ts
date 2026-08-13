import { WorkService } from './work.service';
import type { Work, WorkListResponse, WorkCreateRequest, WorkUpdateRequest, IdResponse, SuccessResponse } from '@shared/api.interface';
export declare class WorkController {
    private readonly workService;
    constructor(workService: WorkService);
    getList(page?: string, pageSize?: string, keyword?: string, category?: string): Promise<WorkListResponse>;
    getById(id: string): Promise<Work>;
    create(body: WorkCreateRequest): Promise<IdResponse>;
    update(id: string, body: WorkUpdateRequest): Promise<SuccessResponse>;
    remove(id: string): Promise<SuccessResponse>;
}
