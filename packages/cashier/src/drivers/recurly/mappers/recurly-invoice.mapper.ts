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
    createdAt: invoice.createdAt ?? new Date(0),
    paidAt: invoice.state === 'paid' ? (invoice.closedAt ?? null) : null,
    provider: CashierProvider.Recurly,
  };
};
