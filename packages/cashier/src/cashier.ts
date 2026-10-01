import Stripe from 'stripe';
import * as recurly from 'recurly';
import {
  CashierDriver,
  CashierProvider,
  CashierProviderOptions,
} from './types/cashier.types';
import { AuthenticationError } from './errors/authentication.error';
import { ValidationError } from './errors/validation.error';
import { STRIPE_API_VERSION } from './constants/cashier.constants';
import { StripeDriver } from './drivers/stripe/stripe.driver';
import { RecurlyDriver } from './drivers/recurly/recurly.driver';

export class Cashier {
  use<Provider extends CashierProvider>(
    provider: Provider,
    options: CashierProviderOptions[Provider],
  ): CashierDriver {
    if (!options.apiKey) {
      throw new AuthenticationError(
        `An api key is required to use ${provider}`,
        {
          provider,
        },
      );
    }

    switch (provider) {
      case 'stripe':
        return new StripeDriver(
          new Stripe(options.apiKey, { apiVersion: STRIPE_API_VERSION }),
        );
      case 'recurly':
        return new RecurlyDriver(new recurly.Client(options.apiKey));
      default:
        throw new ValidationError(`Unsupported cashier provider "${provider}"`);
    }
  }
}

export const cashier = new Cashier();
