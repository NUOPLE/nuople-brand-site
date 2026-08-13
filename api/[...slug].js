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

const { StandaloneAppModule } = require('./_nest/server/standalone.module.js');

let cachedApp = null;

async function createApp() {
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);
  const app = await NestFactory.create(StandaloneAppModule, adapter, {
    logger: ['error', 'warn'],
  });

  app.enableCors({
    origin: true,
    credentials: true,
  });

  await app.init();
  return expressApp;
}

module.exports = async function handler(req, res) {
  if (!cachedApp) {
    cachedApp = await createApp();
  }
  return cachedApp(req, res);
};
