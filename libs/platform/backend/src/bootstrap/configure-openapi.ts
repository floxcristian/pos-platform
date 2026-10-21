import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { API_TAGS } from '../config/api-tags.js';

export interface OpenApiMetadata {
  readonly title: string;
  readonly description: string;
}

export function configureOpenApi(app: NestFastifyApplication, metadata: OpenApiMetadata): void {
  const builder = new DocumentBuilder()
    .setTitle(metadata.title)
    .setDescription(metadata.description)
    .setVersion('1.0.0');
  for (const tag of Object.values(API_TAGS)) builder.addTag(tag.name, tag.description);
  const document = SwaggerModule.createDocument(app, builder.build());
  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/openapi.json',
    raw: ['json'],
    swaggerOptions: { persistAuthorization: false, validatorUrl: null },
  });
}
