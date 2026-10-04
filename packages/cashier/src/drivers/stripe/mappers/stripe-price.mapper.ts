import Stripe from 'stripe';
import { CashierProvider } from '../../../types/cashier.types';
import { Price } from '../../../types/price.types';
import { getExpandableId, toStripeInterval } from './stripe-mapper.utils';

export const mapStripePrice = (price: Stripe.Price): Price => ({
  id: price.id,
  productId: getExpandableId(price.product) ?? '',
  currency: price.currency.toUpperCase(),
  unitAmount: price.unit_amount,
  type: price.type,
  interval: toStripeInterval(price.recurring),
  active: price.active,
  createdAt: new Date(price.created * 1000),
  provider: CashierProvider.Stripe,
});
