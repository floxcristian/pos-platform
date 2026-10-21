import { ApiProperty } from '@nestjs/swagger';

export class RuntimeInfoDto {
  @ApiProperty({ enum: ['branch-api'], description: 'Identificador del servicio.' })
  readonly service = 'branch-api' as const;
  @ApiProperty({ enum: ['1'], description: 'Versión de la API.' })
  readonly apiVersion = '1' as const;
  @ApiProperty({
    enum: ['foundation'],
    description: 'Base de API, sin operaciones de negocio ni integraciones conectadas.',
  })
  readonly mode = 'foundation' as const;
}
