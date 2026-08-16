"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DRIZZLE_DATABASE = void 0;
exports.getDatabase = getDatabase;
exports.getRawSqlClient = getRawSqlClient;
exports.getDatabaseInitPromise = getDatabaseInitPromise;
exports.isDatabaseFailed = isDatabaseFailed;
exports.getDatabaseInitError = getDatabaseInitError;
const postgres_js_1 = require("drizzle-orm/postgres-js");
const postgres_1 = __importDefault(require("postgres"));
const common_1 = require("@nestjs/common");
const logger = new common_1.Logger('Database');
const rawLog = globalThis.console.log.bind(globalThis.console);
const rawError = globalThis.console.error.bind(globalThis.console);
let dbInstance = null;
let rawSqlInstance = null;
let initPromise = null;
let initFailed = false;
let initError = null;
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
async function verifyWithRetry(sql, maxRetries, delayMs) {
    let lastErr;
    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
        try {
            rawLog(`[DB] Connection verify attempt ${attempt}/${maxRetries}...`);
            await sql `SELECT 1`;
            rawLog(`[DB] Connection verified on attempt ${attempt}`);
            return;
        }
        catch (err) {
            lastErr = err;
            rawError(`[DB] Verify attempt ${attempt} failed: ${err instanceof Error ? err.message : String(err)}`);
            if (attempt < maxRetries) {
                rawLog(`[DB] Retrying in ${delayMs}ms...`);
                await sleep(delayMs);
            }
        }
    }
    throw lastErr;
}
function getDatabase() {
    if (dbInstance)
        return dbInstance;
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        const err = new Error('DATABASE_URL environment variable is required');
        initFailed = true;
        initError = err;
        initPromise = Promise.reject(err);
        throw err;
    }
    const sslMode = process.env.PGSSLMODE || process.env.DATABASE_SSL;
    let ssl = false;
    if (sslMode && sslMode !== 'disable' && sslMode !== 'false') {
        ssl = { rejectUnauthorized: false };
    }
    else if (databaseUrl.includes('supabase') ||
        databaseUrl.includes('aws') ||
        databaseUrl.includes('neon') ||
        databaseUrl.includes('cockroach')) {
        ssl = { rejectUnauthorized: false };
    }
    const connectTimeoutSec = parseInt(process.env.PG_CONNECT_TIMEOUT || '', 10) || 15;
    const maxRetries = parseInt(process.env.PG_CONNECT_RETRIES || '', 10) || 3;
    const retryDelayMs = parseInt(process.env.PG_CONNECT_RETRY_DELAY_MS || '', 10) || 1000;
    rawLog(`[DB] Creating postgres client (ssl=${Boolean(ssl)}, connect_timeout=${connectTimeoutSec}s, retries=${maxRetries})`);
    const initStart = Date.now();
    const sql = (0, postgres_1.default)(databaseUrl, {
        max: 3,
        idle_timeout: 15,
        connect_timeout: connectTimeoutSec,
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
        debug: (conn, query, params, types) => {
            const q = typeof query === 'string' ? query : query.string || String(query);
            const preview = q.length > 200 ? q.slice(0, 200) + '...' : q;
            const paramsPreview = params && params.length > 0
                ? ` params=[${params.map((p) => {
                    if (p == null)
                        return String(p);
                    const s = typeof p === 'string' ? p : JSON.stringify(p);
                    return s.length > 80 ? s.slice(0, 80) + '...' : s;
                }).join(', ')}]`
                : '';
            rawLog(`[DB] query conn=${conn} ${preview}${paramsPreview}`);
        },
    });
    const sqlAny = sql;
    if (sqlAny.events?.on) {
        sqlAny.events.on('error', (err) => {
            rawError(`[DB] EVENT ERROR: ${err.message}`);
            rawError(`[DB] Stack: ${err.stack}`);
            if (err.cause) {
                rawError(`[DB] Cause: ${JSON.stringify(err.cause)}`);
            }
        });
        sqlAny.events.on('notice', (notice) => {
            rawLog(`[DB] EVENT NOTICE: ${notice.message}`);
        });
    }
    else {
        rawLog('[DB] sql.events not available in this postgres version');
    }
    dbInstance = (0, postgres_js_1.drizzle)(sql);
    rawSqlInstance = sql;
    dbInstance.$initPromise = initPromise;
    logger.log('Database drizzle instance created');
    rawLog('[DB] drizzle instance created, verifying connection...');
    initPromise = verifyWithRetry(sql, maxRetries, retryDelayMs)
        .then(() => {
        const elapsed = Date.now() - initStart;
        logger.log(`Database connection verified in ${elapsed}ms (SELECT 1 OK)`);
        rawLog(`[DB] Connection verified successfully in ${elapsed}ms`);
    })
        .catch((err) => {
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
            const errWithCode = err;
            if (errWithCode.code)
                rawError(`[DB] Code: ${errWithCode.code}`);
            if (errWithCode.severity)
                rawError(`[DB] Severity: ${errWithCode.severity}`);
            if (errWithCode.detail)
                rawError(`[DB] Detail: ${errWithCode.detail}`);
            if (err.cause)
                rawError(`[DB] Cause: ${JSON.stringify(err.cause)}`);
        }
        dbInstance = null;
        throw err;
    });
    return dbInstance;
}
function getRawSqlClient() {
    if (!rawSqlInstance) {
        getDatabase();
    }
    if (!rawSqlInstance) {
        throw new Error('Raw SQL client not initialized');
    }
    return rawSqlInstance;
}
function getDatabaseInitPromise() {
    return initPromise;
}
function isDatabaseFailed() {
    return initFailed;
}
function getDatabaseInitError() {
    return initError;
}
exports.DRIZZLE_DATABASE = 'DRIZZLE_DATABASE';
