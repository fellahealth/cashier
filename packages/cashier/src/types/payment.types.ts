import { CashierProvider } from './cashier.types';
import { CursorPaginateParams, CursorPaginator } from './pagination.types';
import { SubscriptionStatus } from './subscription.types';

export type PaymentStatus =
  'succeeded' | 'pending' | 'incomplete' | 'failed' | 'canceled' | 'unknown';

export type PaymentDisputeStatus =
  | 'warning_needs_response'
  | 'warning_under_review'
  | 'warning_closed'
  | 'needs_response'
  | 'under_review'
  | 'won'
  | 'lost'
  | 'unknown';

export interface PaymentDispute {
  id: string;
  status: PaymentDisputeStatus;
  reason: string;
  createdAt: Date;
  evidenceDueBy: Date | null;
}

export interface PaymentSubscription {
  id: string;
  status: SubscriptionStatus | null;
  cancelAt: Date | null;
}

export interface Payment {
  id: string;
  customerId: string | null;
  invoiceId: string | null;
  status: PaymentStatus;
  amount: number;
  amountRefunded: number;
  currency: string;
  description: string | null;
  dispute: PaymentDispute | null;
  receiptUrl: string | null;
  reversed: boolean;
  subscription: PaymentSubscription | null;
  createdAt: Date;
  provider: CashierProvider;
}

export interface ListPaymentsParams {
  customer: string;
  limit?: number;
}

export interface PaymentsResource {
  list(params: ListPaymentsParams): Promise<Payment[]>;
  cursorPaginate(
    params: CursorPaginateParams,
  ): Promise<CursorPaginator<Payment>>;
}
