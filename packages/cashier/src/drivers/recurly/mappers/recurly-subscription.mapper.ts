import * as recurly from 'recurly';
import { CashierProvider } from '../../../types/cashier.types';
import {
  Subscription,
  SubscriptionStatus,
} from '../../../types/subscription.types';
import { toMinorUnits } from '../../../utils/money.utils';

const RECURLY_SUBSCRIPTION_STATUSES: Record<string, SubscriptionStatus> = {
  active: 'active',
  live: 'active',
  canceled: 'active',
  in_trial: 'trialing',
  past_due: 'past_due',
  paused: 'paused',
  expired: 'canceled',
  future: 'future',
  failed: 'failed',
};

export const mapRecurlySubscriptionStatus = (
  state: string | null | undefined,
): SubscriptionStatus =>
  RECURLY_SUBSCRIPTION_STATUSES[state ?? ''] ?? 'unknown';

export const mapCustomFields = (
  customFields: recurly.CustomField[] | null | undefined,
): Record<string, string> =>
  Object.fromEntries(
    (customFields ?? [])
      .filter((field) => field.name)
      .map((field) => [field.name as string, field.value ?? '']),
  );

export const mapRecurlySubscription = (
  subscription: recurly.Subscription,
): Subscription => {
  const currency = (subscription.currency ?? '').toUpperCase();

  return {
    id: subscription.id ?? '',
    customerId: subscription.account?.id ?? null,
    status: mapRecurlySubscriptionStatus(subscription.state),
    items: [
      {
        id: null,
        priceId: subscription.plan?.id ?? '',
        quantity: subscription.quantity ?? 1,
        unitAmount:
          subscription.unitAmount === null ||
          subscription.unitAmount === undefined
            ? null
            : toMinorUnits(subscription.unitAmount, currency),
      },
    ],
    currency,
    currentPeriodStart: subscription.currentPeriodStartedAt ?? null,
    currentPeriodEnd: subscription.currentPeriodEndsAt ?? null,
    cancelAtPeriodEnd: subscription.state === 'canceled',
    canceledAt: subscription.canceledAt ?? null,
    trialEnd: subscription.trialEndsAt ?? null,
    createdAt: subscription.createdAt ?? new Date(0),
    metadata: mapCustomFields(subscription.customFields),
    provider: CashierProvider.Recurly,
  };
};

export const toRecurlyCustomFields = (
  metadata: Record<string, string>,
): recurly.CustomField[] =>
  Object.entries(metadata).map(([name, value]) => ({ name, value }));
