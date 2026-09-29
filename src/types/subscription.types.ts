import { CashierProvider } from './cashier.types';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'unpaid'
  | 'paused'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'future'
  | 'failed'
  | 'unknown';

export interface SubscriptionItem {
  id: string | null;
  priceId: string;
  quantity: number;
  unitAmount: number | null;
}

export interface Subscription {
  id: string;
  customerId: string | null;
  status: SubscriptionStatus;
  items: SubscriptionItem[];
  currency: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  trialEnd: Date | null;
  createdAt: Date;
  metadata: Record<string, string>;
  provider: CashierProvider;
}

export interface CreateSubscriptionParams {
  customer: string;
  price: string;
  currency: string;
  quantity?: number;
  paymentMethod?: string;
  couponCode?: string;
  trialEnd?: Date;
  metadata?: Record<string, string>;
}

export interface UpdateSubscriptionParams {
  price?: string;
  quantity?: number;
  metadata?: Record<string, string>;
}

export interface CancelSubscriptionParams {
  atPeriodEnd?: boolean;
}

export interface SubscriptionsResource {
  create(params: CreateSubscriptionParams): Promise<Subscription>;
  get(subscriptionId: string): Promise<Subscription>;
  update(
    subscriptionId: string,
    params: UpdateSubscriptionParams,
  ): Promise<Subscription>;
  cancel(
    subscriptionId: string,
    params?: CancelSubscriptionParams,
  ): Promise<Subscription>;
}
