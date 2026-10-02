import Stripe from 'stripe';
import { CashierProvider } from '../../../types/cashier.types';
import { Invoice, InvoiceStatus } from '../../../types/invoice.types';
import { fromUnixSeconds, getExpandableId } from './stripe-mapper.utils';

const toList = (value: string | null): string[] => (value ? [value] : []);

export const mapStripeInvoice = (invoice: Stripe.Invoice): Invoice => ({
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
  createdAt: new Date(invoice.created * 1000),
  paidAt: fromUnixSeconds(invoice.status_transitions?.paid_at),
  provider: CashierProvider.Stripe,
});
