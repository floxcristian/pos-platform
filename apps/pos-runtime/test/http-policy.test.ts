import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { IsInt, IsString, Min, MinLength } from 'class-validator';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { configureHttpApplication } from '@pos-platform/backend';
import { loadConfig } from '../src/config/runtime-config.js';
import { expectApiError } from './assert-api-error.js';

class ProbeRequestDto {
  @IsString()
  @MinLength(1)
  sku!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

// These routes exist only in this testing module; the deployed API has no fixture endpoints.
@Controller({ path: '_contract', version: '1' })
class HttpContractController {
  @Post('items')
  @HttpCode(200)
  echo(@Body() request: ProbeRequestDto): ProbeRequestDto {
    return request;
  }

  @Get('failure')
  fail(): never {
    throw new Error('private-internal-error-canary');
  }
}

describe('shared HTTP policy', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ controllers: [HttpContractController] }).compile();
    app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter({ logger: false }), {
      logger: false,
    });
    await configureHttpApplication(
      app,
      loadConfig({
        NODE_ENV: 'test',
        POS_API_LOG_LEVEL: 'silent',
        POS_API_DOCS_ENABLED: 'false',
      }),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('should accept a valid DTO through the configured request pipeline', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/_contract/items',
      payload: { sku: 'FILTER-001', quantity: 2 },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ sku: 'FILTER-001', quantity: 2 });
  });

  it.each([
    { sku: 'FILTER-001', quantity: 0 },
    { sku: 'FILTER-001', quantity: '2' },
    { sku: '', quantity: 2 },
    { sku: 'FILTER-001', quantity: 2, unexpected: 'private-field-canary' },
  ])('should reject invalid DTO input without reflecting its values: %j', async (payload) => {
    const response = await app.inject({ method: 'POST', url: '/api/v1/_contract/items', payload });

    expectApiError(response, 400, {
      code: 'VALIDATION_ERROR',
      category: 'VALIDATION',
      message: 'Invalid request',
    });
  });

  it('should normalize malformed JSON without echoing parser details or request content', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/_contract/items?token=private-query-canary',
      headers: { 'content-type': 'application/json' },
      payload: '{"sku":"private-parser-canary",',
    });

    expectApiError(response, 400, {
      code: 'VALIDATION_ERROR',
      category: 'VALIDATION',
      message: 'Invalid request',
    });
  });

  it('should return a semantic 413 when the body exceeds the HTTP limit', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/_contract/items',
      payload: { sku: 'x'.repeat(1_048_577), quantity: 1 },
    });

    expectApiError(response, 413, {
      code: 'PAYLOAD_TOO_LARGE',
      category: 'VALIDATION',
      message: 'Request body too large',
    });
  });

  it('should hide internal errors behind the standard 500 contract', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/_contract/failure' });

    expectApiError(response, 500, {
      code: 'INTERNAL_ERROR',
      category: 'TECHNICAL',
      message: 'Internal server error',
    });
  });
});
