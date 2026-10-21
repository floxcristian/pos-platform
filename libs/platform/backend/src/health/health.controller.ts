import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { ApiErrorDto } from '../common/http/api-error.dto.js';
import { API_TAGS } from '../config/api-tags.js';
import { LivenessResponseDto, ReadinessResponseDto } from './health.dto.js';
import { ReadinessService } from './readiness.service.js';
import { ApplicationNotReadyException } from './application-not-ready.exception.js';

@ApiTags(API_TAGS.health.name)
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly readiness: ReadinessService) {}

  @Get('live')
  @ApiOperation({
    operationId: 'healthGetLiveness',
    summary: 'Verificar actividad del servicio',
    description: 'Permite comprobar que el servicio puede responder solicitudes.',
  })
  @ApiOkResponse({ type: LivenessResponseDto, description: 'El servicio responde.' })
  live(): LivenessResponseDto {
    return new LivenessResponseDto();
  }

  @Get('ready')
  @ApiOperation({
    operationId: 'healthGetReadiness',
    summary: 'Verificar disponibilidad del servicio',
    description:
      'Indica si el servicio completó su inicio y puede atender solicitudes. ' +
      'Esta base comprueba únicamente su propio estado; no certifica la disponibilidad de integraciones.',
  })
  @ApiOkResponse({ type: ReadinessResponseDto, description: 'El servicio está disponible.' })
  @ApiServiceUnavailableResponse({
    type: ApiErrorDto,
    description: 'El servicio aún no está disponible o se está cerrando.',
  })
  ready(): ReadinessResponseDto {
    if (!this.readiness.isReady()) {
      throw new ApplicationNotReadyException();
    }
    return new ReadinessResponseDto();
  }
}
