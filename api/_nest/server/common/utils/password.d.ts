export declare const ITERATIONS = 10000;
export declare const KEY_LEN = 64;
export declare const DIGEST = "sha256";
export declare const PASSWORD_PREFIX = "SALTED_SHA256";
export declare function hashPassword(password: string): Promise<string>;
export declare function verifyPassword(password: string, passwordHash: string): Promise<boolean>;
