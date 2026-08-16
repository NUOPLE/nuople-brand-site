"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PASSWORD_PREFIX = exports.DIGEST = exports.KEY_LEN = exports.ITERATIONS = void 0;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
const crypto_1 = require("crypto");
const util_1 = require("util");
exports.ITERATIONS = 10000;
exports.KEY_LEN = 64;
exports.DIGEST = 'sha256';
exports.PASSWORD_PREFIX = 'SALTED_SHA256';
const pbkdf2Async = (0, util_1.promisify)(crypto_1.pbkdf2);
const randomBytesAsync = (0, util_1.promisify)(crypto_1.randomBytes);
async function hashPassword(password) {
    const salt = (await randomBytesAsync(16)).toString('hex');
    const hash = (await pbkdf2Async(password, salt, exports.ITERATIONS, exports.KEY_LEN, exports.DIGEST)).toString('hex');
    return `${exports.PASSWORD_PREFIX}$${salt}$${hash}`;
}
async function verifyPassword(password, passwordHash) {
    const parts = passwordHash.split('$');
    if (parts.length !== 3 || parts[0] !== exports.PASSWORD_PREFIX)
        return false;
    const salt = parts[1];
    const expectedHash = parts[2];
    const hash = (await pbkdf2Async(password, salt, exports.ITERATIONS, exports.KEY_LEN, exports.DIGEST)).toString('hex');
    return hash === expectedHash;
}
