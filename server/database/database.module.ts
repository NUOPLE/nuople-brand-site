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
          rawLog('[DatabaseModule] Waiting for DB connection init...');
          try {
            await initPromise;
            rawLog('[DatabaseModule] DB connection verified, provider ready');
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

        rawLog('[DatabaseModule] Starting background auto-migrations (fire-and-forget)...');
        let migrationDone = false;
        runMigrations(db)
          .then(() => {
            migrationDone = true;
            rawLog('[DatabaseModule] Background auto-migrations DONE');
            return ensureDefaultAdmin(db);
          })
          .then(() => {
            rawLog('[DatabaseModule] Background default admin seed DONE');
          })
          .catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : String(err);
            rawError(`[DatabaseModule] Background migration/seed FAILED: ${msg}`);
            Logger.error(`Background migration/seed failed: ${msg}`, 'DatabaseModule');
            if (err instanceof Error && err.stack) {
              rawError(`[DatabaseModule] Stack: ${err.stack}`);
            }
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
