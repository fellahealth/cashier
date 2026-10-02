import { CashierError } from './cashier.error';

export class AuthenticationError extends CashierError {
  readonly code = 'authentication' as const;
}
