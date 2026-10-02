import * as recurly from 'recurly';
import { CashierProvider } from '../../../types/cashier.types';
import {
  Payment,
  PaymentRelation,
  PaymentStatus,
  PaymentSubscription,
  PaymentWith,
} from '../../../types/payment.types';
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

const mapRecurlyPaymentSubscription = (
  subscriptionIds: string[] | null | undefined,
): PaymentSubscription | null => {
  const id = subscriptionIds?.[0];

  return id ? { id, status: null, cancelAt: null } : null;
};

export const mapRecurlyPayment = (
  transaction: recurly.Transaction,
  relations: ReadonlySet<PaymentRelation> = new Set(),
  amountRefunded = 0,
): Payment & Partial<PaymentWith<PaymentRelation>> => {
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
    ...(relations.has('refunds') ? { amountRefunded } : {}),
    ...(relations.has('subscription')
      ? {
          subscription: mapRecurlyPaymentSubscription(
            transaction.subscriptionIds,
          ),
        }
      : {}),
  };
};

const COUNTED_REFUND_STATUSES: ReadonlySet<PaymentStatus> = new Set([
  'succeeded',
  'pending',
]);

export const sumRecurlyRefunds = (
  refunds: recurly.Transaction[],
): Map<string, number> => {
  const refunded = new Map<string, number>();

  for (const refund of refunds) {
    const originalId = refund.originalTransactionId;

    if (
      !originalId ||
      !COUNTED_REFUND_STATUSES.has(mapRecurlyPaymentStatus(refund.status))
    ) {
      continue;
    }

    const amount = toMinorUnits(
      refund.amount ?? 0,
      (refund.currency ?? '').toUpperCase(),
    );

    refunded.set(originalId, (refunded.get(originalId) ?? 0) + amount);
  }

  return refunded;
};
