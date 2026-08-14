import { Module, Global, OnModuleInit, Logger, OnApplicationBootstrap } from '@nestjs/common';

import { DRIZZLE_DATABASE, getDatabase } from './connection';

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
export class DatabaseModule implements OnModuleInit, OnApplicationBootstrap {
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

  onApplicationBootstrap() {
    Logger.log(
      `Database URL configured: ${process.env.DATABASE_URL ? 'yes' : 'no'}`,
      'DatabaseModule',
    );
  }
}
