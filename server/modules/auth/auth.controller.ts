import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import type { Request } from 'express';

import { AuthService } from './auth.service';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import type {
  Admin,
  LoginRequest,
  SuccessResponse,
} from '@shared/api.interface';

export interface LoginResponse {
  admin: Admin;
  token: string;
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: LoginRequest): Promise<LoginResponse> {
    return this.authService.login(body);
  }

  @Get('me')
  @UseGuards(AdminAuthGuard)
  async me(@Req() req: Request): Promise<Admin> {
    return (req as any).admin;
  }

  @Post('logout')
  @UseGuards(AdminAuthGuard)
  @HttpCode(200)
  logout(): SuccessResponse {
    return { success: true };
  }
}
