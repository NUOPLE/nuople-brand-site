import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  HttpCode,
  UnauthorizedException,
  HttpException,
} from '@nestjs/common';
import type { Request } from 'express';

import { AuthService } from './auth.service';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import type {
  Admin,
  LoginRequest,
  SuccessResponse,
} from '@shared/api.interface';

const rawLog = globalThis.console.log.bind(globalThis.console);
const rawError = globalThis.console.error.bind(globalThis.console);

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
    rawLog(
      `[AuthController] POST /api/auth/login received, username="${body?.username}" (len=${body?.username?.length ?? 0})`,
    );
    try {
      const result = await this.authService.login(body);
      rawLog(
        `[AuthController] Login SUCCESS for username="${body?.username}", token_len=${result.token.length}`,
      );
      return result;
    } catch (err) {
      const isHttp = err instanceof HttpException;
      const status = isHttp ? err.getStatus() : 500;
      const msg = err instanceof Error ? err.message : String(err);
      rawError(
        `[AuthController] Login FAILED: status=${status}, message="${msg}"`,
      );
      if (err instanceof Error && err.stack) {
        rawError(`[AuthController] Stack: ${err.stack}`);
      }
      if (isHttp) throw err;
      throw new UnauthorizedException('用户名或密码错误');
    }
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
