import { RecurlySubscriptionsResource } from '../../src/drivers/recurly/resources/recurly-subscriptions.resource';
import { RECURLY_FIXTURES } from '../fixtures/recurly.fixtures';
import {
  RecurlyClientMock,
  asRecurlyClient,
  createRecurlyClientMock,
} from '../fixtures/recurly-client.mock';

describe('RecurlySubscriptionsResource', () => {
  let client: RecurlyClientMock;
  let subscriptions: RecurlySubscriptionsResource;

  beforeEach(() => {
    client = createRecurlyClientMock();
    subscriptions = new RecurlySubscriptionsResource(asRecurlyClient(client));
  });

  describe('create', () => {
    it('should resolve the account code and create the subscription by plan code', async () => {
      client.getAccount.mockResolvedValue(RECURLY_FIXTURES.ACCOUNT);
      client.createSubscription.mockResolvedValue(
        RECURLY_FIXTURES.ACTIVE_SUBSCRIPTION,
      );

      const subscription = await subscriptions.create({
        customer: RECURLY_FIXTURES.ACCOUNT_ID,
        price: RECURLY_FIXTURES.PLAN_CODE_REFERENCE,
        currency: 'USD',
        quantity: 2,
        paymentMethod: RECURLY_FIXTURES.BILLING_INFO_ID,
        couponCode: 'WELCOME',
        trialEnd: RECURLY_FIXTURES.TRIAL_END,
        metadata: { source: 'checkout' },
      });

      expect(client.getAccount).toHaveBeenCalledWith(
        RECURLY_FIXTURES.ACCOUNT_ID,
      );
      expect(client.createSubscription).toHaveBeenCalledWith({
        planCode: 'pro-monthly',
        account: { code: 'customer-42' },
        currency: 'USD',
        quantity: 2,
        billingInfoId: RECURLY_FIXTURES.BILLING_INFO_ID,
        couponCodes: ['WELCOME'],
        trialEndsAt: RECURLY_FIXTURES.TRIAL_END,
        customFields: [{ name: 'source', value: 'checkout' }],
      });
      expect(subscription).toEqual(
        RECURLY_FIXTURES.EXPECTED_ACTIVE_SUBSCRIPTION,
      );
    });

    it('should create the subscription by plan id when no code prefix is used', async () => {
      client.getAccount.mockResolvedValue(RECURLY_FIXTURES.ACCOUNT);
      client.createSubscription.mockResolvedValue(
        RECURLY_FIXTURES.ACTIVE_SUBSCRIPTION,
      );

      await subscriptions.create({
        customer: RECURLY_FIXTURES.ACCOUNT_ID,
        price: RECURLY_FIXTURES.PLAN_ID,
        currency: 'USD',
      });

      expect(client.createSubscription).toHaveBeenCalledWith({
        planId: RECURLY_FIXTURES.PLAN_ID,
        account: { code: 'customer-42' },
        currency: 'USD',
        quantity: 1,
      });
    });
  });

  describe('get', () => {
    it('should retrieve and map the subscription', async () => {
      client.getSubscription.mockResolvedValue(
        RECURLY_FIXTURES.ACTIVE_SUBSCRIPTION,
      );

      const subscription = await subscriptions.get(
        RECURLY_FIXTURES.SUBSCRIPTION_ID,
      );

      expect(subscription).toEqual(
        RECURLY_FIXTURES.EXPECTED_ACTIVE_SUBSCRIPTION,
      );
    });

    it('should report a canceled Recurly subscription as active until period end', async () => {
      client.getSubscription.mockResolvedValue(
        RECURLY_FIXTURES.CANCELED_SUBSCRIPTION,
      );

      const subscription = await subscriptions.get(
        RECURLY_FIXTURES.SUBSCRIPTION_ID,
      );

      expect(subscription).toEqual(
        RECURLY_FIXTURES.EXPECTED_CANCELED_SUBSCRIPTION,
      );
    });

    it('should report an expired Recurly subscription as canceled', async () => {
      client.getSubscription.mockResolvedValue(
        RECURLY_FIXTURES.EXPIRED_SUBSCRIPTION,
      );

      const subscription = await subscriptions.get(
        RECURLY_FIXTURES.SUBSCRIPTION_ID,
      );

      expect(subscription).toEqual(
        RECURLY_FIXTURES.EXPECTED_EXPIRED_SUBSCRIPTION,
      );
    });
  });

  describe('update', () => {
    it('should change the plan and quantity immediately and return the fresh subscription', async () => {
      client.createSubscriptionChange.mockResolvedValue({});
      client.getSubscription.mockResolvedValue(
        RECURLY_FIXTURES.ACTIVE_SUBSCRIPTION,
      );

      const subscription = await subscriptions.update(
        RECURLY_FIXTURES.SUBSCRIPTION_ID,
        { price: RECURLY_FIXTURES.PLAN_CODE_REFERENCE, quantity: 2 },
      );

      expect(client.createSubscriptionChange).toHaveBeenCalledWith(
        RECURLY_FIXTURES.SUBSCRIPTION_ID,
        { timeframe: 'now', planCode: 'pro-monthly', quantity: 2 },
      );
      expect(client.updateSubscription).not.toHaveBeenCalled();
      expect(subscription).toEqual(
        RECURLY_FIXTURES.EXPECTED_ACTIVE_SUBSCRIPTION,
      );
    });

    it('should update metadata as custom fields without a plan change', async () => {
      client.updateSubscription.mockResolvedValue({});
      client.getSubscription.mockResolvedValue(
        RECURLY_FIXTURES.ACTIVE_SUBSCRIPTION,
      );

      await subscriptions.update(RECURLY_FIXTURES.SUBSCRIPTION_ID, {
        metadata: { source: 'admin' },
      });

      expect(client.createSubscriptionChange).not.toHaveBeenCalled();
      expect(client.updateSubscription).toHaveBeenCalledWith(
        RECURLY_FIXTURES.SUBSCRIPTION_ID,
        { customFields: [{ name: 'source', value: 'admin' }] },
      );
    });
  });

  describe('cancel', () => {
    it('should terminate immediately without a refund by default', async () => {
      client.terminateSubscription.mockResolvedValue(
        RECURLY_FIXTURES.EXPIRED_SUBSCRIPTION,
      );

      await subscriptions.cancel(RECURLY_FIXTURES.SUBSCRIPTION_ID);

      expect(client.terminateSubscription).toHaveBeenCalledWith(
        RECURLY_FIXTURES.SUBSCRIPTION_ID,
        { params: { refund: 'none' } },
      );
      expect(client.cancelSubscription).not.toHaveBeenCalled();
    });

    it('should cancel at the end of the term', async () => {
      client.cancelSubscription.mockResolvedValue(
        RECURLY_FIXTURES.CANCELED_SUBSCRIPTION,
      );

      const subscription = await subscriptions.cancel(
        RECURLY_FIXTURES.SUBSCRIPTION_ID,
        { atPeriodEnd: true },
      );

      expect(client.cancelSubscription).toHaveBeenCalledWith(
        RECURLY_FIXTURES.SUBSCRIPTION_ID,
        { params: { timeframe: 'term_end' } },
      );
      expect(subscription.cancelAtPeriodEnd).toBe(true);
    });
  });
});
