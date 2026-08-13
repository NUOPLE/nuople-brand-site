import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { WorkController } from './work.controller';
import { WorkService } from './work.service';

@Module({
  imports: [AuthModule],
  controllers: [WorkController],
  providers: [WorkService],
})
export class WorkModule {}
