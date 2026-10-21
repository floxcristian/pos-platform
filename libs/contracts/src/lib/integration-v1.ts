import type { OperationScope } from '@pos-platform/shared-kernel';

/** Draft v1 envelope. No transport or durable storage is implemented by this type. */
export interface IntegrationEventV1<TPayload = unknown> {
  readonly schemaVersion: 1;
  readonly eventId: string;
  readonly eventType: string;
  readonly occurredAt: string;
  readonly scope: OperationScope;
  readonly aggregate: { readonly type: string; readonly id: string; readonly version: number };
  readonly payload: TPayload;
}

/** Receipt follows inbox + receiving effect commit; it is not an ERP/fiscal/payment result. */
export interface DurableReceiptV1 {
  readonly schemaVersion: 1;
  readonly eventId: string;
  readonly consumerId: string;
  readonly receivedAt: string;
  readonly outcome: 'persisted' | 'already-persisted';
}
