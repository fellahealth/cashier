import Stripe from 'stripe';
import { CashierProvider } from '../../../types/cashier.types';
import { Payment, PaymentStatus } from '../../../types/payment.types';
import { getExpandableId } from './stripe-mapper.utils';

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

export const mapStripePayment = (
  paymentIntent: Stripe.PaymentIntent,
): Payment => ({
  id: paymentIntent.id,
  customerId: getExpandableId(paymentIntent.customer),
  invoiceId: getExpandableId(paymentIntent.invoice),
  status: mapStripePaymentStatus(paymentIntent),
  amount: paymentIntent.amount,
  currency: paymentIntent.currency.toUpperCase(),
  description: paymentIntent.description,
  createdAt: new Date(paymentIntent.created * 1000),
  provider: CashierProvider.Stripe,
});
