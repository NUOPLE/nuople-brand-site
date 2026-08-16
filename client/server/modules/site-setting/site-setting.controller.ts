import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';

import { SiteSettingService } from './site-setting.service';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import type {
  SiteSettings,
  SuccessResponse,
} from '@shared/api.interface';

@Controller('api/site-settings')
@UseGuards(AdminAuthGuard)
export class SiteSettingController {
  constructor(private readonly siteSettingService: SiteSettingService) {}

  @Get()
  async getSettings(): Promise<SiteSettings> {
    return this.siteSettingService.getSettings();
  }

  @Put()
  async updateSettings(@Body() body: SiteSettings): Promise<SuccessResponse> {
    return this.siteSettingService.updateSettings(body);
  }
}
