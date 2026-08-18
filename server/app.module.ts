import { APP_FILTER } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { PlatformModule } from '@lark-apaas/fullstack-nestjs-core';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { ViewModule } from './modules/view/view.module';
import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { WorkModule } from './modules/work/work.module';
import { MessageModule } from './modules/message/message.module';
import { KeywordRuleModule } from './modules/keyword-rule/keyword-rule.module';
import { SiteSettingModule } from './modules/site-setting/site-setting.module';
import { PublicModule } from './modules/public/public.module';
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [
    PlatformModule.forRoot(),
    AuthModule,
    DashboardModule,
    WorkModule,
    MessageModule,
    KeywordRuleModule,
    SiteSettingModule,
    UploadModule,
    PublicModule,
    ViewModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
