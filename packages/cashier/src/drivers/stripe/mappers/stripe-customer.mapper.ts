import Stripe from 'stripe';
import { Customer } from '../../../types/customer.types';

export const mapStripeCustomer = (customer: Stripe.Customer): Customer => ({
  id: customer.id,
  code: null,
  email: customer.email,
  name: customer.name ?? null,
  metadata: customer.metadata,
  createdAt: new Date(customer.created * 1000),
  provider: 'stripe',
});

export const toStripeCustomerName = (
  firstName: string | undefined,
  lastName: string | undefined,
): string | undefined =>
  [firstName, lastName].filter(Boolean).join(' ') || undefined;
