import { Module } from '@nestjs/common';
import { InfoController } from './info.controller.js';

@Module({ controllers: [InfoController] })
export class InfoModule {}
