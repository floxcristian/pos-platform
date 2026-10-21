import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { API_TAGS } from '@pos-platform/backend';
import { RuntimeInfoDto } from './info.dto.js';

@ApiTags(API_TAGS.runtime.name)
@Controller({ version: '1' })
export class InfoController {
  @Get()
  @ApiOperation({
    operationId: 'runtimeGetInfo',
    summary: 'Obtener información del servicio de sucursal',
    description: 'Identifica el servicio y la versión de API disponible para el cliente.',
  })
  @ApiOkResponse({ type: RuntimeInfoDto, description: 'Información de la API disponible.' })
  info(): RuntimeInfoDto {
    return new RuntimeInfoDto();
  }
}
