import { DashboardService } from './dashboard.service';
import type { DashboardStats } from '@shared/api.interface';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getStats(): Promise<DashboardStats>;
}
