import { drizzle } from 'drizzle-orm/postgres-js';
// eslint-disable-next-line import/no-extraneous-dependencies
import postgres from 'postgres';
import { Logger } from '@nestjs/common';

const logger = new Logger('Database');
const rawLog = globalThis.console.log.bind(globalThis.console);
const rawError = globalThis.console.error.bind(globalThis.console);

let dbInstance: ReturnType<typeof drizzle> | null = null;
let initPromise: Promise<void> | null = null;
let initFailed = false;
let initError: Error | null = null;

export function getDatabase(): ReturnType<typeof drizzle> {
  if (dbInstance) return dbInstance;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    const err = new Error('DATABASE_URL environment variable is required');
    initFailed = true;
    initError = err;
    initPromise = Promise.reject(err);
    throw err;
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

  rawLog(`[DB] Creating postgres client (ssl=${Boolean(ssl)})`);
  const initStart = Date.now();

  const sql = postgres(databaseUrl, {
    max: 1,
    idle_timeout: 30,
    connect_timeout: 5,
    ssl,
    prepare: false,
    connection: {
      application_name: 'nuople-cms',
    },
    onnotice: (notice) => {
      rawLog(`[DB] NOTICE: ${notice.message}`);
    },
    onparameter: (status) => {
      rawLog(`[DB] PARAMETER STATUS: ${JSON.stringify(status)}`);
    },
  });

  const sqlAny = sql as unknown as {
    events?: { on: (event: string, cb: (...args: unknown[]) => void) => void };
  };

  if (sqlAny.events?.on) {
    sqlAny.events.on('error', (err: Error) => {
      rawError(`[DB] EVENT ERROR: ${err.message}`);
      rawError(`[DB] Stack: ${err.stack}`);
      if ((err as unknown as { cause?: unknown }).cause) {
        rawError(
          `[DB] Cause: ${JSON.stringify((err as unknown as { cause: unknown }).cause)}`,
        );
      }
    });

    sqlAny.events.on('notice', (notice: { message: string }) => {
      rawLog(`[DB] EVENT NOTICE: ${notice.message}`);
    });
  } else {
    rawLog('[DB] sql.events not available in this postgres version');
  }

  dbInstance = drizzle(sql);
  (dbInstance as unknown as { $initPromise: Promise<void> }).$initPromise = initPromise;
  logger.log('Database drizzle instance created');
  rawLog('[DB] drizzle instance created, verifying connection...');

  initPromise = sql`SELECT 1`
    .then(() => {
      const elapsed = Date.now() - initStart;
      logger.log(`Database connection verified in ${elapsed}ms (SELECT 1 OK)`);
      rawLog(`[DB] Connection verified successfully in ${elapsed}ms`);
    })
    .catch((err: unknown) => {
      initFailed = true;
      logger.error('Connection verification FAILED');
      rawError('[DB] Connection verification FAILED');
      if (err instanceof Error) {
        initError = err;
        logger.error(`Message: ${err.message}`);
        logger.error(`Stack: ${err.stack}`);
        rawError(`[DB] Message: ${err.message}`);
        rawError(`[DB] Stack: ${err.stack}`);
        rawError(`[DB] Name: ${err.name}`);
        const errWithCode = err as Error & {
          code?: string;
          severity?: string;
          detail?: string;
        };
        if (errWithCode.code) rawError(`[DB] Code: ${errWithCode.code}`);
        if (errWithCode.severity)
          rawError(`[DB] Severity: ${errWithCode.severity}`);
        if (errWithCode.detail) rawError(`[DB] Detail: ${errWithCode.detail}`);
        if (err.cause) rawError(`[DB] Cause: ${JSON.stringify(err.cause)}`);
      }
      dbInstance = null;
      throw err;
    });

  return dbInstance;
}

export function getDatabaseInitPromise(): Promise<void> | null {
  return initPromise;
}

export function isDatabaseFailed(): boolean {
  return initFailed;
}

export function getDatabaseInitError(): Error | null {
  return initError;
}

export const DRIZZLE_DATABASE = 'DRIZZLE_DATABASE';
