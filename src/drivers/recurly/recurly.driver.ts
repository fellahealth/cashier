import * as recurly from 'recurly';
import { CashierDriver } from '../../types/cashier.types';
import { RecurlyCustomersResource } from './resources/recurly-customers.resource';
import { RecurlyInvoicesResource } from './resources/recurly-invoices.resource';
import { RecurlyProductsResource } from './resources/recurly-products.resource';
import { RecurlyPricesResource } from './resources/recurly-prices.resource';
import { RecurlySubscriptionsResource } from './resources/recurly-subscriptions.resource';

export class RecurlyDriver implements CashierDriver {
  readonly provider = 'recurly' as const;
  readonly customers: RecurlyCustomersResource;
  readonly invoices: RecurlyInvoicesResource;
  readonly products: RecurlyProductsResource;
  readonly prices: RecurlyPricesResource;
  readonly subscriptions: RecurlySubscriptionsResource;

  constructor(client: recurly.Client) {
    this.customers = new RecurlyCustomersResource(client);
    this.invoices = new RecurlyInvoicesResource(client);
    this.products = new RecurlyProductsResource(client);
    this.prices = new RecurlyPricesResource();
    this.subscriptions = new RecurlySubscriptionsResource(client);
  }
}
