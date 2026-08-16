import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
export declare function getDatabase(): ReturnType<typeof drizzle>;
export declare function getRawSqlClient(): ReturnType<typeof postgres>;
export declare function getDatabaseInitPromise(): Promise<void> | null;
export declare function isDatabaseFailed(): boolean;
export declare function getDatabaseInitError(): Error | null;
export declare const DRIZZLE_DATABASE = "DRIZZLE_DATABASE";
