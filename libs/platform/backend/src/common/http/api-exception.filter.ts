import { Catch, HttpException, Logger } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ApiErrorDto } from './api-error.dto.js';
import { ApplicationNotReadyException } from '../../health/application-not-ready.exception.js';
import type { SentryErrorReporter } from '../observability/sentry-error-reporter.js';

type ErrorDefinition = Omit<ApiErrorDto, 'timestamp'>;

const HTTP_ERRORS: Record<number, ErrorDefinition> = {
  400: { code: 'VALIDATION_ERROR', message: 'Invalid request', category: 'VALIDATION' },
  401: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required', category: 'AUTHORIZATION' },
  403: { code: 'FORBIDDEN', message: 'Access denied', category: 'AUTHORIZATION' },
  404: { code: 'RESOURCE_NOT_FOUND', message: 'Resource not found', category: 'NOT_FOUND' },
  405: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed', category: 'VALIDATION' },
  409: { code: 'CONFLICT', message: 'Resource conflict', category: 'CONFLICT' },
  413: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body too large', category: 'VALIDATION' },
  415: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Unsupported media type', category: 'VALIDATION' },
  429: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests', category: 'SECURITY' },
  500: { code: 'INTERNAL_ERROR', message: 'Internal server error', category: 'TECHNICAL' },
  502: { code: 'BAD_GATEWAY', message: 'Upstream service unavailable', category: 'EXTERNAL' },
  503: { code: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable', category: 'TECHNICAL' },
  504: { code: 'GATEWAY_TIMEOUT', message: 'Upstream service timed out', category: 'TIMEOUT' },
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  constructor(private readonly reporter?: SentryErrorReporter) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const reply = host.switchToHttp().getResponse<FastifyReply>();
    const status = this.statusOf(exception);
    const error = HTTP_ERRORS[status] ?? {
      code: 'HTTP_ERROR',
      message: 'Request could not be completed',
      category: 'TECHNICAL',
    };
    if (status >= 500 && !(exception instanceof ApplicationNotReadyException)) {
      // Exception messages and stacks may contain provider responses or personal data.
      this.logger.error({ event: 'http.request.failed', code: error.code, statusCode: status });
      this.reporter?.captureException(exception, {
        phase: 'http',
        code: error.code,
        statusCode: status,
        requestId: host.switchToHttp().getRequest<FastifyRequest>().id,
      });
    }
    reply.status(status).send({ ...error, timestamp: new Date().toISOString() } satisfies ApiErrorDto);
  }

  private statusOf(exception: unknown): number {
    if (exception instanceof HttpException) return exception.getStatus();
    // Fastify parser errors are not Nest exceptions.
    if (
      exception instanceof Error &&
      'statusCode' in exception &&
      typeof exception.statusCode === 'number' &&
      Number.isInteger(exception.statusCode) &&
      exception.statusCode >= 400 &&
      exception.statusCode < 500
    )
      return exception.statusCode;
    return 500;
  }
}
