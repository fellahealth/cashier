import { CashierError } from './cashier.error';

export class PaymentMethodError extends CashierError {
  readonly code = 'payment_method' as const;
}
