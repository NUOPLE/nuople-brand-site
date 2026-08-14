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
let initError = null;

async function createApp() {
  try {
    console.log('[VercelHandler] Creating Express app...');
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);

    console.log('[VercelHandler] Bootstrapping NestFactory...');
    const { StandaloneAppModule } = require('./_nest/server/standalone.module.js');
    const app = await NestFactory.create(StandaloneAppModule, adapter, {
      logger: ['error', 'warn', 'log'],
    });

    app.enableCors({
      origin: true,
      credentials: true,
    });

    console.log('[VercelHandler] Calling app.init()...');
    await app.init();
    console.log('[VercelHandler] app.init() completed successfully');

    expressApp.use((err, req, res, next) => {
      console.error(
        `[VercelHandler] Express error: ${req.method} ${req.url}`,
      );
      console.error(`[VercelHandler] Message: ${err?.message}`);
      console.error(`[VercelHandler] Stack: ${err?.stack}`);
      if (err?.cause) {
        console.error(`[VercelHandler] Cause: ${JSON.stringify(err.cause)}`);
      }
      if (res.headersSent) return next(err);
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
      console.error(`[VercelHandler] Cause: ${JSON.stringify(err.cause)}`);
    }
    initError = err;
    throw err;
  }
}

module.exports = async function handler(req, res) {
  console.log(`[VercelHandler] Request: ${req.method} ${req.url}`);

  if (initError) {
    console.error(
      '[VercelHandler] App init failed earlier, returning 500 immediately',
    );
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务启动失败',
        details: initError.message,
        timestamp: Date.now(),
      },
    });
  }

  if (!cachedApp) {
    console.log('[VercelHandler] Cold start: initializing app...');
    try {
      cachedApp = await createApp();
      console.log('[VercelHandler] App initialized, handling request');
    } catch (err) {
      console.error('[VercelHandler] App initialization failed');
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: '服务启动失败',
          details: err?.message,
          timestamp: Date.now(),
        },
      });
    }
  }

  return cachedApp(req, res);
};
