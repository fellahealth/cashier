import { CashierProvider } from './cashier.types';

export type InvoiceStatus =
  | 'draft'
  | 'open'
  | 'paid'
  | 'past_due'
  | 'failed'
  | 'void'
  | 'uncollectible'
  | 'closed'
  | 'unknown';

export interface Invoice {
  id: string;
  number: string | null;
  customerId: string | null;
  subscriptionIds: string[];
  billingReason: string | null;
  status: InvoiceStatus;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: Date;
  paidAt: Date | null;
  provider: CashierProvider;
}

export interface ListInvoicesParams {
  customer: string;
  status?: 'paid';
  limit?: number;
}

export interface PayInvoiceParams {
  paymentMethod?: string;
}

export interface InvoicesResource {
  get(invoiceId: string): Promise<Invoice>;
  list(params: ListInvoicesParams): Promise<Invoice[]>;
  pay(invoiceId: string, params?: PayInvoiceParams): Promise<Invoice>;
  void(invoiceId: string): Promise<Invoice>;
}
