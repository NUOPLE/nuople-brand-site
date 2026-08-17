import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';

const rawLog = globalThis.console.log.bind(globalThis.console);
const rawError = globalThis.console.error.bind(globalThis.console);

import { PublicService } from './public.service';
import type {
  PublicWorkListResponse,
  PublicWorkDetail,
  PublicSiteSettings,
  PublicKeywordRulesResponse,
  PublicMessageSubmitRequest,
  PublicMessageSubmitResponse,
  PublicFeaturedWorksResponse,
} from '@shared/api.interface';

@Controller('api/public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('works/featured')
  async getFeaturedWorks(
    @Query('limit') limit = '5',
  ): Promise<PublicFeaturedWorksResponse> {
    const limitNum = Math.min(parseInt(limit, 10) || 5, 20);
    return this.publicService.getFeaturedWorks(limitNum);
  }

  @Get('works')
  async getWorkList(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '12',
    @Query('category') category?: string,
  ): Promise<PublicWorkListResponse> {
    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = Math.min(parseInt(pageSize, 10) || 12, 50);
    return this.publicService.getWorkList({
      page: pageNum,
      pageSize: pageSizeNum,
      category: category || undefined,
    });
  }

  @Get('works/:id')
  async getWorkDetail(@Param('id') id: string): Promise<PublicWorkDetail> {
    const work = await this.publicService.getWorkById(id);
    if (!work) {
      throw new NotFoundException('作品不存在');
    }
    return work;
  }

  @Get('works/:id/next')
  async getNextWork(@Param('id') id: string): Promise<PublicWorkDetail> {
    const work = await this.publicService.getNextWork(id);
    if (!work) {
      throw new NotFoundException('没有更多作品');
    }
    return work as unknown as PublicWorkDetail;
  }

  @Get('site-settings')
  async getSiteSettings(): Promise<PublicSiteSettings> {
    return this.publicService.getSiteSettings();
  }

  @Get('keyword-rules')
  async getKeywordRules(): Promise<PublicKeywordRulesResponse> {
    return this.publicService.getKeywordRules();
  }

  @Post('messages')
  async submitMessage(
    @Req() req: Request,
    @Body() body: PublicMessageSubmitRequest,
  ): Promise<PublicMessageSubmitResponse> {
    rawLog(
      `[MSG_DEBUG] Controller POST /api/public/messages ENTER bodyKeys=${Object.keys(body || {}).join(',')} name="${body?.name}" email="${body?.email}"`,
    );
    if (!body?.name?.trim()) {
      rawError(`[MSG_DEBUG] Controller: name is empty -> 400`);
      throw new BadRequestException('请输入姓名');
    }
    if (!body?.email?.trim()) {
      rawError(`[MSG_DEBUG] Controller: email is empty -> 400`);
      throw new BadRequestException('请输入邮箱');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      rawError(`[MSG_DEBUG] Controller: invalid email "${body.email}" -> 400`);
      throw new BadRequestException('邮箱格式不正确');
    }
    if (!body?.content?.trim()) {
      rawError(`[MSG_DEBUG] Controller: content is empty -> 400`);
      throw new BadRequestException('请输入留言内容');
    }
    try {
      const result = await this.publicService.submitMessage(body);
      rawLog(
        `[MSG_DEBUG] Controller: success id=${result.id}`,
      );
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      rawError(`[MSG_DEBUG] Controller: service threw -> ${msg}`);
      if (err instanceof Error && err.stack) {
        rawError(`[MSG_DEBUG] Controller: stack: ${err.stack}`);
      }
      throw err;
    }
  }
}
