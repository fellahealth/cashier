import { CustomersResource } from './customer.types';
import { InvoicesResource } from './invoice.types';
import { PaymentsResource } from './payment.types';
import { PricesResource } from './price.types';
import { ProductsResource } from './product.types';
import { SubscriptionsResource } from './subscription.types';

export enum CashierProvider {
  Stripe = 'stripe',
  Recurly = 'recurly',
}

export interface StripeOptions {
  apiKey: string;
}

export interface RecurlyOptions {
  apiKey: string;
}

export interface CashierProviderOptions {
  stripe: StripeOptions;
  recurly: RecurlyOptions;
}

export type CashierProvidersConfig = {
  [Provider in CashierProvider]?: CashierProviderOptions[Provider];
};

export interface CashierConfig {
  default?: CashierProvider;
  providers?: CashierProvidersConfig;
}

export interface CashierDriver {
  readonly provider: CashierProvider;
  readonly customers: CustomersResource;
  readonly invoices: InvoicesResource;
  readonly payments: PaymentsResource;
  readonly products: ProductsResource;
  readonly prices: PricesResource;
  readonly subscriptions: SubscriptionsResource;
}
