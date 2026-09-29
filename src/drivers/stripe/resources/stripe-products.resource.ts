import Stripe from 'stripe';
import {
  ListProductsParams,
  Product,
  ProductsResource,
} from '../../../types/product.types';
import { DEFAULT_LIST_LIMIT } from '../../../constants/cashier.constants';
import { mapStripeProduct } from '../mappers/stripe-product.mapper';
import { stripeRequest } from '../stripe-request';

export class StripeProductsResource implements ProductsResource {
  constructor(private readonly client: Stripe) {}

  get(productId: string): Promise<Product> {
    return stripeRequest(async () =>
      mapStripeProduct(await this.client.products.retrieve(productId)),
    );
  }

  list({
    active,
    limit = DEFAULT_LIST_LIMIT,
  }: ListProductsParams = {}): Promise<Product[]> {
    return stripeRequest(async () => {
      const response = await this.client.products.list({
        limit,
        ...(active !== undefined ? { active } : {}),
      });

      return response.data.map(mapStripeProduct);
    });
  }
}
