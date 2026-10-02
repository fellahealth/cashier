import Stripe from 'stripe';
import * as recurly from 'recurly';
import { CashierDriver, CashierProvider } from '../types/cashier.types';
import { ValidationError } from '../errors/validation.error';
import { STRIPE_API_VERSION } from '../constants/cashier.constants';
import { StripeDriver } from './stripe/stripe.driver';
import { RecurlyDriver } from './recurly/recurly.driver';

export const createDriver = (
  provider: CashierProvider,
  apiKey: string,
): CashierDriver => {
  switch (provider) {
    case CashierProvider.Stripe:
      return new StripeDriver(
        new Stripe(apiKey, { apiVersion: STRIPE_API_VERSION }),
      );
    case CashierProvider.Recurly:
      return new RecurlyDriver(new recurly.Client(apiKey));
    default:
      throw new ValidationError(`Unsupported cashier provider "${provider}"`);
  }
};
