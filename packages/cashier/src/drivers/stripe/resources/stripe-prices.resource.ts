import Stripe from 'stripe';
import {
  ListPricesParams,
  Price,
  PricesResource,
} from '../../../types/price.types';
import { DEFAULT_LIST_LIMIT } from '../../../constants/cashier.constants';
import { mapStripePrice } from '../mappers/stripe-price.mapper';
import { stripeRequest } from '../stripe-request';

export class StripePricesResource implements PricesResource {
  constructor(private readonly client: Stripe) {}

  get(priceId: string): Promise<Price> {
    return stripeRequest(async () =>
      mapStripePrice(await this.client.prices.retrieve(priceId)),
    );
  }

  list({
    product,
    active,
    limit = DEFAULT_LIST_LIMIT,
  }: ListPricesParams = {}): Promise<Price[]> {
    return stripeRequest(async () => {
      const response = await this.client.prices.list({
        limit,
        ...(product ? { product } : {}),
        ...(active !== undefined ? { active } : {}),
      });

      return response.data.map(mapStripePrice);
    });
  }
}
