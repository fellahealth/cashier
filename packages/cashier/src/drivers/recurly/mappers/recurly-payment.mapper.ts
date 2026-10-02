import * as recurly from 'recurly';
import { CashierProvider } from '../../../types/cashier.types';
import { Payment, PaymentStatus } from '../../../types/payment.types';
import { toMinorUnits } from '../../../utils/money.utils';

const RECURLY_PAYMENT_STATUSES: Record<string, PaymentStatus> = {
  success: 'succeeded',
  pending: 'pending',
  processing: 'pending',
  scheduled: 'pending',
  declined: 'failed',
  error: 'failed',
  void: 'canceled',
};

export const mapRecurlyPaymentStatus = (
  status: string | null | undefined,
): PaymentStatus => RECURLY_PAYMENT_STATUSES[status ?? ''] ?? 'unknown';

export const mapRecurlyPayment = (
  transaction: recurly.Transaction,
): Payment => {
  const currency = (transaction.currency ?? '').toUpperCase();

  return {
    id: transaction.id ?? '',
    customerId: transaction.account?.id ?? null,
    invoiceId: transaction.invoice?.id ?? null,
    status: mapRecurlyPaymentStatus(transaction.status),
    amount: toMinorUnits(transaction.amount ?? 0, currency),
    currency,
    description: transaction.description ?? null,
    createdAt: transaction.createdAt ?? new Date(0),
    provider: CashierProvider.Recurly,
  };
};
