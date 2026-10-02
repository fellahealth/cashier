import Stripe from 'stripe';
import {
  ListPaymentsParams,
  Payment,
  PaymentsResource,
} from '../../../types/payment.types';
import { DEFAULT_LIST_LIMIT } from '../../../constants/cashier.constants';
import { mapStripePayment } from '../mappers/stripe-payment.mapper';
import { stripeRequest } from '../stripe-request';

export class StripePaymentsResource implements PaymentsResource {
  constructor(private readonly client: Stripe) {}

  list({
    customer,
    limit = DEFAULT_LIST_LIMIT,
  }: ListPaymentsParams): Promise<Payment[]> {
    return stripeRequest(async () => {
      const response = await this.client.paymentIntents.list({
        customer,
        limit,
      });

      return response.data.map(mapStripePayment);
    });
  }
}
