import Stripe from 'stripe';
import { CashierProvider } from '../../../types/cashier.types';
import {
  Invoice,
  InvoiceRelation,
  InvoiceStatus,
  InvoiceWith,
} from '../../../types/invoice.types';
import {
  fromUnixSeconds,
  getExpandableId,
  getExpanded,
} from './stripe-mapper.utils';

const toList = (value: string | null): string[] => (value ? [value] : []);

export const mapStripeInvoice = (
  invoice: Stripe.Invoice,
  relations: ReadonlySet<InvoiceRelation> = new Set(),
): Invoice & Partial<InvoiceWith<InvoiceRelation>> => ({
  id: invoice.id,
  number: invoice.number,
  customerId: getExpandableId(invoice.customer),
  subscriptionIds: toList(getExpandableId(invoice.subscription)),
  billingReason: invoice.billing_reason,
  status: (invoice.status ?? 'draft') satisfies InvoiceStatus,
  currency: invoice.currency.toUpperCase(),
  subtotal: invoice.subtotal,
  tax: invoice.tax ?? 0,
  total: invoice.total,
  attemptCount: invoice.attempt_count ?? 0,
  hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
  createdAt: new Date(invoice.created * 1000),
  dueDate: fromUnixSeconds(invoice.due_date),
  paidAt: fromUnixSeconds(invoice.status_transitions?.paid_at),
  provider: CashierProvider.Stripe,
  ...(relations.has('refunds')
    ? { amountRefunded: getExpanded(invoice.charge)?.amount_refunded ?? 0 }
    : {}),
});
