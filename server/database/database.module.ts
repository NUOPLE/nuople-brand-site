import { Module, Global, OnModuleInit, Logger } from '@nestjs/common';

import { DRIZZLE_DATABASE, getDatabase } from './connection';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE_DATABASE,
      useFactory: () => {
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
          Logger.warn(
            'DATABASE_URL not set, database will not be available',
            'DatabaseModule',
          );
          return null;
        }
        return getDatabase();
      },
    },
  ],
  exports: [DRIZZLE_DATABASE],
})
export class DatabaseModule implements OnModuleInit {
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
}
