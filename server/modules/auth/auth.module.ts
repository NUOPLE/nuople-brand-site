import {
  Module,
  OnApplicationBootstrap,
  Logger,
  Inject,
} from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { AuthController } from './auth.controller';
import { AuthService, hashPassword } from './auth.service';
import { DRIZZLE_DATABASE } from '../../database/connection';
import { admin } from '../../database/schema';

const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'admin123';
const logger = new Logger('AuthModule');

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ||
          'default-jwt-secret-change-in-production',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule implements OnApplicationBootstrap {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const result = await this.db
        .select({ id: admin.id, username: admin.username })
        .from(admin)
        .limit(1);

      if (result.length > 0) {
        logger.log(`Admin user exists: ${result[0]!.username}`);
        return;
      }

      logger.log(
        `No admin user found, creating default admin (${DEFAULT_USERNAME}/${DEFAULT_PASSWORD})...`,
      );

      const passwordHash = await hashPassword(DEFAULT_PASSWORD);
      const insertResult = await this.db
        .insert(admin)
        .values({
          username: DEFAULT_USERNAME,
          passwordHash,
        })
        .returning({ id: admin.id, username: admin.username });

      logger.log(
        `Default admin created: id=${insertResult[0]!.id}, username=${insertResult[0]!.username}`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to ensure default admin user: ${msg}`);
      if (err instanceof Error && err.stack) {
        logger.error(err.stack);
      }
    }
  }
}
