import { CashierError } from './cashier.error';

export class SubscriptionError extends CashierError {
  readonly code = 'subscription' as const;
}
