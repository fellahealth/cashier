import * as recurly from 'recurly';
import {
  CursorPaginateInvoicesParams,
  Invoice,
  InvoicesResource,
  ListInvoicesParams,
  PayInvoiceParams,
} from '../../../types/invoice.types';
import { CursorPaginator } from '../../../types/pagination.types';
import { DEFAULT_LIST_LIMIT } from '../../../constants/cashier.constants';
import { mapRecurlyInvoice } from '../mappers/recurly-invoice.mapper';
import { readRecurlyItems, readRecurlyPage } from '../recurly-page';
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
    return recurlyRequest(async () =>
      (
        await readRecurlyItems(this.invoices(customer, limit, status), limit)
      ).map(mapRecurlyInvoice),
    );
  }

  cursorPaginate({
    customer,
    status,
    perPage = DEFAULT_LIST_LIMIT,
    cursor,
  }: CursorPaginateInvoicesParams): Promise<CursorPaginator<Invoice>> {
    return recurlyRequest(async () => {
      const page = await readRecurlyPage(
        this.invoices(customer, perPage, status, cursor),
      );

      return {
        data: page.items.map(mapRecurlyInvoice),
        perPage,
        hasMorePages: page.hasMorePages,
        nextCursor: page.nextCursor,
      };
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

  private invoices(
    customer: string,
    limit: number,
    status?: 'paid',
    cursor?: string | null,
  ): recurly.Pager<recurly.Invoice> {
    return this.client.listAccountInvoices(customer, {
      params: {
        limit,
        ...(status ? { state: status } : {}),
        ...(cursor ? { cursor } : {}),
      },
    });
  }
}
