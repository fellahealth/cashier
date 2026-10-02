import Stripe from 'stripe';
import { Cashier, cashier, createCashier } from '../src/cashier';
import { AuthenticationError } from '../src/errors/authentication.error';
import { ValidationError } from '../src/errors/validation.error';
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

  describe('configured providers', () => {
    const configured = () =>
      createCashier({
        default: 'stripe',
        providers: {
          stripe: { apiKey: CASHIER_FIXTURES.API_KEY },
          recurly: { apiKey: CASHIER_FIXTURES.OTHER_API_KEY },
        },
      });

    it('should return the default provider when use is called without arguments', () => {
      const instance = configured();

      expect(instance).toBeInstanceOf(Cashier);
      expect(instance.defaultProvider).toBe('stripe');
      expect(instance.use()).toBeInstanceOf(StripeDriver);
    });

    it('should return a configured provider by name', () => {
      expect(configured().use('recurly')).toBeInstanceOf(RecurlyDriver);
    });

    it('should use the only configured provider as the default', () => {
      const instance = createCashier({
        providers: { recurly: { apiKey: CASHIER_FIXTURES.API_KEY } },
      });

      expect(instance.defaultProvider).toBe('recurly');
      expect(instance.use()).toBeInstanceOf(RecurlyDriver);
    });

    it('should have no default when several providers are configured without one', () => {
      const instance = createCashier({
        providers: {
          stripe: { apiKey: CASHIER_FIXTURES.API_KEY },
          recurly: { apiKey: CASHIER_FIXTURES.OTHER_API_KEY },
        },
      });

      expect(instance.defaultProvider).toBeNull();
      expect(() => instance.use()).toThrow(ValidationError);
    });

    it('should throw ValidationError when use is called without arguments and nothing is configured', () => {
      expect(() => new Cashier().use()).toThrow(ValidationError);
    });

    it('should throw ValidationError for a provider that is not configured', () => {
      const instance = createCashier({
        providers: { stripe: { apiKey: CASHIER_FIXTURES.API_KEY } },
      });

      expect(() => instance.use('recurly')).toThrow(ValidationError);
    });

    it('should reject a default provider that is not configured', () => {
      expect(() =>
        createCashier({
          default: 'recurly',
          providers: { stripe: { apiKey: CASHIER_FIXTURES.API_KEY } },
        }),
      ).toThrow(ValidationError);
    });

    it('should reject a configured provider with an empty api key', () => {
      expect(() =>
        createCashier({ providers: { stripe: { apiKey: '' } } }),
      ).toThrow(AuthenticationError);
    });

    it('should prefer the given options over the configured ones', () => {
      const instance = configured();

      expect(
        instance.use('stripe', { apiKey: CASHIER_FIXTURES.OTHER_API_KEY }),
      ).not.toBe(instance.use('stripe'));
    });
  });

  describe('driver reuse', () => {
    it('should return the same driver for the same provider and api key', () => {
      const instance = new Cashier();

      expect(instance.use('stripe', { apiKey: CASHIER_FIXTURES.API_KEY })).toBe(
        instance.use('stripe', { apiKey: CASHIER_FIXTURES.API_KEY }),
      );
    });

    it('should return the same driver for repeated default lookups', () => {
      const instance = createCashier({
        providers: { stripe: { apiKey: CASHIER_FIXTURES.API_KEY } },
      });

      expect(instance.use()).toBe(instance.use('stripe'));
    });

    it('should return a different driver for a different api key', () => {
      const instance = new Cashier();

      expect(
        instance.use('stripe', { apiKey: CASHIER_FIXTURES.API_KEY }),
      ).not.toBe(
        instance.use('stripe', { apiKey: CASHIER_FIXTURES.OTHER_API_KEY }),
      );
    });

    it('should return a different driver for a different provider with the same api key', () => {
      const instance = new Cashier();

      expect(
        instance.use('stripe', { apiKey: CASHIER_FIXTURES.API_KEY }).provider,
      ).toBe('stripe');
      expect(
        instance.use('recurly', { apiKey: CASHIER_FIXTURES.API_KEY }).provider,
      ).toBe('recurly');
    });
  });
});
