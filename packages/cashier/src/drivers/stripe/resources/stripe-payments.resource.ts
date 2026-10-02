import Stripe from 'stripe';
import {
  ListPaymentsParams,
  Payment,
  PaymentsResource,
} from '../../../types/payment.types';
import {
  CursorPaginateParams,
  CursorPaginator,
} from '../../../types/pagination.types';
import {
  DEFAULT_LIST_LIMIT,
  STRIPE_PAYMENT_LIST_EXPAND,
} from '../../../constants/cashier.constants';
import { mapStripePayment } from '../mappers/stripe-payment.mapper';
import { toStripeCursorPaginator } from '../mappers/stripe-mapper.utils';
import { stripeRequest } from '../stripe-request';

export class StripePaymentsResource implements PaymentsResource {
  constructor(private readonly client: Stripe) {}

  async list({
    customer,
    limit = DEFAULT_LIST_LIMIT,
  }: ListPaymentsParams): Promise<Payment[]> {
    return (await this.fetch({ customer, limit }, limit)).data;
  }

  cursorPaginate({
    customer,
    perPage = DEFAULT_LIST_LIMIT,
    cursor,
  }: CursorPaginateParams): Promise<CursorPaginator<Payment>> {
    return this.fetch(
      {
        customer,
        limit: perPage,
        ...(cursor ? { starting_after: cursor } : {}),
      },
      perPage,
    );
  }

  private fetch(
    params: Stripe.PaymentIntentListParams,
    perPage: number,
  ): Promise<CursorPaginator<Payment>> {
    return stripeRequest(async () =>
      toStripeCursorPaginator(
        await this.client.paymentIntents.list({
          ...params,
          expand: STRIPE_PAYMENT_LIST_EXPAND,
        }),
        perPage,
        mapStripePayment,
      ),
    );
  }
}
