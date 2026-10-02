import Stripe from 'stripe';
import { CashierProvider } from '../../../types/cashier.types';
import { Price } from '../../../types/price.types';
import { getExpandableId } from './stripe-mapper.utils';

export const mapStripePrice = (price: Stripe.Price): Price => ({
  id: price.id,
  productId: getExpandableId(price.product) ?? '',
  currency: price.currency.toUpperCase(),
  unitAmount: price.unit_amount,
  type: price.type,
  interval: price.recurring
    ? { unit: price.recurring.interval, count: price.recurring.interval_count }
    : null,
  active: price.active,
  createdAt: new Date(price.created * 1000),
  provider: CashierProvider.Stripe,
});
