import { CashierError, CashierErrorDetails } from './cashier.error';

export interface PaymentFailedErrorDetails extends CashierErrorDetails {
  declineCode?: string;
}

export class PaymentFailedError extends CashierError {
  readonly code = 'payment_failed' as const;
  readonly declineCode?: string;

  constructor(message: string, details: PaymentFailedErrorDetails = {}) {
    super(message, details);
    this.declineCode = details.declineCode;
  }
}
