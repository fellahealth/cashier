import { CashierProvider } from './cashier.types';

export type PaymentStatus =
  'succeeded' | 'pending' | 'incomplete' | 'failed' | 'canceled' | 'unknown';

export interface Payment {
  id: string;
  customerId: string | null;
  invoiceId: string | null;
  status: PaymentStatus;
  amount: number;
  currency: string;
  description: string | null;
  createdAt: Date;
  provider: CashierProvider;
}

export interface ListPaymentsParams {
  customer: string;
  limit?: number;
}

export interface PaymentsResource {
  list(params: ListPaymentsParams): Promise<Payment[]>;
}
