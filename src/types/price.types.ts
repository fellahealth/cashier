import { CashierProvider } from './cashier.types';

export type BillingIntervalUnit = 'day' | 'week' | 'month' | 'year';

export interface BillingInterval {
  unit: BillingIntervalUnit;
  count: number;
}

export interface Price {
  id: string;
  productId: string;
  currency: string;
  unitAmount: number | null;
  type: 'one_time' | 'recurring';
  interval: BillingInterval | null;
  active: boolean;
  createdAt: Date;
  provider: CashierProvider;
}

export interface ListPricesParams {
  product?: string;
  active?: boolean;
  limit?: number;
}

export interface PricesResource {
  get(priceId: string): Promise<Price>;
  list(params?: ListPricesParams): Promise<Price[]>;
}
