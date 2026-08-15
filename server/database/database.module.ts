import {
  Module,
  Global,
  OnModuleInit,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';

import {
  DRIZZLE_DATABASE,
  getDatabase,
  getDatabaseInitPromise,
} from './connection';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE_DATABASE,
      useFactory: () => {
        return getDatabase();
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
      Logger.log('Database module initialized', 'DatabaseModule');
    } else {
      Logger.warn(
        'DATABASE_URL not set, database will not be available',
        'DatabaseModule',
      );
    }
  }

  async onApplicationBootstrap(): Promise<void> {
    Logger.log(
      `Database URL configured: ${process.env.DATABASE_URL ? 'yes' : 'no'}`,
      'DatabaseModule',
    );
    const initPromise = getDatabaseInitPromise();
    if (initPromise) {
      const t0 = Date.now();
      Logger.log('Waiting for database connection warmup...', 'DatabaseModule');
      try {
        await initPromise;
        Logger.log(
          `Database warmup completed in ${Date.now() - t0}ms`,
          'DatabaseModule',
        );
      } catch (err) {
        Logger.error(
          `Database warmup failed: ${err instanceof Error ? err.message : String(err)}`,
          'DatabaseModule',
        );
      }
    }
  }
}
