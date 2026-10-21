import { ApiProperty } from '@nestjs/swagger';

export class LivenessResponseDto {
  @ApiProperty({ enum: ['ok'], description: 'El servicio puede responder solicitudes.' })
  readonly status = 'ok' as const;
}

export class ReadinessResponseDto {
  @ApiProperty({
    enum: ['ready'],
    description: 'El servicio terminó de iniciar y está disponible para recibir solicitudes.',
  })
  readonly status = 'ready' as const;
}
