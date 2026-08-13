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
exports.hashPassword = hashPassword;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const crypto_1 = require("crypto");
const jwt_1 = require("@nestjs/jwt");
const connection_1 = require("../../database/connection");
const schema_1 = require("../../database/schema");
const ITERATIONS = 10000;
const KEY_LEN = 64;
const DIGEST = 'sha256';
function hashPassword(password) {
    const salt = (0, crypto_1.randomBytes)(16).toString('hex');
    const hash = (0, crypto_1.pbkdf2Sync)(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString('hex');
    return `SALTED_SHA256$${salt}$${hash}`;
}
let AuthService = class AuthService {
    db;
    jwtService;
    constructor(db, jwtService) {
        this.db = db;
        this.jwtService = jwtService;
    }
    verifyPassword(password, passwordHash) {
        const parts = passwordHash.split('$');
        if (parts.length !== 3 || parts[0] !== 'SALTED_SHA256')
            return false;
        const salt = parts[1];
        const expectedHash = parts[2];
        const hash = (0, crypto_1.pbkdf2Sync)(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString('hex');
        return hash === expectedHash;
    }
    async login(dto) {
        const rows = await this.db
            .select({ id: schema_1.admin.id, username: schema_1.admin.username, passwordHash: schema_1.admin.passwordHash })
            .from(schema_1.admin)
            .where((0, drizzle_orm_1.eq)(schema_1.admin.username, dto.username))
            .limit(1);
        if (rows.length === 0) {
            throw new common_1.UnauthorizedException('用户名或密码错误');
        }
        const row = rows[0];
        if (!this.verifyPassword(dto.password, row.passwordHash)) {
            throw new common_1.UnauthorizedException('用户名或密码错误');
        }
        const adminUser = { id: row.id, username: row.username };
        const token = this.jwtService.sign({ sub: row.id, username: row.username }, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
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
    __param(0, (0, common_2.Inject)(connection_1.DRIZZLE_DATABASE)),
    __metadata("design:paramtypes", [Function, jwt_1.JwtService])
], AuthService);
