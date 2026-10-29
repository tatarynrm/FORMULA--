import { API_PREFIX, AUTH_COOKIES } from '@formula/shared';
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Formula API')
    .setDescription('REST API of the Formula educational platform')
    .setVersion('1.0')
    .addBearerAuth(undefined, 'access')
    .addCookieAuth(AUTH_COOKIES.ACCESS, undefined, AUTH_COOKIES.ACCESS)
    .addCookieAuth(AUTH_COOKIES.REFRESH, undefined, AUTH_COOKIES.REFRESH)
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${API_PREFIX}/docs`, app, document);
}
