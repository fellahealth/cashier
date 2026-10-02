import { CashierError } from './cashier.error';

export class ProviderError extends CashierError {
  readonly code = 'provider' as const;
}
