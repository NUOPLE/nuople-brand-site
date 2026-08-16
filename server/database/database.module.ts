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
            rawError(`[DatabaseModule] DB connection FAILED: ${msg}`);
            throw new Error(`Database connection failed: ${msg}`);
          }
        }

        rawLog('[DatabaseModule] Starting background auto-migrations...');
        runMigrations(db)
          .then(() => {
            rawLog('[DatabaseModule] Auto-migrations done');
            return ensureDefaultAdmin(db);
          })
          .then(() => {
            rawLog('[DatabaseModule] Default admin seed complete');
          })
          .catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : String(err);
            rawError(`[DatabaseModule] Background migration/seed FAILED: ${msg}`);
            Logger.error(`Background migration/seed failed: ${msg}`, 'DatabaseModule');
          });

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
