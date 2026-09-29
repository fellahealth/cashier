import { CashierError } from './cashier.error';

export class NotFoundError extends CashierError {
  readonly code = 'not_found' as const;
}
