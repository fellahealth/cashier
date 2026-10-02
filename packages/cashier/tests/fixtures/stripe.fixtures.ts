import Stripe from 'stripe';
import { Customer } from '../../src/types/customer.types';
import { Invoice } from '../../src/types/invoice.types';
import { Payment } from '../../src/types/payment.types';
import { Product } from '../../src/types/product.types';
import { Price } from '../../src/types/price.types';
import { Subscription } from '../../src/types/subscription.types';
import { CashierProvider } from '../../src/types/cashier.types';

const SUBSCRIPTION_INVOICE = {
  id: 'in_123',
  number: 'INV-001',
  customer: 'cus_123',
  subscription: 'sub_123',
  billing_reason: 'subscription_cycle',
  status: 'paid',
  currency: 'usd',
  subtotal: 15000,
  tax: null,
  total: 15000,
  created: 1767225600,
  status_transitions: { paid_at: 1767229200 },
} as unknown as Stripe.Invoice;

const EXPANDED_DRAFT_INVOICE = {
  id: 'in_456',
  number: null,
  customer: { id: 'cus_123' },
  subscription: null,
  billing_reason: 'manual',
  status: null,
  currency: 'gbp',
  subtotal: 5000,
  tax: 1000,
  total: 6000,
  created: 1767312000,
  status_transitions: { paid_at: null },
} as unknown as Stripe.Invoice;

const PRODUCT = {
  id: 'prod_123',
  name: 'Pro Plan',
  description: null,
  active: true,
  created: 1767225600,
} as unknown as Stripe.Product;

const RECURRING_PRICE = {
  id: 'price_123',
  product: 'prod_123',
  currency: 'usd',
  unit_amount: 29900,
  type: 'recurring',
  recurring: { interval: 'month', interval_count: 3 },
  active: true,
  created: 1767225600,
} as unknown as Stripe.Price;

const ONE_TIME_PRICE = {
  id: 'price_456',
  product: { id: 'prod_123' },
  currency: 'gbp',
  unit_amount: null,
  type: 'one_time',
  recurring: null,
  active: false,
  created: 1767312000,
} as unknown as Stripe.Price;

const SUBSCRIPTION = {
  id: 'sub_123',
  customer: 'cus_123',
  status: 'active',
  items: {
    data: [
      {
        id: 'si_123',
        price: { id: 'price_123', unit_amount: 29900 },
        quantity: 1,
      },
    ],
  },
  currency: 'usd',
  current_period_start: 1767225600,
  current_period_end: 1769904000,
  cancel_at_period_end: false,
  canceled_at: null,
  trial_end: null,
  created: 1767225600,
  metadata: { source: 'checkout' },
} as unknown as Stripe.Subscription;

const MULTI_ITEM_SUBSCRIPTION = {
  ...SUBSCRIPTION,
  items: {
    data: [
      { id: 'si_1', price: { id: 'price_1', unit_amount: 100 }, quantity: 1 },
      { id: 'si_2', price: { id: 'price_2', unit_amount: 200 }, quantity: 1 },
    ],
  },
} as unknown as Stripe.Subscription;

const CUSTOMER = {
  id: 'cus_123',
  email: 'jane@example.com',
  name: 'Jane Doe',
  metadata: { source: 'checkout' },
  created: 1767225600,
} as unknown as Stripe.Customer;

const DELETED_CUSTOMER = {
  id: 'cus_123',
  deleted: true,
} as unknown as Stripe.DeletedCustomer;

const SUCCEEDED_PAYMENT_INTENT = {
  id: 'pi_123',
  customer: 'cus_123',
  invoice: 'in_123',
  status: 'succeeded',
  amount: 12900,
  currency: 'gbp',
  description: 'Wegovy 0.5mg',
  last_payment_error: null,
  created: 1767225600,
} as unknown as Stripe.PaymentIntent;

const FAILED_PAYMENT_INTENT = {
  id: 'pi_456',
  customer: { id: 'cus_123' },
  invoice: null,
  status: 'requires_payment_method',
  amount: 11900,
  currency: 'gbp',
  description: null,
  last_payment_error: { code: 'card_declined' },
  created: 1767312000,
} as unknown as Stripe.PaymentIntent;

const INCOMPLETE_PAYMENT_INTENT = {
  id: 'pi_789',
  customer: 'cus_123',
  invoice: { id: 'in_456' },
  status: 'requires_action',
  amount: 8900,
  currency: 'gbp',
  description: 'Wegovy 0.25mg',
  last_payment_error: null,
  created: 1767398400,
} as unknown as Stripe.PaymentIntent;

export const STRIPE_FIXTURES = {
  CUSTOMER,
  DELETED_CUSTOMER,
  CUSTOMER_EMAIL: 'jane@example.com',
  EXPECTED_CUSTOMER: {
    id: 'cus_123',
    code: null,
    email: 'jane@example.com',
    name: 'Jane Doe',
    metadata: { source: 'checkout' },
    createdAt: new Date(1767225600 * 1000),
    provider: CashierProvider.Stripe,
  } satisfies Customer,
  CUSTOMER_ID: 'cus_123',
  INVOICE_ID: 'in_123',
  PRODUCT_ID: 'prod_123',
  PRICE_ID: 'price_123',
  NEW_PRICE_ID: 'price_789',
  SUBSCRIPTION_ID: 'sub_123',
  PAYMENT_METHOD_ID: 'pm_123',
  TRIAL_END: new Date('2026-02-01T00:00:00Z'),
  INVOICES: [SUBSCRIPTION_INVOICE, EXPANDED_DRAFT_INVOICE],
  SUBSCRIPTION_INVOICE,
  EXPECTED_INVOICES: [
    {
      id: 'in_123',
      number: 'INV-001',
      customerId: 'cus_123',
      subscriptionIds: ['sub_123'],
      billingReason: 'subscription_cycle',
      status: 'paid',
      currency: 'USD',
      subtotal: 15000,
      tax: 0,
      total: 15000,
      createdAt: new Date(1767225600 * 1000),
      paidAt: new Date(1767229200 * 1000),
      provider: CashierProvider.Stripe,
    },
    {
      id: 'in_456',
      number: null,
      customerId: 'cus_123',
      subscriptionIds: [],
      billingReason: 'manual',
      status: 'draft',
      currency: 'GBP',
      subtotal: 5000,
      tax: 1000,
      total: 6000,
      createdAt: new Date(1767312000 * 1000),
      paidAt: null,
      provider: CashierProvider.Stripe,
    },
  ] satisfies Invoice[],
  PAYMENT_INTENTS: [
    SUCCEEDED_PAYMENT_INTENT,
    FAILED_PAYMENT_INTENT,
    INCOMPLETE_PAYMENT_INTENT,
  ],
  EXPECTED_PAYMENTS: [
    {
      id: 'pi_123',
      customerId: 'cus_123',
      invoiceId: 'in_123',
      status: 'succeeded',
      amount: 12900,
      currency: 'GBP',
      description: 'Wegovy 0.5mg',
      createdAt: new Date(1767225600 * 1000),
      provider: CashierProvider.Stripe,
    },
    {
      id: 'pi_456',
      customerId: 'cus_123',
      invoiceId: null,
      status: 'failed',
      amount: 11900,
      currency: 'GBP',
      description: null,
      createdAt: new Date(1767312000 * 1000),
      provider: CashierProvider.Stripe,
    },
    {
      id: 'pi_789',
      customerId: 'cus_123',
      invoiceId: 'in_456',
      status: 'incomplete',
      amount: 8900,
      currency: 'GBP',
      description: 'Wegovy 0.25mg',
      createdAt: new Date(1767398400 * 1000),
      provider: CashierProvider.Stripe,
    },
  ] satisfies Payment[],
  PRODUCT,
  EXPECTED_PRODUCT: {
    id: 'prod_123',
    code: null,
    name: 'Pro Plan',
    description: null,
    active: true,
    createdAt: new Date(1767225600 * 1000),
    provider: CashierProvider.Stripe,
  } satisfies Product,
  RECURRING_PRICE,
  ONE_TIME_PRICE,
  EXPECTED_RECURRING_PRICE: {
    id: 'price_123',
    productId: 'prod_123',
    currency: 'USD',
    unitAmount: 29900,
    type: 'recurring',
    interval: { unit: 'month', count: 3 },
    active: true,
    createdAt: new Date(1767225600 * 1000),
    provider: CashierProvider.Stripe,
  } satisfies Price,
  EXPECTED_ONE_TIME_PRICE: {
    id: 'price_456',
    productId: 'prod_123',
    currency: 'GBP',
    unitAmount: null,
    type: 'one_time',
    interval: null,
    active: false,
    createdAt: new Date(1767312000 * 1000),
    provider: CashierProvider.Stripe,
  } satisfies Price,
  SUBSCRIPTION,
  MULTI_ITEM_SUBSCRIPTION,
  EXPECTED_SUBSCRIPTION: {
    id: 'sub_123',
    customerId: 'cus_123',
    status: 'active',
    items: [
      { id: 'si_123', priceId: 'price_123', quantity: 1, unitAmount: 29900 },
    ],
    currency: 'USD',
    currentPeriodStart: new Date(1767225600 * 1000),
    currentPeriodEnd: new Date(1769904000 * 1000),
    cancelAtPeriodEnd: false,
    canceledAt: null,
    trialEnd: null,
    createdAt: new Date(1767225600 * 1000),
    metadata: { source: 'checkout' },
    provider: CashierProvider.Stripe,
  } satisfies Subscription,
};
