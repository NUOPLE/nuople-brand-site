import { drizzle } from 'drizzle-orm/postgres-js';
// eslint-disable-next-line import/no-extraneous-dependencies
import postgres from 'postgres';
import { Logger } from '@nestjs/common';

const logger = new Logger('Database');

let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDatabase(): ReturnType<typeof drizzle> {
  if (dbInstance) return dbInstance;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const sslMode = process.env.PGSSLMODE || process.env.DATABASE_SSL;
  let ssl: boolean | { rejectUnauthorized: boolean } = false;

  if (sslMode && sslMode !== 'disable' && sslMode !== 'false') {
    ssl = { rejectUnauthorized: false };
  } else if (
    databaseUrl.includes('supabase') ||
    databaseUrl.includes('aws') ||
    databaseUrl.includes('neon') ||
    databaseUrl.includes('cockroach')
  ) {
    ssl = { rejectUnauthorized: false };
  }

  const sql = postgres(databaseUrl, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 15,
    ssl,
    connection: {
      application_name: 'nuople-cms',
    },
  });

  dbInstance = drizzle(sql);
  logger.log('Database connection established');
  return dbInstance;
}

export const DRIZZLE_DATABASE = 'DRIZZLE_DATABASE';
