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

const EXPAND = [
  'data.latest_charge',
  'data.latest_charge.dispute',
  'data.latest_charge.refunds',
  'data.invoice.subscription',
];

describe('StripePaymentsResource', () => {
  let client: StripeClientMock;
  let payments: StripePaymentsResource;

  const mapOne = async (overrides: Record<string, unknown>) => {
    client.paymentIntents.list.mockResolvedValue({
      data: [{ ...STRIPE_FIXTURES.SUCCEEDED_PAYMENT_INTENT, ...overrides }],
    });

    const [payment] = await payments.list({
      customer: STRIPE_FIXTURES.CUSTOMER_ID,
    });

    return payment;
  };

  const withCharge = (overrides: Record<string, unknown>) =>
    mapOne({
      latest_charge: { ...STRIPE_FIXTURES.REFUNDED_CHARGE, ...overrides },
    });

  const withSubscription = (overrides: Record<string, unknown>) =>
    mapOne({
      invoice: {
        id: STRIPE_FIXTURES.INVOICE_ID,
        subscription: { ...STRIPE_FIXTURES.SUBSCRIPTION, ...overrides },
      },
    });

  beforeEach(() => {
    client = createStripeClientMock();
    payments = new StripePaymentsResource(asStripeClient(client));
  });

  describe('list', () => {
    it('should request expanded payment intents with the default limit', async () => {
      client.paymentIntents.list.mockResolvedValue({ data: [] });

      await payments.list({ customer: STRIPE_FIXTURES.CUSTOMER_ID });

      expect(client.paymentIntents.list).toHaveBeenCalledWith({
        customer: STRIPE_FIXTURES.CUSTOMER_ID,
        limit: 100,
        expand: EXPAND,
      });
    });

    it('should pass the given limit', async () => {
      client.paymentIntents.list.mockResolvedValue({ data: [] });

      await payments.list({ customer: STRIPE_FIXTURES.CUSTOMER_ID, limit: 10 });

      expect(client.paymentIntents.list).toHaveBeenCalledWith({
        customer: STRIPE_FIXTURES.CUSTOMER_ID,
        limit: 10,
        expand: EXPAND,
      });
    });

    it('should map every payment intent, including missing and unexpanded charges and invoices', async () => {
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
      const payment = await mapOne({ status: stripeStatus });

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

  describe('cursorPaginate', () => {
    it('should request the first page without a cursor', async () => {
      client.paymentIntents.list.mockResolvedValue({
        data: STRIPE_FIXTURES.PAYMENT_INTENTS,
        has_more: true,
      });

      const page = await payments.cursorPaginate({
        customer: STRIPE_FIXTURES.CUSTOMER_ID,
        perPage: 3,
      });

      expect(client.paymentIntents.list).toHaveBeenCalledWith({
        customer: STRIPE_FIXTURES.CUSTOMER_ID,
        limit: 3,
        expand: EXPAND,
      });
      expect(page).toEqual({
        data: STRIPE_FIXTURES.EXPECTED_PAYMENTS,
        perPage: 3,
        hasMorePages: true,
        nextCursor: 'pi_789',
      });
    });

    it('should request the page after the cursor', async () => {
      client.paymentIntents.list.mockResolvedValue({
        data: [STRIPE_FIXTURES.SUCCEEDED_PAYMENT_INTENT],
        has_more: true,
      });

      const page = await payments.cursorPaginate({
        customer: STRIPE_FIXTURES.CUSTOMER_ID,
        perPage: 1,
        cursor: 'pi_000',
      });

      expect(client.paymentIntents.list).toHaveBeenCalledWith({
        customer: STRIPE_FIXTURES.CUSTOMER_ID,
        limit: 1,
        starting_after: 'pi_000',
        expand: EXPAND,
      });
      expect(page.nextCursor).toBe(STRIPE_FIXTURES.PAYMENT_CURSOR);
    });

    it('should return no next cursor on the last page', async () => {
      client.paymentIntents.list.mockResolvedValue({
        data: [STRIPE_FIXTURES.SUCCEEDED_PAYMENT_INTENT],
        has_more: false,
      });

      const page = await payments.cursorPaginate({
        customer: STRIPE_FIXTURES.CUSTOMER_ID,
        cursor: null,
      });

      expect(client.paymentIntents.list).toHaveBeenCalledWith({
        customer: STRIPE_FIXTURES.CUSTOMER_ID,
        limit: 100,
        expand: EXPAND,
      });
      expect(page).toMatchObject({
        perPage: 100,
        hasMorePages: false,
        nextCursor: null,
      });
    });

    it('should throw NotFoundError when the customer does not exist', async () => {
      client.paymentIntents.list.mockRejectedValue(
        createStripeMissingResourceError(),
      );

      await expect(
        payments.cursorPaginate({ customer: STRIPE_FIXTURES.CUSTOMER_ID }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('dispute', () => {
    it('should be null when the charge has no dispute', async () => {
      const payment = await withCharge({ dispute: null });

      expect(payment?.dispute).toBeNull();
    });

    it('should be null when the dispute is not expanded', async () => {
      const payment = await withCharge({ dispute: 'dp_123' });

      expect(payment?.dispute).toBeNull();
    });

    it('should map an unknown dispute status to unknown and a missing due date to null', async () => {
      const payment = await withCharge({
        dispute: {
          ...STRIPE_FIXTURES.DISPUTE,
          status: 'prevented',
          evidence_details: { due_by: null },
        },
      });

      expect(payment?.dispute).toMatchObject({
        status: 'unknown',
        evidenceDueBy: null,
      });
    });
  });

  describe('reversed', () => {
    it.each([
      ['the refunds are not expanded', { refunds: null }],
      ['there are no refunds', { refunds: { data: [] } }],
      [
        'no refund is a card reversal',
        { refunds: { data: [{ id: 're_1', destination_details: null }] } },
      ],
    ])('should be false when %s', async (_case, charge) => {
      const payment = await withCharge(charge);

      expect(payment?.reversed).toBe(false);
    });
  });

  describe('subscription', () => {
    it('should use cancel_at when the subscription is scheduled to cancel', async () => {
      const payment = await withSubscription({
        cancel_at: 1768262400,
        cancel_at_period_end: false,
      });

      expect(payment?.subscription).toEqual({
        id: STRIPE_FIXTURES.SUBSCRIPTION_ID,
        status: 'active',
        cancelAt: new Date(1768262400 * 1000),
      });
    });

    it('should have no cancelAt when the subscription is not canceling', async () => {
      const payment = await withSubscription({
        cancel_at: null,
        cancel_at_period_end: false,
      });

      expect(payment?.subscription?.cancelAt).toBeNull();
    });

    it('should be null when the invoice has no subscription', async () => {
      const payment = await mapOne({
        invoice: { id: STRIPE_FIXTURES.INVOICE_ID, subscription: null },
      });

      expect(payment?.subscription).toBeNull();
    });

    it('should be null when the invoice is not expanded', async () => {
      const payment = await mapOne({ invoice: STRIPE_FIXTURES.INVOICE_ID });

      expect(payment?.subscription).toBeNull();
      expect(payment?.invoiceId).toBe(STRIPE_FIXTURES.INVOICE_ID);
    });
  });
});
