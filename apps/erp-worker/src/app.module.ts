import { Module } from '@nestjs/common';
import { ErpModule } from '@pos-platform/erp';
import { SyncModule } from '@pos-platform/sync';

@Module({ imports: [ErpModule, SyncModule] })
export class AppModule {}
