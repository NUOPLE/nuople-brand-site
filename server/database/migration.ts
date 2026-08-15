import { Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

import { admin } from './schema';
import { hashPassword } from '../common/utils/password';

type AnyDb = {
  execute: (query: unknown) => Promise<unknown>;
  select: (...args: unknown[]) => any;
  insert: (...args: unknown[]) => any;
};

const asDb = (db: unknown): AnyDb => db as AnyDb;

const logger = new Logger('DBMigration');
const rawLog = globalThis.console.log.bind(globalThis.console);
const rawError = globalThis.console.error.bind(globalThis.console);

const DEFAULT_ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_PASSWORD = 'admin123';

const CREATE_TABLES_SQL = sql.raw(`
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
`);

export async function runMigrations(db: unknown): Promise<void> {
  rawLog('[DBMigration] Running CREATE TABLE IF NOT EXISTS migrations...');
  try {
    await asDb(db).execute(CREATE_TABLES_SQL);
    rawLog('[DBMigration] Tables created/verified successfully');
    logger.log('All tables verified (CREATE TABLE IF NOT EXISTS)');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    rawError(`[DBMigration] FAILED: ${msg}`);
    if (err instanceof Error && err.stack) {
      rawError(`[DBMigration] Stack: ${err.stack}`);
    }
    logger.error(`Migration failed: ${msg}`);
    throw err;
  }
}

export async function ensureDefaultAdmin(db: unknown): Promise<void> {
  rawLog('[DBMigration] Ensuring default admin user exists...');
  try {
    const existing = await asDb(db)
      .select({ id: admin.id })
      .from(admin)
      .where(eq(admin.username, DEFAULT_ADMIN_USERNAME))
      .limit(1);

    if (existing.length > 0) {
      rawLog('[DBMigration] Admin user already exists, skipping');
      return;
    }

    rawLog('[DBMigration] No admin found, creating default admin/admin123...');
    const passwordHash = await hashPassword(DEFAULT_ADMIN_PASSWORD);
    const result = await asDb(db)
      .insert(admin)
      .values({ username: DEFAULT_ADMIN_USERNAME, passwordHash })
      .returning({ id: admin.id });

    rawLog(
      `[DBMigration] Default admin created successfully: id=${result[0]!.id}`,
    );
    logger.log('Default admin user created: admin/admin123');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    rawError(`[DBMigration] ensureDefaultAdmin FAILED: ${msg}`);
    if (err instanceof Error && err.stack) {
      rawError(`[DBMigration] Stack: ${err.stack}`);
    }
    logger.error(`Failed to create default admin: ${msg}`);
    throw err;
  }
}
