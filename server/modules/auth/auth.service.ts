import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { pbkdf2, randomBytes } from 'crypto';
import { promisify } from 'util';
import { JwtService } from '@nestjs/jwt';

import { DRIZZLE_DATABASE } from '../../database/connection';
import { admin } from '../../database/schema';
import type { Admin, LoginRequest } from '@shared/api.interface';

const ITERATIONS = 10000;
const KEY_LEN = 64;
const DIGEST = 'sha256';

const pbkdf2Async = promisify(pbkdf2);
const randomBytesAsync = promisify(randomBytes);
const logger = new Logger('AuthService');

export async function hashPassword(password: string): Promise<string> {
  const salt = (await randomBytesAsync(16)).toString('hex');
  const hash = (
    await pbkdf2Async(password, salt, ITERATIONS, KEY_LEN, DIGEST)
  ).toString('hex');
  return `SALTED_SHA256$${salt}$${hash}`;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly jwtService: JwtService,
  ) {}

  private async verifyPassword(
    password: string,
    passwordHash: string,
  ): Promise<boolean> {
    const parts = passwordHash.split('$');
    if (parts.length !== 3 || parts[0] !== 'SALTED_SHA256') return false;
    const salt = parts[1];
    const expectedHash = parts[2];
    const hash = (
      await pbkdf2Async(password, salt, ITERATIONS, KEY_LEN, DIGEST)
    ).toString('hex');
    return hash === expectedHash;
  }

  async login(dto: LoginRequest): Promise<{ admin: Admin; token: string }> {
    const t0 = Date.now();

    const rows = await this.db
      .select({
        id: admin.id,
        username: admin.username,
        passwordHash: admin.passwordHash,
      })
      .from(admin)
      .where(eq(admin.username, dto.username))
      .limit(1);
    const t1 = Date.now();
    logger.log(`[Login] DB query: ${t1 - t0}ms (rows=${rows.length})`);

    if (rows.length === 0) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const row = rows[0]!;
    const passwordValid = await this.verifyPassword(
      dto.password,
      row.passwordHash,
    );
    const t2 = Date.now();
    logger.log(
      `[Login] Password verify: ${t2 - t1}ms (valid=${passwordValid})`,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const adminUser: Admin = { id: row.id, username: row.username };
    const token = this.jwtService.sign(
      { sub: row.id, username: row.username },
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    );
    const t3 = Date.now();
    logger.log(`[Login] JWT sign: ${t3 - t2}ms, total: ${t3 - t0}ms`);

    return { admin: adminUser, token };
  }

  extractTokenFromRequest(request: any): string | null {
    const authHeader: string = request.headers?.authorization ?? '';
    if (!authHeader.startsWith('Bearer ')) return null;
    return authHeader.slice(7);
  }

  async verifyToken(token: string): Promise<Admin | null> {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      return { id: payload.sub, username: payload.username };
    } catch {
      return null;
    }
  }

  async getAdminFromRequest(request: any): Promise<Admin | null> {
    const token = this.extractTokenFromRequest(request);
    if (!token) return null;
    return this.verifyToken(token);
  }
}
