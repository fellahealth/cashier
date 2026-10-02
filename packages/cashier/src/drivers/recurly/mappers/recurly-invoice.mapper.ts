import * as recurly from 'recurly';
import { CashierProvider } from '../../../types/cashier.types';
import { Invoice, InvoiceStatus } from '../../../types/invoice.types';
import { toMinorUnits } from '../../../utils/money.utils';

const RECURLY_INVOICE_STATUSES: Record<string, InvoiceStatus> = {
  pending: 'open',
  processing: 'open',
  open: 'open',
  past_due: 'past_due',
  paid: 'paid',
  failed: 'failed',
  voided: 'void',
  closed: 'closed',
};

export const mapRecurlyInvoiceStatus = (
  state: string | null | undefined,
): InvoiceStatus => RECURLY_INVOICE_STATUSES[state ?? ''] ?? 'unknown';

const mapRecurlyInvoiceAmountRefunded = (
  invoice: recurly.Invoice,
  currency: string,
): number => {
  const refundable = invoice.refundableAmount;

  if (invoice.type !== 'charge' || typeof refundable !== 'number') return 0;

  return (
    toMinorUnits(invoice.paid ?? 0, currency) -
    toMinorUnits(refundable, currency)
  );
};

export const mapRecurlyInvoice = (invoice: recurly.Invoice): Invoice => {
  const currency = (invoice.currency ?? '').toUpperCase();

  return {
    id: invoice.id ?? '',
    number: invoice.number ?? null,
    customerId: invoice.account?.id ?? null,
    subscriptionIds: invoice.subscriptionIds ?? [],
    billingReason: invoice.origin ?? null,
    status: mapRecurlyInvoiceStatus(invoice.state),
    currency,
    subtotal: toMinorUnits(invoice.subtotal ?? 0, currency),
    tax: toMinorUnits(invoice.tax ?? 0, currency),
    total: toMinorUnits(invoice.total ?? 0, currency),
    amountRefunded: mapRecurlyInvoiceAmountRefunded(invoice, currency),
    attemptCount: 0,
    hostedInvoiceUrl: null,
    createdAt: invoice.createdAt ?? new Date(0),
    dueDate: invoice.dueAt ?? null,
    paidAt: invoice.state === 'paid' ? (invoice.closedAt ?? null) : null,
    provider: CashierProvider.Recurly,
  };
};
