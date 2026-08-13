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
let DatabaseModule = class DatabaseModule {
    onModuleInit() {
        if (process.env.DATABASE_URL) {
            common_1.Logger.log('Database module initialized', 'DatabaseModule');
        }
    }
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            {
                provide: connection_1.DRIZZLE_DATABASE,
                useFactory: () => {
                    const databaseUrl = process.env.DATABASE_URL;
                    if (!databaseUrl) {
                        common_1.Logger.warn('DATABASE_URL not set, database will not be available', 'DatabaseModule');
                        return null;
                    }
                    return (0, connection_1.getDatabase)();
                },
            },
        ],
        exports: [connection_1.DRIZZLE_DATABASE],
    })
], DatabaseModule);
