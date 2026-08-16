"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workTable = exports.siteSettingTable = exports.messageTable = exports.keywordRuleTable = exports.adminTable = exports.admin = exports.work = exports.message = exports.keywordRule = exports.siteSetting = exports.fileAttachmentArray = exports.userProfileArray = exports.fileAttachment = exports.userProfile = exports.customTimestamptz = void 0;
exports.escapeLiteral = escapeLiteral;
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
exports.customTimestamptz = (0, pg_core_1.customType)({
    dataType(config) {
        const precision = typeof config?.precision !== 'undefined'
            ? ` (${config.precision})`
            : '';
        return `timestamptz${precision}`;
    },
    toDriver(value) {
        if (value == null)
            return value;
        if (typeof value === 'number')
            return new Date(value).toISOString();
        if (typeof value === 'string')
            return value;
        if (value instanceof Date)
            return value.toISOString();
        throw new Error('Invalid timestamp value');
    },
    fromDriver(value) {
        if (value instanceof Date)
            return value;
        return new Date(value);
    },
});
exports.userProfile = (0, pg_core_1.customType)({
    dataType() {
        return 'user_profile';
    },
    toDriver(value) {
        return (0, drizzle_orm_1.sql) `ROW(${value})::user_profile`;
    },
    fromDriver(value) {
        const [userId] = value.slice(1, -1).split(',');
        return userId.trim();
    },
});
exports.fileAttachment = (0, pg_core_1.customType)({
    dataType() {
        return 'file_attachment';
    },
    toDriver(value) {
        return (0, drizzle_orm_1.sql) `ROW(${value.bucket_id},${value.file_path})::file_attachment`;
    },
    fromDriver(value) {
        const [bucketId, filePath] = value.slice(1, -1).split(',');
        return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
    },
});
function escapeLiteral(str) {
    return "'" + str.replace(/'/g, "''") + "'";
}
exports.userProfileArray = (0, pg_core_1.customType)({
    dataType() {
        return 'user_profile[]';
    },
    toDriver(value) {
        if (!value || value.length === 0) {
            return (0, drizzle_orm_1.sql) `'{}'::user_profile[]`;
        }
        const elements = value.map(id => `ROW(${escapeLiteral(id)})::user_profile`).join(',');
        return drizzle_orm_1.sql.raw(`ARRAY[${elements}]::user_profile[]`);
    },
    fromDriver(value) {
        if (!value || value === '{}')
            return [];
        const inner = value.slice(1, -1);
        const matches = inner.match(/\([^)]*\)/g) || [];
        return matches.map(m => m.slice(1, -1).split(',')[0].trim());
    },
});
exports.fileAttachmentArray = (0, pg_core_1.customType)({
    dataType() {
        return 'file_attachment[]';
    },
    toDriver(value) {
        if (!value || value.length === 0) {
            return (0, drizzle_orm_1.sql) `'{}'::file_attachment[]`;
        }
        const elements = value.map(f => `ROW(${escapeLiteral(f.bucket_id)},${escapeLiteral(f.file_path)})::file_attachment`).join(',');
        return drizzle_orm_1.sql.raw(`ARRAY[${elements}]::file_attachment[]`);
    },
    fromDriver(value) {
        if (!value || value === '{}')
            return [];
        const inner = value.slice(1, -1);
        const matches = inner.match(/\([^)]*\)/g) || [];
        return matches.map(m => {
            const [bucketId, filePath] = m.slice(1, -1).split(',');
            return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
        });
    },
});
exports.siteSetting = (0, pg_core_1.pgTable)("site_setting", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    settingKey: (0, pg_core_1.varchar)("setting_key", { length: 100 }).notNull().unique(),
    settingValue: (0, pg_core_1.text)("setting_value").notNull(),
    createdAt: (0, exports.customTimestamptz)("_created_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    updatedAt: (0, exports.customTimestamptz)("_updated_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
}, (table) => [
    (0, pg_core_1.uniqueIndex)("site_setting_setting_key_key").on(table.settingKey),
]);
exports.keywordRule = (0, pg_core_1.pgTable)("keyword_rule", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    keywords: (0, pg_core_1.text)("keywords").array().notNull().default([]),
    replyContent: (0, pg_core_1.text)("reply_content").notNull(),
    sortOrder: (0, pg_core_1.integer)("sort_order").notNull().default(0),
    createdAt: (0, exports.customTimestamptz)("_created_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    updatedAt: (0, exports.customTimestamptz)("_updated_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
}, (table) => [
    (0, pg_core_1.index)("idx_keyword_rule_sort").on(table.sortOrder),
]);
exports.message = (0, pg_core_1.pgTable)("message", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
    email: (0, pg_core_1.varchar)("email", { length: 255 }).notNull(),
    content: (0, pg_core_1.text)("content").notNull(),
    isRead: (0, pg_core_1.boolean)("is_read").notNull().default(false),
    replyContent: (0, pg_core_1.text)("reply_content"),
    repliedAt: (0, exports.customTimestamptz)("replied_at", { precision: 3 }),
    createdAt: (0, exports.customTimestamptz)("_created_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    updatedAt: (0, exports.customTimestamptz)("_updated_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
}, (table) => [
    (0, pg_core_1.index)("idx_message_is_read").on(table.isRead),
    (0, pg_core_1.index)("idx_message_created_at").on(table.createdAt),
]);
exports.work = (0, pg_core_1.pgTable)("work", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    title: (0, pg_core_1.varchar)("title", { length: 255 }).notNull(),
    category: (0, pg_core_1.varchar)("category", { length: 50 }).notNull().default('logo'),
    client: (0, pg_core_1.varchar)("client", { length: 255 }).notNull(),
    industry: (0, pg_core_1.varchar)("industry", { length: 255 }).notNull(),
    designType: (0, pg_core_1.varchar)("design_type", { length: 255 }).notNull(),
    year: (0, pg_core_1.varchar)("year", { length: 20 }).notNull(),
    description: (0, pg_core_1.varchar)("description", { length: 500 }).notNull(),
    tags: (0, pg_core_1.text)("tags").array().notNull().default([]),
    content: (0, pg_core_1.text)("content").notNull(),
    coverImage: (0, pg_core_1.text)("cover_image").notNull(),
    heroImage: (0, pg_core_1.text)("hero_image").notNull(),
    gallery: (0, pg_core_1.jsonb)("gallery").notNull().default('[]'),
    createdAt: (0, exports.customTimestamptz)("_created_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    updatedAt: (0, exports.customTimestamptz)("_updated_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
}, (table) => [
    (0, pg_core_1.index)("idx_work_category").on(table.category),
    (0, pg_core_1.index)("idx_work_created_at").on(table.createdAt),
]);
exports.admin = (0, pg_core_1.pgTable)("admin", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    username: (0, pg_core_1.varchar)("username", { length: 100 }).notNull().unique(),
    passwordHash: (0, pg_core_1.varchar)("password_hash", { length: 255 }).notNull(),
    createdAt: (0, exports.customTimestamptz)("_created_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    updatedAt: (0, exports.customTimestamptz)("_updated_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
}, (table) => [
    (0, pg_core_1.uniqueIndex)("admin_username_key").on(table.username),
]);
exports.adminTable = exports.admin;
exports.keywordRuleTable = exports.keywordRule;
exports.messageTable = exports.message;
exports.siteSettingTable = exports.siteSetting;
exports.workTable = exports.work;
