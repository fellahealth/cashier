import { CashierError } from './cashier.error';

export class ConflictError extends CashierError {
  readonly code = 'conflict' as const;
}
