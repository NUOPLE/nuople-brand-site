"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DRIZZLE_DATABASE = void 0;
exports.getDatabase = getDatabase;
exports.getDatabaseInitPromise = getDatabaseInitPromise;
const postgres_js_1 = require("drizzle-orm/postgres-js");
const postgres_1 = __importDefault(require("postgres"));
const common_1 = require("@nestjs/common");
const logger = new common_1.Logger('Database');
const rawLog = globalThis.console.log.bind(globalThis.console);
const rawError = globalThis.console.error.bind(globalThis.console);
let dbInstance = null;
let initPromise = null;
function getDatabase() {
    if (dbInstance)
        return dbInstance;
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable is required');
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
    rawLog(`[DB] Creating postgres client (ssl=${Boolean(ssl)})`);
    const sql = (0, postgres_1.default)(databaseUrl, {
        max: 1,
        idle_timeout: 10,
        connect_timeout: 10,
        ssl,
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
    logger.log('Database connection established');
    rawLog('[DB] drizzle instance created, starting connection verification...');
    initPromise = sql `SELECT 1`
        .then(() => {
        logger.log('Database connection verified (SELECT 1 OK)');
        rawLog('[DB] Connection verified successfully');
    })
        .catch((err) => {
        logger.error('Connection verification FAILED');
        rawError('[DB] Connection verification FAILED');
        if (err instanceof Error) {
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
    });
    return dbInstance;
}
function getDatabaseInitPromise() {
    return initPromise;
}
exports.DRIZZLE_DATABASE = 'DRIZZLE_DATABASE';
