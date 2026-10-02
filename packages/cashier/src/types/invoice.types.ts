import { CashierProvider } from './cashier.types';
import { CursorPaginateParams, CursorPaginator } from './pagination.types';

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
  amountRefunded: number;
  attemptCount: number;
  hostedInvoiceUrl: string | null;
  createdAt: Date;
  dueDate: Date | null;
  paidAt: Date | null;
  provider: CashierProvider;
}

export interface ListInvoicesParams {
  customer: string;
  status?: 'paid';
  limit?: number;
}

export interface CursorPaginateInvoicesParams extends CursorPaginateParams {
  status?: 'paid';
}

export interface PayInvoiceParams {
  paymentMethod?: string;
}

export interface InvoicesResource {
  get(invoiceId: string): Promise<Invoice>;
  list(params: ListInvoicesParams): Promise<Invoice[]>;
  cursorPaginate(
    params: CursorPaginateInvoicesParams,
  ): Promise<CursorPaginator<Invoice>>;
  pay(invoiceId: string, params?: PayInvoiceParams): Promise<Invoice>;
  void(invoiceId: string): Promise<Invoice>;
}
