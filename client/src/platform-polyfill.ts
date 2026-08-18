/*
 * Global polyfill for Miaoda/Lark platform APIs.
 * Run as early as possible in index.tsx so platform globals never throw.
 */

declare global {
  interface Window {
    KSlardarWeb: (...args: unknown[]) => void;
    __slardarErrBuf: unknown[];
  }
}

const w = typeof window !== 'undefined' ? (window as any) : null;

if (w) {
  // Platform meta
  w.__platform__ = w.__platform__ || {};
  w.IS_MIAODA_PREVIEW = w.IS_MIAODA_PREVIEW ?? false;

  // User / tenant context
  w.csrfToken = w.csrfToken || '';
  w.userId = w.userId || '';
  w.tenantId = w.tenantId || '';
  w.appId = w.appId || '';
  w.ENVIRONMENT = w.ENVIRONMENT || 'production';
  w._appInfo = w._appInfo || null;
  w.__BASENAME__ = w.__BASENAME__ || '/';

  // Slardar error monitoring (no-op)
  w.KSlardarWeb = w.KSlardarWeb || function () {};
  w.__slardarErrBuf = w.__slardarErrBuf || [];

  // Tea / collectEvent analytics (no-op)
  if (!w.collectEvent) {
    const fn: any = function () {};
    fn.q = [];
    w.collectEvent = fn;
  }
}

export {};
