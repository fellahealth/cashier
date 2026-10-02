import Stripe from 'stripe';
import { CashierProvider } from '../../../types/cashier.types';
import { Product } from '../../../types/product.types';

export const mapStripeProduct = (product: Stripe.Product): Product => ({
  id: product.id,
  code: null,
  name: product.name,
  description: product.description ?? null,
  active: product.active,
  createdAt: new Date(product.created * 1000),
  provider: CashierProvider.Stripe,
});
