import Stripe from 'stripe';
import { CashierProvider } from '../../../types/cashier.types';
import {
  Payment,
  PaymentDispute,
  PaymentDisputeStatus,
  PaymentRelation,
  PaymentStatus,
  PaymentSubscription,
  PaymentWith,
} from '../../../types/payment.types';
import { SubscriptionStatus } from '../../../types/subscription.types';
import {
  fromUnixSeconds,
  getExpandableId,
  getExpanded,
} from './stripe-mapper.utils';
import { getStripeCancelAt } from './stripe-subscription.mapper';

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
    cancelAt: getStripeCancelAt(subscription),
  };
};

export const mapStripePayment = (
  paymentIntent: Stripe.PaymentIntent,
  relations: ReadonlySet<PaymentRelation> = new Set(),
): Payment & Partial<PaymentWith<PaymentRelation>> => {
  const charge = getExpanded(
    paymentIntent.latest_charge as string | StripeCharge | null | undefined,
  );

  return {
    id: paymentIntent.id,
    customerId: getExpandableId(paymentIntent.customer),
    invoiceId: getExpandableId(paymentIntent.invoice),
    status: mapStripePaymentStatus(paymentIntent),
    amount: paymentIntent.amount,
    currency: paymentIntent.currency.toUpperCase(),
    description: paymentIntent.description,
    createdAt: new Date(paymentIntent.created * 1000),
    provider: CashierProvider.Stripe,
    ...(relations.has('refunds')
      ? { amountRefunded: charge?.amount_refunded ?? 0 }
      : {}),
    ...(relations.has('dispute')
      ? { dispute: mapStripeDispute(charge?.dispute) }
      : {}),
    ...(relations.has('receipt')
      ? { receiptUrl: charge?.receipt_url ?? null }
      : {}),
    ...(relations.has('reversal') ? { reversed: isReversed(charge) } : {}),
    ...(relations.has('subscription')
      ? { subscription: mapStripePaymentSubscription(paymentIntent.invoice) }
      : {}),
  };
};
