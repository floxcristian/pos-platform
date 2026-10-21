import { Module } from '@nestjs/common';
import { SyncModule } from '@pos-platform/sync';
import { CatalogModule } from '@pos-platform/catalog';
import { PricingModule } from '@pos-platform/pricing';
import { ReportingModule } from '@pos-platform/reporting';
import { AdministrationModule } from '@pos-platform/administration';
import { InfoModule } from './info/info.module.js';

@Module({
  imports: [SyncModule, CatalogModule, PricingModule, ReportingModule, AdministrationModule, InfoModule],
})
export class AppModule {}
