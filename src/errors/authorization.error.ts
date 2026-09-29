import { CashierError } from './cashier.error';

export class AuthorizationError extends CashierError {
  readonly code = 'authorization' as const;
}
