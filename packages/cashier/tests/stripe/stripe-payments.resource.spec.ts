import { StripePaymentsResource } from '../../src/drivers/stripe/resources/stripe-payments.resource';
import { NotFoundError } from '../../src/errors/not-found.error';
import { STRIPE_FIXTURES } from '../fixtures/stripe.fixtures';
import {
  StripeClientMock,
  asStripeClient,
  createStripeClientMock,
  createStripeMissingResourceError,
} from '../fixtures/stripe-client.mock';
import { CashierProvider } from '../../src/types/cashier.types';

describe('StripePaymentsResource', () => {
  let client: StripeClientMock;
  let payments: StripePaymentsResource;

  beforeEach(() => {
    client = createStripeClientMock();
    payments = new StripePaymentsResource(asStripeClient(client));
  });

  describe('list', () => {
    it('should request payment intents with the default limit', async () => {
      client.paymentIntents.list.mockResolvedValue({ data: [] });

      await payments.list({ customer: STRIPE_FIXTURES.CUSTOMER_ID });

      expect(client.paymentIntents.list).toHaveBeenCalledWith({
        customer: STRIPE_FIXTURES.CUSTOMER_ID,
        limit: 100,
      });
    });

    it('should pass the given limit', async () => {
      client.paymentIntents.list.mockResolvedValue({ data: [] });

      await payments.list({ customer: STRIPE_FIXTURES.CUSTOMER_ID, limit: 10 });

      expect(client.paymentIntents.list).toHaveBeenCalledWith({
        customer: STRIPE_FIXTURES.CUSTOMER_ID,
        limit: 10,
      });
    });

    it('should map every payment intent, treating a declined attempt as failed', async () => {
      client.paymentIntents.list.mockResolvedValue({
        data: STRIPE_FIXTURES.PAYMENT_INTENTS,
      });

      const result = await payments.list({
        customer: STRIPE_FIXTURES.CUSTOMER_ID,
      });

      expect(result).toEqual(STRIPE_FIXTURES.EXPECTED_PAYMENTS);
    });

    it.each([
      ['processing', 'pending'],
      ['requires_capture', 'pending'],
      ['requires_confirmation', 'incomplete'],
      ['requires_payment_method', 'incomplete'],
      ['canceled', 'canceled'],
      ['some_new_status', 'unknown'],
    ])('should map the %s status to %s', async (stripeStatus, status) => {
      client.paymentIntents.list.mockResolvedValue({
        data: [{ ...STRIPE_FIXTURES.PAYMENT_INTENTS[0], status: stripeStatus }],
      });

      const [payment] = await payments.list({
        customer: STRIPE_FIXTURES.CUSTOMER_ID,
      });

      expect(payment?.status).toBe(status);
    });

    it('should throw NotFoundError when the customer does not exist', async () => {
      client.paymentIntents.list.mockRejectedValue(
        createStripeMissingResourceError(),
      );

      await expect(
        payments.list({ customer: STRIPE_FIXTURES.CUSTOMER_ID }),
      ).rejects.toMatchObject({
        constructor: NotFoundError,
        provider: CashierProvider.Stripe,
        providerStatus: 404,
      });
    });
  });
});
