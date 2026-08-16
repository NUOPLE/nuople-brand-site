import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { MessageService } from './message.service';
import type {
  Message,
  MessageListResponse,
  MessageReadStatusRequest,
  MessageReplyRequest,
  MessageStatusFilter,
  SuccessResponse,
} from '@shared/api.interface';

@UseGuards(AdminAuthGuard)
@Controller('api/messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get()
  async getList(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('status') status: MessageStatusFilter = 'all',
  ): Promise<MessageListResponse> {
    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = parseInt(pageSize, 10) || 10;
    return this.messageService.getList(pageNum, pageSizeNum, status);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<Message> {
    return this.messageService.getById(id);
  }

  @Patch(':id/read-status')
  async updateReadStatus(
    @Param('id') id: string,
    @Body() body: MessageReadStatusRequest,
  ): Promise<SuccessResponse> {
    await this.messageService.updateReadStatus(id, body.isRead);
    return { success: true };
  }

  @Post(':id/reply')
  async reply(
    @Param('id') id: string,
    @Body() body: MessageReplyRequest,
  ): Promise<SuccessResponse & { repliedAt: string }> {
    const result = await this.messageService.reply(id, body.replyContent);
    return { success: true, repliedAt: result.repliedAt };
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<SuccessResponse> {
    await this.messageService.delete(id);
    return { success: true };
  }
}
