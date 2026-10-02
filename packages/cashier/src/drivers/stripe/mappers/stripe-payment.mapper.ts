import Stripe from 'stripe';
import { CashierProvider } from '../../../types/cashier.types';
import {
  Payment,
  PaymentDispute,
  PaymentDisputeStatus,
  PaymentStatus,
  PaymentSubscription,
} from '../../../types/payment.types';
import { SubscriptionStatus } from '../../../types/subscription.types';
import {
  fromUnixSeconds,
  getExpandableId,
  getExpanded,
} from './stripe-mapper.utils';

type StripeRefund = Stripe.Refund & {
  destination_details?: { card?: { type?: string | null } | null } | null;
};

type StripeCharge = Omit<Stripe.Charge, 'refunds'> & {
  dispute?: string | Stripe.Dispute | null;
  refunds?: Stripe.ApiList<StripeRefund> | null;
};

const STRIPE_PAYMENT_STATUSES: Record<
  Stripe.PaymentIntent.Status,
  PaymentStatus
> = {
  succeeded: 'succeeded',
  processing: 'pending',
  requires_capture: 'pending',
  requires_payment_method: 'incomplete',
  requires_confirmation: 'incomplete',
  requires_action: 'incomplete',
  canceled: 'canceled',
};

const STRIPE_DISPUTE_STATUSES: Record<string, PaymentDisputeStatus> = {
  warning_needs_response: 'warning_needs_response',
  warning_under_review: 'warning_under_review',
  warning_closed: 'warning_closed',
  needs_response: 'needs_response',
  under_review: 'under_review',
  won: 'won',
  lost: 'lost',
};

const mapStripePaymentStatus = (
  paymentIntent: Stripe.PaymentIntent,
): PaymentStatus => {
  if (
    paymentIntent.status === 'requires_payment_method' &&
    paymentIntent.last_payment_error
  ) {
    return 'failed';
  }

  return STRIPE_PAYMENT_STATUSES[paymentIntent.status] ?? 'unknown';
};

const mapStripeDispute = (
  dispute: string | Stripe.Dispute | null | undefined,
): PaymentDispute | null => {
  const expanded = getExpanded(dispute);

  if (!expanded) return null;

  return {
    id: expanded.id,
    status: STRIPE_DISPUTE_STATUSES[expanded.status] ?? 'unknown',
    reason: expanded.reason,
    createdAt: new Date(expanded.created * 1000),
    evidenceDueBy: fromUnixSeconds(expanded.evidence_details?.due_by),
  };
};

const isReversed = (charge: StripeCharge | null): boolean =>
  charge?.refunds?.data.some(
    (refund) => refund.destination_details?.card?.type === 'reversal',
  ) ?? false;

const mapStripePaymentSubscription = (
  invoice: string | Stripe.Invoice | null,
): PaymentSubscription | null => {
  const subscription = getExpanded(invoice)?.subscription;

  if (!subscription) return null;

  if (typeof subscription === 'string') {
    return { id: subscription, status: null, cancelAt: null };
  }

  return {
    id: subscription.id,
    status: subscription.status satisfies SubscriptionStatus,
    cancelAt:
      fromUnixSeconds(subscription.cancel_at) ??
      (subscription.cancel_at_period_end
        ? fromUnixSeconds(subscription.current_period_end)
        : null),
  };
};

export const mapStripePayment = (
  paymentIntent: Stripe.PaymentIntent,
): Payment => {
  const charge = getExpanded(
    paymentIntent.latest_charge as string | StripeCharge | null | undefined,
  );

  return {
    id: paymentIntent.id,
    customerId: getExpandableId(paymentIntent.customer),
    invoiceId: getExpandableId(paymentIntent.invoice),
    status: mapStripePaymentStatus(paymentIntent),
    amount: paymentIntent.amount,
    amountRefunded: charge?.amount_refunded ?? 0,
    currency: paymentIntent.currency.toUpperCase(),
    description: paymentIntent.description,
    dispute: mapStripeDispute(charge?.dispute),
    receiptUrl: charge?.receipt_url ?? null,
    reversed: isReversed(charge),
    subscription: mapStripePaymentSubscription(paymentIntent.invoice),
    createdAt: new Date(paymentIntent.created * 1000),
    provider: CashierProvider.Stripe,
  };
};
