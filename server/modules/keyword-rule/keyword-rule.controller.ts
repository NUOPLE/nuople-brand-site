import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';

import { KeywordRuleService } from './keyword-rule.service';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import type {
  KeywordRuleListResponse,
  KeywordRuleCreateRequest,
  KeywordRuleUpdateRequest,
  KeywordRuleMoveRequest,
  IdResponse,
  SuccessResponse,
} from '@shared/api.interface';

@Controller('api/keyword-rules')
@UseGuards(AdminAuthGuard)
export class KeywordRuleController {
  constructor(private readonly keywordRuleService: KeywordRuleService) {}

  @Get()
  async list(): Promise<KeywordRuleListResponse> {
    return this.keywordRuleService.list();
  }

  @Post()
  async create(@Body() body: KeywordRuleCreateRequest): Promise<IdResponse> {
    return this.keywordRuleService.create(body);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: KeywordRuleUpdateRequest,
  ): Promise<SuccessResponse> {
    return this.keywordRuleService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<SuccessResponse> {
    return this.keywordRuleService.remove(id);
  }

  @Post(':id/move')
  async move(
    @Param('id') id: string,
    @Body() body: KeywordRuleMoveRequest,
  ): Promise<SuccessResponse> {
    return this.keywordRuleService.move(id, body);
  }
}
