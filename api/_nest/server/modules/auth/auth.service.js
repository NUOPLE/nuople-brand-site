"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const connection_1 = require("../../database/connection");
const password_1 = require("../../common/utils/password");
const DB_TIMEOUT_MS = 15000;
const DEFAULT_ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_PASSWORD = 'admin123';
const logger = new common_1.Logger('AuthService');
const rawLog = globalThis.console.log.bind(globalThis.console);
const rawError = globalThis.console.error.bind(globalThis.console);
function withTimeout(promise, ms, label) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            const err = new Error(`DB operation timed out after ${ms}ms: ${label}`);
            rawError(`[AuthService] TIMEOUT: ${label} after ${ms}ms`);
            reject(err);
        }, ms);
        promise
            .then((value) => {
            clearTimeout(timer);
            resolve(value);
        })
            .catch((err) => {
            clearTimeout(timer);
            reject(err);
        });
    });
}
let AuthService = class AuthService {
    db;
    jwtService;
    defaultAdminCreated = false;
    constructor(db, jwtService) {
        this.db = db;
        this.jwtService = jwtService;
    }
    get sql() {
        return this.db.$client;
    }
    async verifyPassword(password, passwordHash) {
        return (0, password_1.verifyPassword)(password, passwordHash);
    }
    async ensureDefaultAdmin() {
        if (this.defaultAdminCreated)
            return;
        try {
            rawLog(`[AuthService.ensureDefaultAdmin] STEP1 enter`);
            rawLog(`[AuthService] Checking if default admin (${DEFAULT_ADMIN_USERNAME}) exists...`);
            rawLog(`[AuthService.ensureDefaultAdmin] STEP2 before select SQL`);
            const existing = await withTimeout(this.sql `
          SELECT id
          FROM admin
          WHERE username = ${DEFAULT_ADMIN_USERNAME}
          LIMIT 1
        `, DB_TIMEOUT_MS, 'check-default-admin');
            rawLog(`[AuthService.ensureDefaultAdmin] STEP3 select SQL returned rows=${existing.length}`);
            if (existing.length > 0) {
                rawLog(`[AuthService] Admin user already exists, skipping creation`);
                this.defaultAdminCreated = true;
                return;
            }
            rawLog(`[AuthService] No admin found, creating default admin user (${DEFAULT_ADMIN_USERNAME}/${DEFAULT_ADMIN_PASSWORD})...`);
            const passwordHash = await (0, password_1.hashPassword)(DEFAULT_ADMIN_PASSWORD);
            rawLog(`[AuthService.ensureDefaultAdmin] STEP2 before insert SQL`);
            const result = await withTimeout(this.sql `
          INSERT INTO admin (username, password_hash)
          VALUES (${DEFAULT_ADMIN_USERNAME}, ${passwordHash})
          RETURNING id, username
        `, DB_TIMEOUT_MS, 'create-default-admin');
            rawLog(`[AuthService.ensureDefaultAdmin] STEP3 insert SQL returned rows=${result.length}`);
            this.defaultAdminCreated = true;
            rawLog(`[AuthService] Default admin created successfully: id=${result[0].id}, username=${result[0].username}`);
            logger.log(`Default admin created: ${result[0].username} (id=${result[0].id})`);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            rawError(`[AuthService] Failed to create default admin: ${msg}`);
            if (err instanceof Error && err.stack) {
                rawError(`[AuthService] Stack: ${err.stack}`);
            }
            logger.error(`Failed to create default admin: ${msg}`);
            throw err;
        }
    }
    async login(dto) {
        const t0 = Date.now();
        rawLog(`[AuthService.login] STEP1 enter username="${dto.username}" (len=${dto.username?.length ?? 0})`);
        let rows;
        try {
            rawLog(`[AuthService.login] STEP2 before select SQL`);
            const result = await withTimeout(this.sql `
          SELECT id, username, password_hash
          FROM admin
          WHERE username = ${dto.username}
          LIMIT 1
        `, DB_TIMEOUT_MS, `select-admin-${dto.username}`);
            rawLog(`[AuthService.login] STEP3 select SQL returned rows=${result.length}`);
            rows = result;
        }
        catch (dbErr) {
            const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
            rawError(`[Login] DB query FAILED: ${msg}`);
            logger.error(`Login DB query failed: ${msg}`);
            throw new common_1.UnauthorizedException('服务暂时不可用，请稍后重试');
        }
        const t1 = Date.now();
        rawLog(`[Login] DB query: ${t1 - t0}ms, rows=${rows.length}`);
        logger.log(`[Login] DB query: ${t1 - t0}ms (rows=${rows.length})`);
        if (rows.length === 0) {
            if (dto.username === DEFAULT_ADMIN_USERNAME) {
                rawLog(`[Login] Default admin not found, triggering ensureDefaultAdmin...`);
                try {
                    await this.ensureDefaultAdmin();
                    rawLog(`[Login] ensureDefaultAdmin completed successfully`);
                }
                catch (createErr) {
                    const msg = createErr instanceof Error ? createErr.message : String(createErr);
                    rawError(`[Login] ensureDefaultAdmin FAILED: ${msg}. Login will be rejected.`);
                    if (createErr instanceof Error && createErr.stack) {
                        rawError(`[Login] ensureDefaultAdmin stack: ${createErr.stack}`);
                    }
                    throw new common_1.UnauthorizedException('服务暂时不可用，请稍后重试');
                }
                try {
                    rawLog(`[AuthService.login] STEP2 before reselect SQL`);
                    const result = await withTimeout(this.sql `
              SELECT id, username, password_hash
              FROM admin
              WHERE username = ${dto.username}
              LIMIT 1
            `, DB_TIMEOUT_MS, `reselect-admin-after-create`);
                    rawLog(`[AuthService.login] STEP3 reselect SQL returned rows=${result.length}`);
                    rows = result;
                }
                catch (dbErr) {
                    const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
                    rawError(`[Login] Re-select after create FAILED: ${msg}`);
                    throw new common_1.UnauthorizedException('服务暂时不可用，请稍后重试');
                }
                if (rows.length === 0) {
                    rawError(`[Login] Admin still not found after creation attempt`);
                    throw new common_1.UnauthorizedException('服务暂时不可用，请稍后重试');
                }
            }
            else {
                rawLog(`[Login] User not found: ${dto.username}`);
                throw new common_1.UnauthorizedException('用户名或密码错误');
            }
        }
        const row = rows[0];
        rawLog(`[Login] Found user id=${row.id}, hashPrefix=${row.password_hash.slice(0, 20)}...`);
        let passwordValid;
        try {
            passwordValid = await this.verifyPassword(dto.password, row.password_hash);
        }
        catch (verifyErr) {
            const msg = verifyErr instanceof Error ? verifyErr.message : String(verifyErr);
            rawError(`[Login] Password verify error: ${msg}`);
            throw new common_1.UnauthorizedException('用户名或密码错误');
        }
        const t2 = Date.now();
        rawLog(`[Login] Password verify: ${t2 - t1}ms, valid=${passwordValid}`);
        logger.log(`[Login] Password verify: ${t2 - t1}ms (valid=${passwordValid})`);
        if (!passwordValid) {
            rawLog(`[Login] Password invalid for user ${dto.username}`);
            throw new common_1.UnauthorizedException('用户名或密码错误');
        }
        const adminUser = { id: row.id, username: row.username };
        const token = this.jwtService.sign({ sub: row.id, username: row.username }, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
        const t3 = Date.now();
        rawLog(`[Login] JWT sign: ${t3 - t2}ms, total: ${t3 - t0}ms`);
        logger.log(`[Login] JWT sign: ${t3 - t2}ms, total: ${t3 - t0}ms`);
        return { admin: adminUser, token };
    }
    extractTokenFromRequest(request) {
        const authHeader = request.headers?.authorization ?? '';
        if (!authHeader.startsWith('Bearer '))
            return null;
        return authHeader.slice(7);
    }
    async verifyToken(token) {
        try {
            const payload = await this.jwtService.verifyAsync(token);
            return { id: payload.sub, username: payload.username };
        }
        catch {
            return null;
        }
    }
    async getAdminFromRequest(request) {
        const token = this.extractTokenFromRequest(request);
        if (!token)
            return null;
        return this.verifyToken(token);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(connection_1.DRIZZLE_DATABASE)),
    __metadata("design:paramtypes", [Function, jwt_1.JwtService])
], AuthService);
