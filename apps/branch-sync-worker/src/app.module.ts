import { Module } from '@nestjs/common';
import { SyncModule } from '@pos-platform/sync';
import { CatalogModule } from '@pos-platform/catalog';
import { PricingModule } from '@pos-platform/pricing';

@Module({ imports: [SyncModule, CatalogModule, PricingModule] })
export class AppModule {}
