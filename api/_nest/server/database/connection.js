"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DRIZZLE_DATABASE = void 0;
exports.getDatabase = getDatabase;
const postgres_js_1 = require("drizzle-orm/postgres-js");
const postgres_1 = __importDefault(require("postgres"));
const common_1 = require("@nestjs/common");
const logger = new common_1.Logger('Database');
let dbInstance = null;
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
    const sql = (0, postgres_1.default)(databaseUrl, {
        max: 1,
        idle_timeout: 20,
        connect_timeout: 15,
        ssl,
        connection: {
            application_name: 'nuople-cms',
        },
    });
    dbInstance = (0, postgres_js_1.drizzle)(sql);
    logger.log('Database connection established');
    sql `SELECT 1`
        .then(() => {
        logger.log('Database connection verified (SELECT 1 OK)');
    })
        .catch((err) => {
        logger.error('Connection verification FAILED');
        if (err instanceof Error) {
            logger.error(`Message: ${err.message}`);
            logger.error(`Stack: ${err.stack}`);
        }
        dbInstance = null;
    });
    return dbInstance;
}
exports.DRIZZLE_DATABASE = 'DRIZZLE_DATABASE';
