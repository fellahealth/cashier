import Stripe from 'stripe';
import { CashierInvoiceRelations } from '../types/invoice.types';
import { CashierPaymentRelations } from '../types/payment.types';

export const STRIPE_API_VERSION: Stripe.LatestApiVersion = '2023-08-16';

export const DEFAULT_LIST_LIMIT = 100;

export const RECURLY_MAX_LIST_LIMIT = 200;

export const DRIVER_CACHE_SIZE = 100;

export const STRIPE_PAYMENT_RELATION_EXPAND: Record<
  CashierPaymentRelations['stripe'],
  string[]
> = {
  refunds: ['latest_charge'],
  dispute: ['latest_charge.dispute'],
  receipt: ['latest_charge'],
  reversal: ['latest_charge.refunds'],
  subscription: ['invoice.subscription'],
};

export const STRIPE_INVOICE_RELATION_EXPAND: Record<
  CashierInvoiceRelations['stripe'],
  string[]
> = {
  refunds: ['charge'],
};

export const RECURLY_PAYMENT_RELATIONS: ReadonlySet<
  CashierPaymentRelations['recurly']
> = new Set(['refunds', 'subscription']);

export const RECURLY_INVOICE_RELATIONS: ReadonlySet<
  CashierInvoiceRelations['recurly']
> = new Set(['refunds']);

export const STRIPE_PAYMENT_METHOD_ERROR_CODES: ReadonlySet<string> = new Set([
  'expired_card',
  'incorrect_cvc',
  'incorrect_number',
  'incorrect_zip',
  'invalid_cvc',
  'invalid_expiry_month',
  'invalid_expiry_year',
  'invalid_number',
  'payment_method_unactivated',
  'payment_method_unexpected_state',
]);

export const RECURLY_PAYMENT_METHOD_ERROR_CODES: ReadonlySet<string> = new Set([
  'expired_card',
  'invalid_card_number',
  'invalid_security_code',
  'invalid_expiration_date',
  'invalid_billing_info',
  'billing_info_not_found',
]);
