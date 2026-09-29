import { CashierError } from './cashier.error';

export class UnsupportedOperationError extends CashierError {
  readonly code = 'unsupported_operation' as const;
}
