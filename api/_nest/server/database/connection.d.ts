import { drizzle } from 'drizzle-orm/postgres-js';
export declare function getDatabase(): ReturnType<typeof drizzle>;
export declare function getDatabaseInitPromise(): Promise<void> | null;
export declare const DRIZZLE_DATABASE = "DRIZZLE_DATABASE";
