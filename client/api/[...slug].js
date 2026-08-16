const path = require('path');
const Module = require('module');

const baseDir = path.resolve(__dirname, '..');
const nestDir = path.join(__dirname, '_nest');

const aliases = {
  '@server': path.join(nestDir, 'server'),
  '@shared': path.join(nestDir, 'shared'),
  '@client': path.join(baseDir, 'client'),
};

const originalResolve = Module._resolveFilename;

Module._resolveFilename = function (request, parent, isMain, options) {
  for (const [alias, targetPath] of Object.entries(aliases)) {
    if (request === alias || request.startsWith(alias + '/')) {
      const resolved = path.join(targetPath, request.slice(alias.length));
      return originalResolve.call(this, resolved, parent, isMain, options);
    }
  }
  return originalResolve.call(this, request, parent, isMain, options);
};

const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const express = require('express');

console.log('[VercelHandler] Loading NestJS app...');
console.log(`[VercelHandler] NODE_ENV = ${process.env.NODE_ENV}`);
console.log(
  `[VercelHandler] DATABASE_URL ${
    process.env.DATABASE_URL ? 'is set' : 'NOT SET'
  }`,
);

let cachedApp = null;
let initPromise = null;

async function createApp() {
  try {
    console.log('[VercelHandler] Creating Express app...');
    const expressApp = express();

    expressApp.get('/api/health', (req, res) => {
      res.status(200).json({
        status: 'ok',
        timestamp: Date.now(),
        dbReady: cachedApp ? 'booted' : 'booting',
      });
    });

    expressApp.use((req, res, next) => {
      const start = Date.now();
      console.log(`[ReqTrace] IN  ${req.method} ${req.url}`);

      const origEnd = res.end;
      res.end = function (...args) {
        console.log(
          `[ReqTrace] OUT ${req.method} ${req.url} -> ${res.statusCode} (${Date.now() - start}ms)`,
        );
        return origEnd.apply(this, args);
      };

      next();
    });

    const adapter = new ExpressAdapter(expressApp);

    console.log('[VercelHandler] Bootstrapping NestFactory...');
    const { StandaloneAppModule } = require('./_nest/server/standalone.module.js');

    const app = await NestFactory.create(StandaloneAppModule, adapter, {
      logger: ['error', 'warn', 'log'],
      abortOnError: false,
    });

    app.enableCors({
      origin: true,
      credentials: true,
    });

    console.log('[VercelHandler] Calling app.init()...');
    await app.init();
    console.log('[VercelHandler] app.init() completed successfully');

    const httpServer = app.getHttpServer();
    const router = httpServer._events.request._router;
    const routeList = router.stack
      .filter((layer) => layer.route)
      .map(
        (layer) =>
          `${Object.keys(layer.route.methods)[0].toUpperCase()} ${layer.route.path}`,
      );
    console.log(
      `[VercelHandler] Registered ${routeList.length} routes: ${routeList.join(', ')}`,
    );

    expressApp.use((err, req, res, next) => {
      console.error(
        `[ExpressErrorMW] ERROR for ${req.method} ${req.url}`,
      );
      console.error(`[ExpressErrorMW] name: ${err?.name}`);
      console.error(`[ExpressErrorMW] message: ${err?.message}`);
      console.error(`[ExpressErrorMW] stack: ${err?.stack}`);
      if (err?.cause) {
        try {
          console.error(`[ExpressErrorMW] cause: ${JSON.stringify(err.cause)}`);
        } catch {
          console.error(`[ExpressErrorMW] cause: [unserializable] ${err.cause}`);
        }
      }
      if (res.headersSent) {
        console.error('[ExpressErrorMW] headers already sent');
        return next(err);
      }
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: '服务器内部错误',
          details: err?.message,
          timestamp: Date.now(),
        },
      });
    });

    return expressApp;
  } catch (err) {
    console.error('[VercelHandler] FATAL: Failed to create NestJS app');
    console.error(`[VercelHandler] Message: ${err?.message}`);
    console.error(`[VercelHandler] Stack: ${err?.stack}`);
    if (err?.cause) {
      try {
        console.error(`[VercelHandler] Cause: ${JSON.stringify(err.cause)}`);
      } catch {
        console.error(`[VercelHandler] Cause: [unserializable]`);
      }
    }
    cachedApp = null;
    initPromise = null;
    throw err;
  }
}

module.exports = async function handler(req, res) {
  console.log(`[VercelHandler] Request: ${req.method} ${req.url}`);

  if (req.method === 'GET' && req.url.startsWith('/api/health')) {
    return res.status(200).json({
      status: 'ok',
      timestamp: Date.now(),
      dbReady: cachedApp ? 'ready' : initPromise ? 'booting' : 'idle',
    });
  }

  if (!cachedApp) {
    if (!initPromise) {
      console.log('[VercelHandler] Cold start: initializing app...');
      initPromise = createApp()
        .then((app) => {
          cachedApp = app;
          console.log('[VercelHandler] App initialized successfully');
          return app;
        })
        .catch((err) => {
          console.error('[VercelHandler] App initialization failed');
          console.error(`[VercelHandler] Will retry on next request`);
          initPromise = null;
          throw err;
        });
    } else {
      console.log('[VercelHandler] Init already in progress, waiting...');
    }

    try {
      await initPromise;
    } catch (err) {
      return res.status(500).json({
        error: {
          code: 'INIT_FAILED',
          message: '服务启动失败，将在下次请求时重试',
          details: err?.message,
          timestamp: Date.now(),
        },
      });
    }
  }

  console.log(`[VercelHandler] Forwarding to Express: ${req.method} ${req.url}`);
  try {
    cachedApp(req, res, (err) => {
      if (err) {
        console.error(
          `[VercelHandler] Express third-arg error for ${req.method} ${req.url}`,
        );
        console.error(`[VercelHandler] Message: ${err?.message}`);
        console.error(`[VercelHandler] Stack: ${err?.stack}`);
        if (!res.headersSent) {
          res.status(500).json({
            error: {
              code: 'INTERNAL_ERROR',
              message: '服务器内部错误',
              details: err?.message,
              timestamp: Date.now(),
            },
          });
        }
      }
    });
  } catch (err) {
    console.error(`[VercelHandler] SYNC ERROR: ${err?.message}`);
    console.error(`[VercelHandler] Stack: ${err?.stack}`);
    if (!res.headersSent) {
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: '处理请求失败',
          details: err?.message,
          timestamp: Date.now(),
        },
      });
    }
  }
};
