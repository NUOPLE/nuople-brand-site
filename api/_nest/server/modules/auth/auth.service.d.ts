import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { JwtService } from '@nestjs/jwt';
import type { Admin, LoginRequest } from '@shared/api.interface';
export declare class AuthService {
    private readonly db;
    private readonly jwtService;
    private defaultAdminCreated;
    constructor(db: PostgresJsDatabase, jwtService: JwtService);
    private get sql();
    private verifyPassword;
    private ensureDefaultAdmin;
    login(dto: LoginRequest): Promise<{
        admin: Admin;
        token: string;
    }>;
    extractTokenFromRequest(request: any): string | null;
    verifyToken(token: string): Promise<Admin | null>;
    getAdminFromRequest(request: any): Promise<Admin | null>;
}
