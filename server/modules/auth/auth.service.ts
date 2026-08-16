import {
  Injectable,
  UnauthorizedException,
  Logger,
  Inject,
} from '@nestjs/common';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { JwtService } from '@nestjs/jwt';

import { DRIZZLE_DATABASE } from '../../database/connection';
import {
  hashPassword,
  verifyPassword,
} from '../../common/utils/password';
import type { Admin, LoginRequest } from '@shared/api.interface';

const DB_TIMEOUT_MS = 15000;
const DEFAULT_ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_PASSWORD = 'admin123';
const logger = new Logger('AuthService');
const rawLog = globalThis.console.log.bind(globalThis.console);
const rawError = globalThis.console.error.bind(globalThis.console);

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      const err = new Error(`DB operation timed out after ${ms}ms: ${label}`);
      rawError(`[AuthService] TIMEOUT: ${label} after ${ms}ms`);
      reject(err);
    }, ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

@Injectable()
export class AuthService {
  private defaultAdminCreated = false;

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly jwtService: JwtService,
  ) {}

  private get sql(): ReturnType<typeof import('postgres')> {
    return (this.db as unknown as { $client: ReturnType<typeof import('postgres')> }).$client;
  }

  private async verifyPassword(
    password: string,
    passwordHash: string,
  ): Promise<boolean> {
    return verifyPassword(password, passwordHash);
  }

  private async ensureDefaultAdmin(): Promise<void> {
    if (this.defaultAdminCreated) return;

    try {
      rawLog(`[AuthService.ensureDefaultAdmin] STEP1 enter`);
      rawLog(
        `[AuthService] Checking if default admin (${DEFAULT_ADMIN_USERNAME}) exists...`,
      );

      rawLog(`[AuthService.ensureDefaultAdmin] STEP2 before select SQL`);
      const existing = await withTimeout(
        this.sql`
          SELECT id
          FROM admin
          WHERE username = ${DEFAULT_ADMIN_USERNAME}
          LIMIT 1
        `,
        DB_TIMEOUT_MS,
        'check-default-admin',
      );
      rawLog(`[AuthService.ensureDefaultAdmin] STEP3 select SQL returned rows=${existing.length}`);

      if (existing.length > 0) {
        rawLog(`[AuthService] Admin user already exists, skipping creation`);
        this.defaultAdminCreated = true;
        return;
      }

      rawLog(
        `[AuthService] No admin found, creating default admin user (${DEFAULT_ADMIN_USERNAME}/${DEFAULT_ADMIN_PASSWORD})...`,
      );

      const passwordHash = await hashPassword(DEFAULT_ADMIN_PASSWORD);

      rawLog(`[AuthService.ensureDefaultAdmin] STEP2 before insert SQL`);
      const result = await withTimeout(
        this.sql`
          INSERT INTO admin (username, password_hash)
          VALUES (${DEFAULT_ADMIN_USERNAME}, ${passwordHash})
          RETURNING id, username
        `,
        DB_TIMEOUT_MS,
        'create-default-admin',
      );
      rawLog(`[AuthService.ensureDefaultAdmin] STEP3 insert SQL returned rows=${result.length}`);

      this.defaultAdminCreated = true;
      rawLog(
        `[AuthService] Default admin created successfully: id=${(result[0] as any).id}, username=${(result[0] as any).username}`,
      );
      logger.log(
        `Default admin created: ${(result[0] as any).username} (id=${(result[0] as any).id})`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      rawError(`[AuthService] Failed to create default admin: ${msg}`);
      if (err instanceof Error && err.stack) {
        rawError(`[AuthService] Stack: ${err.stack}`);
      }
      logger.error(`Failed to create default admin: ${msg}`);
      throw err;
    }
  }

  async login(dto: LoginRequest): Promise<{ admin: Admin; token: string }> {
    const t0 = Date.now();
    rawLog(`[AuthService.login] STEP1 enter username="${dto.username}" (len=${dto.username?.length ?? 0})`);

    let rows: Array<{
      id: string;
      username: string;
      password_hash: string;
    }>;

    try {
      rawLog(`[AuthService.login] STEP2 before select SQL`);
      const result = await withTimeout(
        this.sql`
          SELECT id, username, password_hash
          FROM admin
          WHERE username = ${dto.username}
          LIMIT 1
        `,
        DB_TIMEOUT_MS,
        `select-admin-${dto.username}`,
      );
      rawLog(`[AuthService.login] STEP3 select SQL returned rows=${result.length}`);
      rows = result as unknown as Array<{ id: string; username: string; password_hash: string }>;
    } catch (dbErr) {
      const msg =
        dbErr instanceof Error ? dbErr.message : String(dbErr);
      rawError(`[Login] DB query FAILED: ${msg}`);
      logger.error(`Login DB query failed: ${msg}`);
      throw new UnauthorizedException('服务暂时不可用，请稍后重试');
    }

    const t1 = Date.now();
    rawLog(`[Login] DB query: ${t1 - t0}ms, rows=${rows.length}`);
    logger.log(`[Login] DB query: ${t1 - t0}ms (rows=${rows.length})`);

    if (rows.length === 0) {
      if (dto.username === DEFAULT_ADMIN_USERNAME) {
        rawLog(
          `[Login] Default admin not found, triggering ensureDefaultAdmin...`,
        );
        try {
          await this.ensureDefaultAdmin();
          rawLog(`[Login] ensureDefaultAdmin completed successfully`);
        } catch (createErr) {
          const msg =
            createErr instanceof Error ? createErr.message : String(createErr);
          rawError(
            `[Login] ensureDefaultAdmin FAILED: ${msg}. Login will be rejected.`,
          );
          if (createErr instanceof Error && createErr.stack) {
            rawError(`[Login] ensureDefaultAdmin stack: ${createErr.stack}`);
          }
          throw new UnauthorizedException('服务暂时不可用，请稍后重试');
        }

        try {
          rawLog(`[AuthService.login] STEP2 before reselect SQL`);
          const result = await withTimeout(
            this.sql`
              SELECT id, username, password_hash
              FROM admin
              WHERE username = ${dto.username}
              LIMIT 1
            `,
            DB_TIMEOUT_MS,
            `reselect-admin-after-create`,
          );
          rawLog(`[AuthService.login] STEP3 reselect SQL returned rows=${result.length}`);
          rows = result as unknown as Array<{ id: string; username: string; password_hash: string }>;
        } catch (dbErr) {
          const msg =
            dbErr instanceof Error ? dbErr.message : String(dbErr);
          rawError(`[Login] Re-select after create FAILED: ${msg}`);
          throw new UnauthorizedException('服务暂时不可用，请稍后重试');
        }

        if (rows.length === 0) {
          rawError(`[Login] Admin still not found after creation attempt`);
          throw new UnauthorizedException('服务暂时不可用，请稍后重试');
        }
      } else {
        rawLog(`[Login] User not found: ${dto.username}`);
        throw new UnauthorizedException('用户名或密码错误');
      }
    }

    const row = rows[0]!;
    rawLog(
      `[Login] Found user id=${row.id}, hashPrefix=${row.password_hash.slice(0, 20)}...`,
    );

    let passwordValid: boolean;
    try {
      passwordValid = await this.verifyPassword(dto.password, row.password_hash);
    } catch (verifyErr) {
      const msg =
        verifyErr instanceof Error ? verifyErr.message : String(verifyErr);
      rawError(`[Login] Password verify error: ${msg}`);
      throw new UnauthorizedException('用户名或密码错误');
    }

    const t2 = Date.now();
    rawLog(
      `[Login] Password verify: ${t2 - t1}ms, valid=${passwordValid}`,
    );
    logger.log(
      `[Login] Password verify: ${t2 - t1}ms (valid=${passwordValid})`,
    );

    if (!passwordValid) {
      rawLog(`[Login] Password invalid for user ${dto.username}`);
      throw new UnauthorizedException('用户名或密码错误');
    }

    const adminUser: Admin = { id: row.id, username: row.username };
    const token = this.jwtService.sign(
      { sub: row.id, username: row.username },
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    );
    const t3 = Date.now();
    rawLog(`[Login] JWT sign: ${t3 - t2}ms, total: ${t3 - t0}ms`);
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
