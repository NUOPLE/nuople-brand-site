import { APP_FILTER } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { DatabaseModule } from './database/database.module';
import { ViewModule } from './modules/view/view.module';
import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { WorkModule } from './modules/work/work.module';
import { MessageModule } from './modules/message/message.module';
import { KeywordRuleModule } from './modules/keyword-rule/keyword-rule.module';
import { SiteSettingModule } from './modules/site-setting/site-setting.module';
import { PublicModule } from './modules/public/public.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    DashboardModule,
    WorkModule,
    MessageModule,
    KeywordRuleModule,
    SiteSettingModule,
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
export class StandaloneAppModule {}
