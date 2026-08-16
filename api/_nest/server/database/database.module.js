"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const connection_1 = require("./connection");
const migration_1 = require("./migration");
const rawLog = globalThis.console.log.bind(globalThis.console);
const rawError = globalThis.console.error.bind(globalThis.console);
let DatabaseModule = class DatabaseModule {
    onModuleInit() {
        if (process.env.DATABASE_URL) {
            common_1.Logger.log('Database module initializing...', 'DatabaseModule');
        }
        else {
            common_1.Logger.warn('DATABASE_URL not set, database will not be available', 'DatabaseModule');
        }
    }
    onApplicationBootstrap() {
        common_1.Logger.log('Database module ready', 'DatabaseModule');
    }
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            {
                provide: connection_1.DRIZZLE_DATABASE,
                useFactory: async () => {
                    const db = (0, connection_1.getDatabase)();
                    const initPromise = db.$initPromise;
                    if (initPromise) {
                        rawLog('[DatabaseModule] Waiting for DB connection init...');
                        try {
                            await initPromise;
                            rawLog('[DatabaseModule] DB connection verified, provider ready');
                        }
                        catch (err) {
                            const msg = err instanceof Error ? err.message : String(err);
                            common_1.Logger.error(`Database connection failed: ${msg}`, 'DatabaseModule');
                            rawError(`[DatabaseModule] DB connection FAILED: ${msg}`);
                            throw new Error(`Database connection failed: ${msg}`);
                        }
                    }
                    rawLog('[DatabaseModule] Starting background auto-migrations (fire-and-forget)...');
                    let migrationDone = false;
                    (0, migration_1.runMigrations)(db)
                        .then(() => {
                        migrationDone = true;
                        rawLog('[DatabaseModule] Background auto-migrations DONE');
                        return (0, migration_1.ensureDefaultAdmin)(db);
                    })
                        .then(() => {
                        rawLog('[DatabaseModule] Background default admin seed DONE');
                    })
                        .catch((err) => {
                        const msg = err instanceof Error ? err.message : String(err);
                        rawError(`[DatabaseModule] Background migration/seed FAILED: ${msg}`);
                        common_1.Logger.error(`Background migration/seed failed: ${msg}`, 'DatabaseModule');
                        if (err instanceof Error && err.stack) {
                            rawError(`[DatabaseModule] Stack: ${err.stack}`);
                        }
                    });
                    return db;
                },
            },
        ],
        exports: [connection_1.DRIZZLE_DATABASE],
    })
], DatabaseModule);
