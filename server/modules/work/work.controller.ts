import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';

import { WorkService } from './work.service';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import type {
  Work,
  WorkListResponse,
  WorkCreateRequest,
  WorkUpdateRequest,
  IdResponse,
  SuccessResponse,
} from '@shared/api.interface';

@Controller('api/works')
@UseGuards(AdminAuthGuard)
export class WorkController {
  constructor(private readonly workService: WorkService) {}

  @Get()
  async getList(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('keyword') keyword?: string,
    @Query('category') category?: string,
  ): Promise<WorkListResponse> {
    return this.workService.getList({
      page: parseInt(page, 10) || 1,
      pageSize: parseInt(pageSize, 10) || 10,
      keyword: keyword || undefined,
      category: category || undefined,
    });
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<Work> {
    return this.workService.getById(id);
  }

  @Post()
  async create(@Body() body: WorkCreateRequest): Promise<IdResponse> {
    return this.workService.create(body);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: WorkUpdateRequest,
  ): Promise<SuccessResponse> {
    return this.workService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<SuccessResponse> {
    return this.workService.remove(id);
  }
}
