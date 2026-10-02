import Stripe from 'stripe';
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
  STRIPE_INVOICE_RELATION_EXPAND,
} from '../../../constants/cashier.constants';
import { resolveRelations } from '../../../utils/relations.utils';
import { mapStripeInvoice } from '../mappers/stripe-invoice.mapper';
import {
  toStripeCursorPaginator,
  toStripeExpand,
} from '../mappers/stripe-mapper.utils';
import { stripeRequest } from '../stripe-request';

type StripeInvoiceRelation = ProviderInvoiceRelation<CashierProvider.Stripe>;

const STRIPE_INVOICE_RELATIONS: ReadonlySet<string> = new Set(
  Object.keys(STRIPE_INVOICE_RELATION_EXPAND),
);

const resolveInvoiceRelations = <Relation extends StripeInvoiceRelation>(
  requested?: readonly Relation[],
): ReadonlySet<Relation> =>
  resolveRelations(
    CashierProvider.Stripe,
    'invoices',
    STRIPE_INVOICE_RELATIONS,
    requested,
  );

export class StripeInvoicesResource implements InvoicesResource<CashierProvider.Stripe> {
  constructor(private readonly client: Stripe) {}

  get<Relation extends StripeInvoiceRelation = never>(
    invoiceId: string,
    params: GetInvoiceParams<Relation> = {},
  ): Promise<InvoiceWith<Relation>> {
    return stripeRequest(async () => {
      const relations = resolveInvoiceRelations(params.with);

      return mapStripeInvoice(
        await this.client.invoices.retrieve(
          invoiceId,
          toStripeExpand(relations, STRIPE_INVOICE_RELATION_EXPAND),
        ),
        relations,
      ) as InvoiceWith<Relation>;
    });
  }

  async list<Relation extends StripeInvoiceRelation = never>({
    customer,
    status,
    limit = DEFAULT_LIST_LIMIT,
    with: relations,
  }: ListInvoicesParams<Relation>): Promise<InvoiceWith<Relation>[]> {
    return (
      await this.fetch<Relation>(
        { customer, limit, ...(status ? { status } : {}) },
        limit,
        relations,
      )
    ).data;
  }

  cursorPaginate<Relation extends StripeInvoiceRelation = never>({
    customer,
    status,
    perPage = DEFAULT_LIST_LIMIT,
    cursor,
    with: relations,
  }: CursorPaginateInvoicesParams<Relation>): Promise<
    CursorPaginator<InvoiceWith<Relation>>
  > {
    return this.fetch<Relation>(
      {
        customer,
        limit: perPage,
        ...(status ? { status } : {}),
        ...(cursor ? { starting_after: cursor } : {}),
      },
      perPage,
      relations,
    );
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

  private fetch<Relation extends StripeInvoiceRelation>(
    params: Stripe.InvoiceListParams,
    perPage: number,
    requested?: readonly Relation[],
  ): Promise<CursorPaginator<InvoiceWith<Relation>>> {
    return stripeRequest(async () => {
      const relations = resolveInvoiceRelations(requested);

      return toStripeCursorPaginator(
        await this.client.invoices.list({
          ...params,
          ...toStripeExpand(relations, STRIPE_INVOICE_RELATION_EXPAND, 'data.'),
        }),
        perPage,
        (invoice) =>
          mapStripeInvoice(invoice, relations) as InvoiceWith<Relation>,
      );
    });
  }
}
