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
    const sql = (0, postgres_1.default)(databaseUrl, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
    });
    dbInstance = (0, postgres_js_1.drizzle)(sql);
    logger.log('Database connection established');
    return dbInstance;
}
exports.DRIZZLE_DATABASE = 'DRIZZLE_DATABASE';
