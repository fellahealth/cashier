import * as recurly from 'recurly';
import { Customer } from '../../src/types/customer.types';
import { Invoice } from '../../src/types/invoice.types';
import { Payment } from '../../src/types/payment.types';
import { Product } from '../../src/types/product.types';
import { Subscription } from '../../src/types/subscription.types';
import { CashierProvider } from '../../src/types/cashier.types';

const SUCCESSFUL_TRANSACTION = {
  id: 'rec_txn_1',
  account: { id: 'acct_1' },
  invoice: { id: 'rec_inv_1' },
  type: 'purchase',
  status: 'success',
  currency: 'gbp',
  amount: 129,
  description: 'Wegovy 0.5mg',
  createdAt: new Date('2026-01-01T00:00:00Z'),
} as recurly.Transaction;

const DECLINED_TRANSACTION = {
  id: 'rec_txn_2',
  account: { id: 'acct_1' },
  invoice: null,
  type: 'purchase',
  status: 'declined',
  currency: 'jpy',
  amount: 5000,
  description: null,
  createdAt: new Date('2026-01-02T00:00:00Z'),
} as recurly.Transaction;

const PAID_INVOICE = {
  id: 'rec_inv_1',
  number: '1001',
  account: { id: 'acct_1' },
  subscriptionIds: ['rec_sub_1'],
  origin: 'renewal',
  state: 'paid',
  currency: 'usd',
  subtotal: 149.99,
  tax: 0,
  total: 149.99,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  closedAt: new Date('2026-01-01T01:00:00Z'),
} as recurly.Invoice;

const VOIDED_INVOICE = {
  id: 'rec_inv_2',
  number: '1002',
  account: { id: 'acct_1' },
  subscriptionIds: [],
  origin: 'purchase',
  state: 'voided',
  currency: 'usd',
  subtotal: 20,
  tax: 1.5,
  total: 21.5,
  createdAt: new Date('2026-01-02T00:00:00Z'),
  closedAt: new Date('2026-01-02T01:00:00Z'),
} as recurly.Invoice;

const ZERO_DECIMAL_INVOICE = {
  id: 'rec_inv_3',
  number: '1003',
  account: { id: 'acct_1' },
  subscriptionIds: ['rec_sub_1', 'rec_sub_2'],
  origin: 'purchase',
  state: 'partially_refunded',
  currency: 'jpy',
  subtotal: 5000,
  tax: 0,
  total: 5000,
  createdAt: new Date('2026-01-03T00:00:00Z'),
  closedAt: null,
} as recurly.Invoice;

const ACTIVE_PLAN = {
  id: 'plan_1',
  code: 'pro-monthly',
  name: 'Pro Monthly',
  description: 'Monthly plan',
  state: 'active',
  createdAt: new Date('2026-01-01T00:00:00Z'),
} as recurly.Plan;

const INACTIVE_PLAN = {
  id: 'plan_2',
  code: 'pro-legacy',
  name: 'Pro Legacy',
  description: null,
  state: 'inactive',
  createdAt: new Date('2025-01-01T00:00:00Z'),
} as recurly.Plan;

const ACTIVE_SUBSCRIPTION = {
  id: 'rec_sub_1',
  account: { id: 'acct_1' },
  plan: { id: 'plan_1' },
  state: 'active',
  quantity: 1,
  unitAmount: 149.99,
  currency: 'usd',
  currentPeriodStartedAt: new Date('2026-01-01T00:00:00Z'),
  currentPeriodEndsAt: new Date('2026-02-01T00:00:00Z'),
  canceledAt: null,
  trialEndsAt: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  customFields: [{ name: 'source', value: 'checkout' }],
} as recurly.Subscription;

const CANCELED_SUBSCRIPTION = {
  ...ACTIVE_SUBSCRIPTION,
  state: 'canceled',
  canceledAt: new Date('2026-01-15T00:00:00Z'),
} as recurly.Subscription;

const EXPIRED_SUBSCRIPTION = {
  ...ACTIVE_SUBSCRIPTION,
  state: 'expired',
  canceledAt: new Date('2026-01-15T00:00:00Z'),
} as recurly.Subscription;

const EXPECTED_ACTIVE_SUBSCRIPTION: Subscription = {
  id: 'rec_sub_1',
  customerId: 'acct_1',
  status: 'active',
  items: [{ id: null, priceId: 'plan_1', quantity: 1, unitAmount: 14999 }],
  currency: 'USD',
  currentPeriodStart: new Date('2026-01-01T00:00:00Z'),
  currentPeriodEnd: new Date('2026-02-01T00:00:00Z'),
  cancelAtPeriodEnd: false,
  canceledAt: null,
  trialEnd: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  metadata: { source: 'checkout' },
  provider: CashierProvider.Recurly,
};

const FULL_ACCOUNT = {
  id: 'acct_1',
  code: 'customer-42',
  email: 'jane@example.com',
  firstName: 'Jane',
  lastName: 'Doe',
  customFields: [{ name: 'source', value: 'checkout' }],
  createdAt: new Date('2026-01-01T00:00:00Z'),
} as recurly.Account;

const NAMELESS_ACCOUNT = {
  id: 'acct_2',
  code: 'customer-43',
  email: null,
  firstName: null,
  lastName: null,
  customFields: null,
  createdAt: new Date('2026-01-02T00:00:00Z'),
} as recurly.Account;

export const RECURLY_FIXTURES = {
  ACCOUNTS: [FULL_ACCOUNT, NAMELESS_ACCOUNT],
  FULL_ACCOUNT,
  ACCOUNT_CODE: 'customer-42',
  CUSTOMER_EMAIL: 'jane@example.com',
  EXPECTED_CUSTOMERS: [
    {
      id: 'acct_1',
      code: 'customer-42',
      email: 'jane@example.com',
      name: 'Jane Doe',
      metadata: { source: 'checkout' },
      createdAt: new Date('2026-01-01T00:00:00Z'),
      provider: CashierProvider.Recurly,
    },
    {
      id: 'acct_2',
      code: 'customer-43',
      email: null,
      name: null,
      metadata: {},
      createdAt: new Date('2026-01-02T00:00:00Z'),
      provider: CashierProvider.Recurly,
    },
  ] satisfies Customer[],
  ACCOUNT_ID: 'acct_1',
  ACCOUNT: { id: 'acct_1', code: 'customer-42' } as recurly.Account,
  INVOICE_ID: 'rec_inv_1',
  PLAN_ID: 'plan_1',
  PLAN_CODE_REFERENCE: 'code-pro-monthly',
  SUBSCRIPTION_ID: 'rec_sub_1',
  BILLING_INFO_ID: 'bi_1',
  TRIAL_END: new Date('2026-02-01T00:00:00Z'),
  INVOICES: [PAID_INVOICE, VOIDED_INVOICE],
  PAID_INVOICE,
  ZERO_DECIMAL_INVOICE,
  TRANSACTIONS: [SUCCESSFUL_TRANSACTION, DECLINED_TRANSACTION],
  EXPECTED_PAYMENTS: [
    {
      id: 'rec_txn_1',
      customerId: 'acct_1',
      invoiceId: 'rec_inv_1',
      status: 'succeeded',
      amount: 12900,
      currency: 'GBP',
      description: 'Wegovy 0.5mg',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      provider: CashierProvider.Recurly,
    },
    {
      id: 'rec_txn_2',
      customerId: 'acct_1',
      invoiceId: null,
      status: 'failed',
      amount: 5000,
      currency: 'JPY',
      description: null,
      createdAt: new Date('2026-01-02T00:00:00Z'),
      provider: CashierProvider.Recurly,
    },
  ] satisfies Payment[],
  EXPECTED_INVOICES: [
    {
      id: 'rec_inv_1',
      number: '1001',
      customerId: 'acct_1',
      subscriptionIds: ['rec_sub_1'],
      billingReason: 'renewal',
      status: 'paid',
      currency: 'USD',
      subtotal: 14999,
      tax: 0,
      total: 14999,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      paidAt: new Date('2026-01-01T01:00:00Z'),
      provider: CashierProvider.Recurly,
    },
    {
      id: 'rec_inv_2',
      number: '1002',
      customerId: 'acct_1',
      subscriptionIds: [],
      billingReason: 'purchase',
      status: 'void',
      currency: 'USD',
      subtotal: 2000,
      tax: 150,
      total: 2150,
      createdAt: new Date('2026-01-02T00:00:00Z'),
      paidAt: null,
      provider: CashierProvider.Recurly,
    },
  ] satisfies Invoice[],
  EXPECTED_ZERO_DECIMAL_INVOICE: {
    id: 'rec_inv_3',
    number: '1003',
    customerId: 'acct_1',
    subscriptionIds: ['rec_sub_1', 'rec_sub_2'],
    billingReason: 'purchase',
    status: 'unknown',
    currency: 'JPY',
    subtotal: 5000,
    tax: 0,
    total: 5000,
    createdAt: new Date('2026-01-03T00:00:00Z'),
    paidAt: null,
    provider: CashierProvider.Recurly,
  } satisfies Invoice,
  PLANS: [ACTIVE_PLAN, INACTIVE_PLAN],
  ACTIVE_PLAN,
  EXPECTED_PRODUCTS: [
    {
      id: 'plan_1',
      code: 'pro-monthly',
      name: 'Pro Monthly',
      description: 'Monthly plan',
      active: true,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      provider: CashierProvider.Recurly,
    },
    {
      id: 'plan_2',
      code: 'pro-legacy',
      name: 'Pro Legacy',
      description: null,
      active: false,
      createdAt: new Date('2025-01-01T00:00:00Z'),
      provider: CashierProvider.Recurly,
    },
  ] satisfies Product[],
  ACTIVE_SUBSCRIPTION,
  CANCELED_SUBSCRIPTION,
  EXPIRED_SUBSCRIPTION,
  EXPECTED_ACTIVE_SUBSCRIPTION,
  EXPECTED_CANCELED_SUBSCRIPTION: {
    ...EXPECTED_ACTIVE_SUBSCRIPTION,
    status: 'active',
    cancelAtPeriodEnd: true,
    canceledAt: new Date('2026-01-15T00:00:00Z'),
  } satisfies Subscription,
  EXPECTED_EXPIRED_SUBSCRIPTION: {
    ...EXPECTED_ACTIVE_SUBSCRIPTION,
    status: 'canceled',
    canceledAt: new Date('2026-01-15T00:00:00Z'),
  } satisfies Subscription,
};

export const createRecurlyPager = <Item>(items: Item[]) => ({
  each: function* () {
    yield* items;
  },
});

export const createFailingRecurlyPager = (error: unknown) => ({
  each: function* () {
    yield* [];
    throw error;
  },
});

export const withRecurlyStatus = <RecurlyError extends recurly.ApiError>(
  error: RecurlyError,
  status: number,
): RecurlyError => {
  (
    error as unknown as { _setResponse(response: { status: number }): void }
  )._setResponse({ status });

  return error;
};
