"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
exports.ensureDefaultAdmin = ensureDefaultAdmin;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const drizzle_orm_2 = require("drizzle-orm");
const schema_1 = require("./schema");
const password_1 = require("../common/utils/password");
const asDb = (db) => db;
const logger = new common_1.Logger('DBMigration');
const rawLog = globalThis.console.log.bind(globalThis.console);
const rawError = globalThis.console.error.bind(globalThis.console);
const DEFAULT_ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_PASSWORD = 'admin123';
const CREATE_TABLES_SQL = drizzle_orm_2.sql.raw(`
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";

  CREATE TABLE IF NOT EXISTS site_setting (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS keyword_rule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keywords TEXT[] NOT NULL DEFAULT '{}',
    reply_content TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_keyword_rule_sort ON keyword_rule (sort_order);

  CREATE TABLE IF NOT EXISTS message (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    reply_content TEXT,
    replied_at TIMESTAMPTZ(3),
    _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_message_is_read ON message (is_read);
  CREATE INDEX IF NOT EXISTS idx_message_created_at ON message (_created_at);

  CREATE TABLE IF NOT EXISTS work (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'logo',
    client VARCHAR(255) NOT NULL,
    industry VARCHAR(255) NOT NULL,
    design_type VARCHAR(255) NOT NULL,
    year VARCHAR(20) NOT NULL,
    description VARCHAR(500) NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    content TEXT NOT NULL,
    cover_image TEXT NOT NULL,
    hero_image TEXT NOT NULL,
    gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
    _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_work_category ON work (category);
  CREATE INDEX IF NOT EXISTS idx_work_created_at ON work (_created_at);

  CREATE TABLE IF NOT EXISTS admin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE UNIQUE INDEX IF NOT EXISTS admin_username_key ON admin (username);

  ALTER TABLE site_setting DISABLE ROW LEVEL SECURITY;
  ALTER TABLE keyword_rule DISABLE ROW LEVEL SECURITY;
  ALTER TABLE message DISABLE ROW LEVEL SECURITY;
  ALTER TABLE work DISABLE ROW LEVEL SECURITY;
  ALTER TABLE admin DISABLE ROW LEVEL SECURITY;
`);
const TABLE_NAMES = [
    'site_setting',
    'keyword_rule',
    'message',
    'work',
    'admin',
];
async function runMigrations(db) {
    rawLog('[DBMigration] Running CREATE TABLE IF NOT EXISTS migrations...');
    try {
        await asDb(db).execute(CREATE_TABLES_SQL);
        rawLog('[DBMigration] Tables created/verified successfully');
        logger.log('All tables verified (CREATE TABLE IF NOT EXISTS)');
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        rawError(`[DBMigration] FAILED: ${msg}`);
        if (err instanceof Error && err.stack) {
            rawError(`[DBMigration] Stack: ${err.stack}`);
        }
        let current = err;
        for (let depth = 0; depth < 4 && current && typeof current === 'object'; depth += 1) {
            const { code, severity, detail, schema, table, position, hint } = current;
            if (code !== undefined || detail !== undefined) {
                rawError(`[DBMigration] PostgresError depth=${depth}: code=${code}, severity=${severity}, detail=${detail}, schema=${schema}, table=${table}, position=${position}, hint=${hint}`);
            }
            const { cause } = current;
            current = cause;
        }
        logger.error(`Migration failed: ${msg}`);
        throw err;
    }
    rawLog('[DBMigration] Verifying tables exist...');
    try {
        const result = (await asDb(db).execute(drizzle_orm_2.sql.raw(`SELECT tablename FROM pg_tables WHERE schemaname = current_schema() AND tablename IN (${TABLE_NAMES.map((t) => `'${t}'`).join(', ')})`)));
        const existing = new Set(result.map((row) => row.tablename));
        const missing = TABLE_NAMES.filter((name) => !existing.has(name));
        rawLog(`[DBMigration] Table check: found=[${Array.from(existing).join(', ')}], missing=[${missing.join(', ')}]`);
        if (missing.length > 0) {
            rawError(`[DBMigration] CRITICAL: Missing tables: ${missing.join(', ')}`);
            throw new Error(`Tables missing after migration: ${missing.join(', ')}`);
        }
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        rawError(`[DBMigration] Verify tables FAILED: ${msg}`);
        throw err;
    }
}
async function ensureDefaultAdmin(db) {
    rawLog('[DBMigration] Ensuring default admin user exists...');
    try {
        const existing = await asDb(db)
            .select({ id: schema_1.admin.id })
            .from(schema_1.admin)
            .where((0, drizzle_orm_1.eq)(schema_1.admin.username, DEFAULT_ADMIN_USERNAME))
            .limit(1);
        if (existing.length > 0) {
            rawLog('[DBMigration] Admin user already exists, skipping');
            return;
        }
        rawLog('[DBMigration] No admin found, creating default admin/admin123...');
        const passwordHash = await (0, password_1.hashPassword)(DEFAULT_ADMIN_PASSWORD);
        const result = await asDb(db)
            .insert(schema_1.admin)
            .values({ username: DEFAULT_ADMIN_USERNAME, passwordHash })
            .returning({ id: schema_1.admin.id });
        rawLog(`[DBMigration] Default admin created successfully: id=${result[0].id}`);
        logger.log('Default admin user created: admin/admin123');
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        rawError(`[DBMigration] ensureDefaultAdmin FAILED: ${msg}`);
        if (err instanceof Error && err.stack) {
            rawError(`[DBMigration] Stack: ${err.stack}`);
        }
        logger.error(`Failed to create default admin: ${msg}`);
        throw err;
    }
}
