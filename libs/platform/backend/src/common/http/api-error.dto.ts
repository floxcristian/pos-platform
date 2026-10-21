import { ApiProperty } from '@nestjs/swagger';

export type ErrorCategory =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'AUTHORIZATION'
  | 'CONFLICT'
  | 'SECURITY'
  | 'EXTERNAL'
  | 'TIMEOUT'
  | 'TECHNICAL';

/** Core's semantic error contract; transport correlation stays in headers. */
export class ApiErrorDto {
  @ApiProperty({ description: 'Código estable para identificar el error.', example: 'VALIDATION_ERROR' })
  code!: string;

  @ApiProperty({ description: 'Descripción del error.', example: 'Invalid request' })
  message!: string;

  @ApiProperty({
    description: 'Categoría del error.',
    enum: [
      'VALIDATION',
      'NOT_FOUND',
      'AUTHORIZATION',
      'CONFLICT',
      'SECURITY',
      'EXTERNAL',
      'TIMEOUT',
      'TECHNICAL',
    ],
  })
  category!: ErrorCategory;

  @ApiProperty({
    description: 'Fecha y hora del error en UTC.',
    format: 'date-time',
    example: '2026-10-14T12:00:00.000Z',
  })
  timestamp!: string;
}
