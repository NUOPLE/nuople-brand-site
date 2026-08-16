import { Controller, Get, UseGuards } from '@nestjs/common';

import { DashboardService } from './dashboard.service';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import type { DashboardStats } from '@shared/api.interface';

@Controller('api/dashboard')
@UseGuards(AdminAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(): Promise<DashboardStats> {
    return this.dashboardService.getStats();
  }
}
