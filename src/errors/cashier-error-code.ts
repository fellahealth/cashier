export type CashierErrorCode =
  | 'not_found'
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'payment_failed'
  | 'payment_method'
  | 'subscription'
  | 'rate_limit'
  | 'conflict'
  | 'unsupported_operation'
  | 'provider';
