import Stripe from 'stripe';
import { CashierProvider } from '../../../types/cashier.types';
import {
  Subscription,
  SubscriptionItem,
  SubscriptionStatus,
} from '../../../types/subscription.types';
import { fromUnixSeconds, getExpandableId } from './stripe-mapper.utils';

const mapStripeSubscriptionItem = (
  item: Stripe.SubscriptionItem,
): SubscriptionItem => ({
  id: item.id,
  priceId: item.price.id,
  quantity: item.quantity ?? 1,
  unitAmount: item.price.unit_amount,
});

export const mapStripeSubscription = (
  subscription: Stripe.Subscription,
): Subscription => ({
  id: subscription.id,
  customerId: getExpandableId(subscription.customer),
  status: subscription.status satisfies SubscriptionStatus,
  items: subscription.items.data.map(mapStripeSubscriptionItem),
  currency: subscription.currency.toUpperCase(),
  currentPeriodStart: fromUnixSeconds(subscription.current_period_start),
  currentPeriodEnd: fromUnixSeconds(subscription.current_period_end),
  cancelAtPeriodEnd: subscription.cancel_at_period_end,
  canceledAt: fromUnixSeconds(subscription.canceled_at),
  trialEnd: fromUnixSeconds(subscription.trial_end),
  createdAt: new Date(subscription.created * 1000),
  metadata: subscription.metadata,
  provider: CashierProvider.Stripe,
});
