import { Module } from '@nestjs/common';
import { SalesModule } from '@pos-platform/sales';
import { CashModule } from '@pos-platform/cash';
import { PaymentsModule } from '@pos-platform/payments';
import { CollectionsModule } from '@pos-platform/collections';
import { ReturnsModule } from '@pos-platform/returns';
import { PricingModule } from '@pos-platform/pricing';
import { CatalogModule } from '@pos-platform/catalog';
import { FiscalModule } from '@pos-platform/fiscal';
import { DevicesModule } from '@pos-platform/devices';
import { SyncModule } from '@pos-platform/sync';
import { ReportingModule } from '@pos-platform/reporting';
import { AdministrationModule } from '@pos-platform/administration';
import { InfoModule } from './info/info.module.js';

@Module({
  imports: [
    SalesModule,
    CashModule,
    PaymentsModule,
    CollectionsModule,
    ReturnsModule,
    PricingModule,
    CatalogModule,
    FiscalModule,
    DevicesModule,
    SyncModule,
    ReportingModule,
    AdministrationModule,
    InfoModule,
  ],
})
export class AppModule {}
