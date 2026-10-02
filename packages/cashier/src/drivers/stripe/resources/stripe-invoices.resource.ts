import Stripe from 'stripe';
import {
  Invoice,
  InvoicesResource,
  ListInvoicesParams,
  PayInvoiceParams,
} from '../../../types/invoice.types';
import { DEFAULT_LIST_LIMIT } from '../../../constants/cashier.constants';
import { mapStripeInvoice } from '../mappers/stripe-invoice.mapper';
import { stripeRequest } from '../stripe-request';

export class StripeInvoicesResource implements InvoicesResource {
  constructor(private readonly client: Stripe) {}

  get(invoiceId: string): Promise<Invoice> {
    return stripeRequest(async () =>
      mapStripeInvoice(await this.client.invoices.retrieve(invoiceId)),
    );
  }

  list({
    customer,
    status,
    limit = DEFAULT_LIST_LIMIT,
  }: ListInvoicesParams): Promise<Invoice[]> {
    return stripeRequest(async () => {
      const response = await this.client.invoices.list({
        customer,
        limit,
        ...(status ? { status } : {}),
      });

      return response.data.map(mapStripeInvoice);
    });
  }

  pay(invoiceId: string, params: PayInvoiceParams = {}): Promise<Invoice> {
    return stripeRequest(async () =>
      mapStripeInvoice(
        await this.client.invoices.pay(
          invoiceId,
          params.paymentMethod ? { payment_method: params.paymentMethod } : {},
        ),
      ),
    );
  }

  void(invoiceId: string): Promise<Invoice> {
    return stripeRequest(async () =>
      mapStripeInvoice(await this.client.invoices.voidInvoice(invoiceId)),
    );
  }
}
