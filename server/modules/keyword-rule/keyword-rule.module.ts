import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { KeywordRuleController } from './keyword-rule.controller';
import { KeywordRuleService } from './keyword-rule.service';

@Module({
  imports: [AuthModule],
  controllers: [KeywordRuleController],
  providers: [KeywordRuleService],
})
export class KeywordRuleModule {}
