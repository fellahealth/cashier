import Stripe from 'stripe';
import { CashierProvider } from '../../../types/cashier.types';
import {
  CursorPaginatePaymentsParams,
  ListPaymentsParams,
  PaymentWith,
  PaymentsResource,
  ProviderPaymentRelation,
} from '../../../types/payment.types';
import { CursorPaginator } from '../../../types/pagination.types';
import {
  DEFAULT_LIST_LIMIT,
  STRIPE_PAYMENT_RELATION_EXPAND,
} from '../../../constants/cashier.constants';
import { resolveRelations } from '../../../utils/relations.utils';
import { mapStripePayment } from '../mappers/stripe-payment.mapper';
import {
  toStripeCursorPaginator,
  toStripeExpand,
} from '../mappers/stripe-mapper.utils';
import { stripeRequest } from '../stripe-request';

type StripePaymentRelation = ProviderPaymentRelation<CashierProvider.Stripe>;

const STRIPE_PAYMENT_RELATIONS: ReadonlySet<string> = new Set(
  Object.keys(STRIPE_PAYMENT_RELATION_EXPAND),
);

export class StripePaymentsResource implements PaymentsResource<CashierProvider.Stripe> {
  constructor(private readonly client: Stripe) {}

  async list<Relation extends StripePaymentRelation = never>({
    customer,
    limit = DEFAULT_LIST_LIMIT,
    with: relations,
  }: ListPaymentsParams<Relation>): Promise<PaymentWith<Relation>[]> {
    return (await this.fetch<Relation>({ customer, limit }, limit, relations))
      .data;
  }

  cursorPaginate<Relation extends StripePaymentRelation = never>({
    customer,
    perPage = DEFAULT_LIST_LIMIT,
    cursor,
    with: relations,
  }: CursorPaginatePaymentsParams<Relation>): Promise<
    CursorPaginator<PaymentWith<Relation>>
  > {
    return this.fetch<Relation>(
      {
        customer,
        limit: perPage,
        ...(cursor ? { starting_after: cursor } : {}),
      },
      perPage,
      relations,
    );
  }

  private fetch<Relation extends StripePaymentRelation>(
    params: Stripe.PaymentIntentListParams,
    perPage: number,
    requested?: readonly Relation[],
  ): Promise<CursorPaginator<PaymentWith<Relation>>> {
    return stripeRequest(async () => {
      const relations = resolveRelations(
        CashierProvider.Stripe,
        'payments',
        STRIPE_PAYMENT_RELATIONS,
        requested,
      );

      return toStripeCursorPaginator(
        await this.client.paymentIntents.list({
          ...params,
          ...toStripeExpand(relations, STRIPE_PAYMENT_RELATION_EXPAND, 'data.'),
        }),
        perPage,
        (paymentIntent) =>
          mapStripePayment(paymentIntent, relations) as PaymentWith<Relation>,
      );
    });
  }
}
