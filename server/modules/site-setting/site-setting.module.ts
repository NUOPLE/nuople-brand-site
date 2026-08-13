import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { SiteSettingController } from './site-setting.controller';
import { SiteSettingService } from './site-setting.service';

@Module({
  imports: [AuthModule],
  controllers: [SiteSettingController],
  providers: [SiteSettingService],
})
export class SiteSettingModule {}
