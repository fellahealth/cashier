import * as recurly from 'recurly';
import {
  Invoice,
  InvoicesResource,
  ListInvoicesParams,
  PayInvoiceParams,
} from '../../../types/invoice.types';
import { DEFAULT_LIST_LIMIT } from '../../../constants/cashier.constants';
import { mapRecurlyInvoice } from '../mappers/recurly-invoice.mapper';
import { recurlyRequest } from '../recurly-request';

export class RecurlyInvoicesResource implements InvoicesResource {
  constructor(private readonly client: recurly.Client) {}

  get(invoiceId: string): Promise<Invoice> {
    return recurlyRequest(async () =>
      mapRecurlyInvoice(await this.client.getInvoice(invoiceId)),
    );
  }

  list({
    customer,
    status,
    limit = DEFAULT_LIST_LIMIT,
  }: ListInvoicesParams): Promise<Invoice[]> {
    return recurlyRequest(async () => {
      const pager = this.client.listAccountInvoices(customer, {
        params: { limit, ...(status ? { state: status } : {}) },
      });

      const invoices: Invoice[] = [];

      for await (const invoice of pager.each()) {
        invoices.push(mapRecurlyInvoice(invoice));

        if (invoices.length >= limit) break;
      }

      return invoices;
    });
  }

  pay(invoiceId: string, params: PayInvoiceParams = {}): Promise<Invoice> {
    return recurlyRequest(async () =>
      mapRecurlyInvoice(
        await this.client.collectInvoice(
          invoiceId,
          params.paymentMethod
            ? { body: { billingInfoId: params.paymentMethod } }
            : undefined,
        ),
      ),
    );
  }

  void(invoiceId: string): Promise<Invoice> {
    return recurlyRequest(async () =>
      mapRecurlyInvoice(await this.client.voidInvoice(invoiceId)),
    );
  }
}
