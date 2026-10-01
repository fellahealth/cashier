import { StripeSubscriptionsResource } from '../../src/drivers/stripe/resources/stripe-subscriptions.resource';
import { ValidationError } from '../../src/errors/validation.error';
import { STRIPE_FIXTURES } from '../fixtures/stripe.fixtures';
import {
  StripeClientMock,
  asStripeClient,
  createStripeClientMock,
} from '../fixtures/stripe-client.mock';

describe('StripeSubscriptionsResource', () => {
  let client: StripeClientMock;
  let subscriptions: StripeSubscriptionsResource;

  beforeEach(() => {
    client = createStripeClientMock();
    subscriptions = new StripeSubscriptionsResource(asStripeClient(client));
  });

  describe('create', () => {
    it('should create a subscription with every optional field', async () => {
      client.subscriptions.create.mockResolvedValue(
        STRIPE_FIXTURES.SUBSCRIPTION,
      );

      const subscription = await subscriptions.create({
        customer: STRIPE_FIXTURES.CUSTOMER_ID,
        price: STRIPE_FIXTURES.PRICE_ID,
        currency: 'USD',
        quantity: 2,
        paymentMethod: STRIPE_FIXTURES.PAYMENT_METHOD_ID,
        couponCode: 'WELCOME',
        trialEnd: STRIPE_FIXTURES.TRIAL_END,
        metadata: { source: 'checkout' },
      });

      expect(client.subscriptions.create).toHaveBeenCalledWith({
        customer: STRIPE_FIXTURES.CUSTOMER_ID,
        items: [{ price: STRIPE_FIXTURES.PRICE_ID, quantity: 2 }],
        currency: 'usd',
        default_payment_method: STRIPE_FIXTURES.PAYMENT_METHOD_ID,
        coupon: 'WELCOME',
        trial_end: STRIPE_FIXTURES.TRIAL_END.getTime() / 1000,
        metadata: { source: 'checkout' },
      });
      expect(subscription).toEqual(STRIPE_FIXTURES.EXPECTED_SUBSCRIPTION);
    });

    it('should default the quantity to one', async () => {
      client.subscriptions.create.mockResolvedValue(
        STRIPE_FIXTURES.SUBSCRIPTION,
      );

      await subscriptions.create({
        customer: STRIPE_FIXTURES.CUSTOMER_ID,
        price: STRIPE_FIXTURES.PRICE_ID,
        currency: 'USD',
      });

      expect(client.subscriptions.create).toHaveBeenCalledWith({
        customer: STRIPE_FIXTURES.CUSTOMER_ID,
        items: [{ price: STRIPE_FIXTURES.PRICE_ID, quantity: 1 }],
        currency: 'usd',
      });
    });
  });

  describe('get', () => {
    it('should retrieve and map the subscription', async () => {
      client.subscriptions.retrieve.mockResolvedValue(
        STRIPE_FIXTURES.SUBSCRIPTION,
      );

      const subscription = await subscriptions.get(
        STRIPE_FIXTURES.SUBSCRIPTION_ID,
      );

      expect(subscription).toEqual(STRIPE_FIXTURES.EXPECTED_SUBSCRIPTION);
    });
  });

  describe('update', () => {
    it('should replace the single item price instead of adding a new item', async () => {
      client.subscriptions.retrieve.mockResolvedValue(
        STRIPE_FIXTURES.SUBSCRIPTION,
      );
      client.subscriptions.update.mockResolvedValue(
        STRIPE_FIXTURES.SUBSCRIPTION,
      );

      await subscriptions.update(STRIPE_FIXTURES.SUBSCRIPTION_ID, {
        price: STRIPE_FIXTURES.NEW_PRICE_ID,
        quantity: 3,
      });

      expect(client.subscriptions.update).toHaveBeenCalledWith(
        STRIPE_FIXTURES.SUBSCRIPTION_ID,
        {
          items: [
            { id: 'si_123', price: STRIPE_FIXTURES.NEW_PRICE_ID, quantity: 3 },
          ],
        },
      );
    });

    it('should update metadata without reading the subscription items', async () => {
      client.subscriptions.update.mockResolvedValue(
        STRIPE_FIXTURES.SUBSCRIPTION,
      );

      await subscriptions.update(STRIPE_FIXTURES.SUBSCRIPTION_ID, {
        metadata: { source: 'admin' },
      });

      expect(client.subscriptions.retrieve).not.toHaveBeenCalled();
      expect(client.subscriptions.update).toHaveBeenCalledWith(
        STRIPE_FIXTURES.SUBSCRIPTION_ID,
        { metadata: { source: 'admin' } },
      );
    });

    it('should throw ValidationError when changing the price of a multi-item subscription', async () => {
      client.subscriptions.retrieve.mockResolvedValue(
        STRIPE_FIXTURES.MULTI_ITEM_SUBSCRIPTION,
      );

      await expect(
        subscriptions.update(STRIPE_FIXTURES.SUBSCRIPTION_ID, {
          price: STRIPE_FIXTURES.NEW_PRICE_ID,
        }),
      ).rejects.toBeInstanceOf(ValidationError);
      expect(client.subscriptions.update).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should cancel immediately by default', async () => {
      client.subscriptions.cancel.mockResolvedValue(
        STRIPE_FIXTURES.SUBSCRIPTION,
      );

      await subscriptions.cancel(STRIPE_FIXTURES.SUBSCRIPTION_ID);

      expect(client.subscriptions.cancel).toHaveBeenCalledWith(
        STRIPE_FIXTURES.SUBSCRIPTION_ID,
      );
      expect(client.subscriptions.update).not.toHaveBeenCalled();
    });

    it('should schedule the cancellation at period end', async () => {
      client.subscriptions.update.mockResolvedValue(
        STRIPE_FIXTURES.SUBSCRIPTION,
      );

      await subscriptions.cancel(STRIPE_FIXTURES.SUBSCRIPTION_ID, {
        atPeriodEnd: true,
      });

      expect(client.subscriptions.update).toHaveBeenCalledWith(
        STRIPE_FIXTURES.SUBSCRIPTION_ID,
        { cancel_at_period_end: true },
      );
      expect(client.subscriptions.cancel).not.toHaveBeenCalled();
    });
  });
});
