import { CashierError } from './cashier.error';

export class RateLimitError extends CashierError {
  readonly code = 'rate_limit' as const;
}
