import {
  Module,
  Global,
  OnModuleInit,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';

import { DRIZZLE_DATABASE, getDatabase } from './connection';

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
