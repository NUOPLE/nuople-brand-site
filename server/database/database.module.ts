import {
  Module,
  Global,
  OnModuleInit,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';

import { DRIZZLE_DATABASE, getDatabase } from './connection';
import { runMigrations, ensureDefaultAdmin } from './migration';

const rawLog = globalThis.console.log.bind(globalThis.console);
const rawError = globalThis.console.error.bind(globalThis.console);

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE_DATABASE,
      useFactory: async () => {
        const db = getDatabase();
        const initPromise = (db as unknown as {
          $initPromise?: Promise<void>;
        }).$initPromise;
        if (initPromise) {
          try {
            await initPromise;
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            Logger.error(
              `Database connection failed: ${msg}`,
              'DatabaseModule',
            );
            throw new Error(`Database connection failed: ${msg}`);
          }
        }

        rawLog('[DatabaseModule] Running auto-migrations...');
        try {
          await runMigrations(db);
          rawLog('[DatabaseModule] Auto-migrations done');
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          rawError(`[DatabaseModule] Migration FAILED: ${msg}`);
          Logger.error(`Migration failed: ${msg}`, 'DatabaseModule');
          throw new Error(`Database migration failed: ${msg}`);
        }

        rawLog('[DatabaseModule] Seeding default admin (if needed)...');
        try {
          await ensureDefaultAdmin(db);
          rawLog('[DatabaseModule] Default admin seed complete');
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          rawError(`[DatabaseModule] Admin seed FAILED (non-fatal): ${msg}`);
          Logger.error(
            `Failed to seed default admin: ${msg}`,
            'DatabaseModule',
          );
        }

        return db;
      },
    },
  ],
  exports: [DRIZZLE_DATABASE],
})
export class DatabaseModule
  implements OnModuleInit, OnApplicationBootstrap
{
  onModuleInit() {
    if (process.env.DATABASE_URL) {
      Logger.log('Database module initializing...', 'DatabaseModule');
    } else {
      Logger.warn(
        'DATABASE_URL not set, database will not be available',
        'DatabaseModule',
      );
    }
  }

  onApplicationBootstrap() {
    Logger.log('Database module ready', 'DatabaseModule');
  }
}
