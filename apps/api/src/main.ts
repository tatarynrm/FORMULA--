import { API_PREFIX } from '@formula/shared';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app.module.js';
import type { Env } from './config/env.js';
import { setupSwagger } from './config/swagger.js';

/** `host:port/database` without credentials, so a wrong DATABASE_URL is obvious in the logs. */
function describeDatabase(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    return `${url.hostname}:${url.port || '5432'}${url.pathname}`;
  } catch {
    return 'invalid DATABASE_URL';
  }
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  // The api sits behind nginx in production, so the client IP comes from X-Forwarded-For.
  app.set('trust proxy', 1);

  // Swagger UI needs inline scripts, so the strict CSP applies to everything except the docs.
  const secureHeaders = helmet();
  const docsHeaders = helmet({ contentSecurityPolicy: false });
  app.use((req: { path: string }, res: unknown, next: () => void) => {
    const middleware = req.path.startsWith(`/${API_PREFIX}/docs`) ? docsHeaders : secureHeaders;
    (middleware as (req: unknown, res: unknown, next: () => void) => void)(req, res, next);
  });

  app.use(cookieParser());

  app.enableCors({
    origin: config.get('CORS_ORIGINS', { infer: true }),
    credentials: true,
  });

  app.setGlobalPrefix(API_PREFIX);
  app.enableShutdownHooks();

  setupSwagger(app);

  const port = config.get('PORT', { infer: true });
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`API is running on http://localhost:${port}/${API_PREFIX}`);
  logger.log(`Swagger docs: http://localhost:${port}/${API_PREFIX}/docs`);
  logger.log(`Database: ${describeDatabase(config.get('DATABASE_URL', { infer: true }))}`);
}

await bootstrap();
