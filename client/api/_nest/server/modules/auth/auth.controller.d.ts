import type { Request } from 'express';
import { AuthService } from './auth.service';
import type { Admin, LoginRequest, SuccessResponse } from '@shared/api.interface';
export interface LoginResponse {
    admin: Admin;
    token: string;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(body: LoginRequest): Promise<LoginResponse>;
    me(req: Request): Promise<Admin>;
    logout(): SuccessResponse;
}
