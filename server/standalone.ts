import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import * as fs from 'fs';

import type { NestExpressApplication } from '@nestjs/platform-express';
import { StandaloneAppModule } from './standalone.module';
import { GlobalExceptionFilter } from './common/filters/exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(StandaloneAppModule, {
    abortOnError: process.env.NODE_ENV !== 'development',
  });

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  logger.log('NestJS app created, configuring...');
  logger.log(`NODE_ENV = ${process.env.NODE_ENV}`);
  logger.log(
    `DATABASE_URL ${process.env.DATABASE_URL ? 'is set' : 'NOT SET'}`,
  );
  logger.log(
    `JWT_SECRET ${process.env.JWT_SECRET ? 'is set' : 'NOT SET (using default)'}`,
  );

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidUnknownValues: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  const clientDistDir = join(process.cwd(), 'dist', 'client');
  if (fs.existsSync(clientDistDir)) {
    app.useStaticAssets(clientDistDir, { index: false });
  }

  const port = Number(configService.get<string>('PORT') || '3000');
  const host = configService.get<string>('HOST') || '0.0.0.0';
  await app.listen(port, host);
  logger.log(`Server running on ${host}:${port}`);
  logger.log(`API endpoints ready at http://${host}:${port}/api`);
}

bootstrap();
