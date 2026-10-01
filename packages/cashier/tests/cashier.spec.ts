import Stripe from 'stripe';
import { cashier } from '../src/cashier';
import { AuthenticationError } from '../src/errors/authentication.error';
import { StripeDriver } from '../src/drivers/stripe/stripe.driver';
import { RecurlyDriver } from '../src/drivers/recurly/recurly.driver';
import { CASHIER_FIXTURES } from './fixtures/cashier.fixtures';

jest.mock('stripe');

describe('cashier', () => {
  describe('use', () => {
    it('should return a Stripe driver with every resource for a Stripe api key', () => {
      const driver = cashier.use('stripe', {
        apiKey: CASHIER_FIXTURES.API_KEY,
      });

      expect(driver).toBeInstanceOf(StripeDriver);
      expect(driver.provider).toBe('stripe');
      expect(Object.keys(driver)).toEqual(
        expect.arrayContaining([
          'customers',
          'invoices',
          'products',
          'prices',
          'subscriptions',
        ]),
      );
    });

    it('should return a Recurly driver for a Recurly api key', () => {
      const driver = cashier.use('recurly', {
        apiKey: CASHIER_FIXTURES.API_KEY,
      });

      expect(driver).toBeInstanceOf(RecurlyDriver);
      expect(driver.provider).toBe('recurly');
    });

    it('should create the Stripe client with the api version the mappers are built for', () => {
      cashier.use('stripe', { apiKey: CASHIER_FIXTURES.API_KEY });

      expect(Stripe).toHaveBeenCalledWith(CASHIER_FIXTURES.API_KEY, {
        apiVersion: CASHIER_FIXTURES.STRIPE_API_VERSION,
      });
    });

    it('should throw AuthenticationError for an empty api key', () => {
      expect(() => cashier.use('stripe', { apiKey: '' })).toThrow(
        AuthenticationError,
      );
    });
  });
});
