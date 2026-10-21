import type { CountryCode, CurrencyCode } from '@pos-platform/shared-kernel';

/** Configuration contract; fiscal/payment capabilities require independently approved adapters. */
export interface CountryProfile {
  readonly country: CountryCode;
  readonly currency: CurrencyCode;
  readonly policyVersion: string;
  readonly fiscalProviderId: string;
  readonly paymentProviderIds: readonly string[];
}
