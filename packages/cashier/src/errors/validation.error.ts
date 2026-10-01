import { CashierError } from './cashier.error';

export class ValidationError extends CashierError {
  readonly code = 'validation' as const;
}
