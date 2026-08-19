/**
 * Lightweight logger replacement for @lark-apaas/client-toolkit/logger.
 * Used when running outside the Miaoda platform (standalone / Vercel deploys).
 */
const PREFIX = '[App]';
const c = console;

export const logger = {
  info(...args: unknown[]): void {
    c.log(PREFIX, ...args);
  },
  warn(...args: unknown[]): void {
    c.warn(PREFIX, ...args);
  },
  error(...args: unknown[]): void {
    c.error(PREFIX, ...args);
  },
  debug(...args: unknown[]): void {
    if (process.env.NODE_ENV === 'development') {
      c.debug(PREFIX, ...args);
    }
  },
};
