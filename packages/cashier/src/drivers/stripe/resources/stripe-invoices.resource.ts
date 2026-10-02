import Stripe from 'stripe';
import {
  CursorPaginateInvoicesParams,
  Invoice,
  InvoicesResource,
  ListInvoicesParams,
  PayInvoiceParams,
} from '../../../types/invoice.types';
import { CursorPaginator } from '../../../types/pagination.types';
import {
  DEFAULT_LIST_LIMIT,
  STRIPE_INVOICE_EXPAND,
  STRIPE_INVOICE_LIST_EXPAND,
} from '../../../constants/cashier.constants';
import { mapStripeInvoice } from '../mappers/stripe-invoice.mapper';
import { toStripeCursorPaginator } from '../mappers/stripe-mapper.utils';
import { stripeRequest } from '../stripe-request';

export class StripeInvoicesResource implements InvoicesResource {
  constructor(private readonly client: Stripe) {}

  get(invoiceId: string): Promise<Invoice> {
    return stripeRequest(async () =>
      mapStripeInvoice(
        await this.client.invoices.retrieve(invoiceId, {
          expand: STRIPE_INVOICE_EXPAND,
        }),
      ),
    );
  }

  async list({
    customer,
    status,
    limit = DEFAULT_LIST_LIMIT,
  }: ListInvoicesParams): Promise<Invoice[]> {
    return (
      await this.fetch(
        { customer, limit, ...(status ? { status } : {}) },
        limit,
      )
    ).data;
  }

  cursorPaginate({
    customer,
    status,
    perPage = DEFAULT_LIST_LIMIT,
    cursor,
  }: CursorPaginateInvoicesParams): Promise<CursorPaginator<Invoice>> {
    return this.fetch(
      {
        customer,
        limit: perPage,
        ...(status ? { status } : {}),
        ...(cursor ? { starting_after: cursor } : {}),
      },
      perPage,
    );
  }

  pay(invoiceId: string, params: PayInvoiceParams = {}): Promise<Invoice> {
    return stripeRequest(async () =>
      mapStripeInvoice(
        await this.client.invoices.pay(invoiceId, {
          ...(params.paymentMethod
            ? { payment_method: params.paymentMethod }
            : {}),
          expand: STRIPE_INVOICE_EXPAND,
        }),
      ),
    );
  }

  void(invoiceId: string): Promise<Invoice> {
    return stripeRequest(async () =>
      mapStripeInvoice(
        await this.client.invoices.voidInvoice(invoiceId, {
          expand: STRIPE_INVOICE_EXPAND,
        }),
      ),
    );
  }

  private fetch(
    params: Stripe.InvoiceListParams,
    perPage: number,
  ): Promise<CursorPaginator<Invoice>> {
    return stripeRequest(async () =>
      toStripeCursorPaginator(
        await this.client.invoices.list({
          ...params,
          expand: STRIPE_INVOICE_LIST_EXPAND,
        }),
        perPage,
        mapStripeInvoice,
      ),
    );
  }
}
