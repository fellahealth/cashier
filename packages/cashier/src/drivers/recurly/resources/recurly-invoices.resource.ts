import * as recurly from 'recurly';
import { CashierProvider } from '../../../types/cashier.types';
import {
  CursorPaginateInvoicesParams,
  GetInvoiceParams,
  Invoice,
  InvoiceWith,
  InvoicesResource,
  ListInvoicesParams,
  PayInvoiceParams,
  ProviderInvoiceRelation,
} from '../../../types/invoice.types';
import { CursorPaginator } from '../../../types/pagination.types';
import {
  DEFAULT_LIST_LIMIT,
  RECURLY_INVOICE_RELATIONS,
} from '../../../constants/cashier.constants';
import { resolveRelations } from '../../../utils/relations.utils';
import { mapRecurlyInvoice } from '../mappers/recurly-invoice.mapper';
import { readRecurlyItems, readRecurlyPage } from '../recurly-page';
import { recurlyRequest } from '../recurly-request';

type RecurlyInvoiceRelation = ProviderInvoiceRelation<CashierProvider.Recurly>;

const toInvoiceMapper = <Relation extends RecurlyInvoiceRelation>(
  requested?: readonly Relation[],
): ((invoice: recurly.Invoice) => InvoiceWith<Relation>) => {
  const relations = resolveRelations(
    CashierProvider.Recurly,
    'invoices',
    RECURLY_INVOICE_RELATIONS,
    requested,
  );

  return (invoice) =>
    mapRecurlyInvoice(invoice, relations) as InvoiceWith<Relation>;
};

export class RecurlyInvoicesResource implements InvoicesResource<CashierProvider.Recurly> {
  constructor(private readonly client: recurly.Client) {}

  get<Relation extends RecurlyInvoiceRelation = never>(
    invoiceId: string,
    params: GetInvoiceParams<Relation> = {},
  ): Promise<InvoiceWith<Relation>> {
    return recurlyRequest(async () => {
      const map = toInvoiceMapper(params.with);

      return map(await this.client.getInvoice(invoiceId));
    });
  }

  list<Relation extends RecurlyInvoiceRelation = never>({
    customer,
    status,
    limit = DEFAULT_LIST_LIMIT,
    with: relations,
  }: ListInvoicesParams<Relation>): Promise<InvoiceWith<Relation>[]> {
    return recurlyRequest(async () => {
      const map = toInvoiceMapper(relations);

      return (
        await readRecurlyItems(this.invoices(customer, limit, status), limit)
      ).map(map);
    });
  }

  cursorPaginate<Relation extends RecurlyInvoiceRelation = never>({
    customer,
    status,
    perPage = DEFAULT_LIST_LIMIT,
    cursor,
    with: relations,
  }: CursorPaginateInvoicesParams<Relation>): Promise<
    CursorPaginator<InvoiceWith<Relation>>
  > {
    return recurlyRequest(async () => {
      const map = toInvoiceMapper(relations);
      const page = await readRecurlyPage(
        this.invoices(customer, perPage, status, cursor),
      );

      return {
        data: page.items.map(map),
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
