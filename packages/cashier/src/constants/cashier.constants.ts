import Stripe from 'stripe';

export const STRIPE_API_VERSION: Stripe.LatestApiVersion = '2023-08-16';

export const DEFAULT_LIST_LIMIT = 100;

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
