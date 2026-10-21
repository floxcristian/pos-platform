/** Initial product scope. Country membership does not imply fiscal certification. */
export type CountryCode = 'CL' | 'PE' | 'ES';
export type CurrencyCode = 'CLP' | 'PEN' | 'EUR';

/** Wire representation only; validate integer/range/currency at system boundaries. */
export interface Money {
  readonly amountMinor: number;
  readonly currency: CurrencyCode;
}

/** Scope is supplied by trusted authentication, never authorized by client input alone. */
export interface OperationScope {
  readonly country: CountryCode;
  readonly legalEntityId: string;
  readonly branchId: string;
}
