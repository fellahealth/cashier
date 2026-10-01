import { StripeInvoicesResource } from '../../src/drivers/stripe/resources/stripe-invoices.resource';
import { NotFoundError } from '../../src/errors/not-found.error';
import { STRIPE_FIXTURES } from '../fixtures/stripe.fixtures';
import {
  StripeClientMock,
  asStripeClient,
  createStripeClientMock,
  createStripeMissingResourceError,
} from '../fixtures/stripe-client.mock';

describe('StripeInvoicesResource', () => {
  let client: StripeClientMock;
  let invoices: StripeInvoicesResource;

  beforeEach(() => {
    client = createStripeClientMock();
    invoices = new StripeInvoicesResource(asStripeClient(client));
  });

  describe('get', () => {
    it('should retrieve and map the invoice', async () => {
      client.invoices.retrieve.mockResolvedValue(
        STRIPE_FIXTURES.SUBSCRIPTION_INVOICE,
      );

      const invoice = await invoices.get(STRIPE_FIXTURES.INVOICE_ID);

      expect(client.invoices.retrieve).toHaveBeenCalledWith(
        STRIPE_FIXTURES.INVOICE_ID,
      );
      expect(invoice).toEqual(STRIPE_FIXTURES.EXPECTED_INVOICES[0]);
    });

    it('should throw NotFoundError when the invoice does not exist', async () => {
      client.invoices.retrieve.mockRejectedValue(
        createStripeMissingResourceError(),
      );

      await expect(
        invoices.get(STRIPE_FIXTURES.INVOICE_ID),
      ).rejects.toMatchObject({
        constructor: NotFoundError,
        provider: 'stripe',
        providerStatus: 404,
        providerCode: 'resource_missing',
      });
    });
  });

  describe('list', () => {
    it('should request invoices with the default limit and status filter', async () => {
      client.invoices.list.mockResolvedValue({ data: [] });

      await invoices.list({
        customer: STRIPE_FIXTURES.CUSTOMER_ID,
        status: 'paid',
      });

      expect(client.invoices.list).toHaveBeenCalledWith({
        customer: STRIPE_FIXTURES.CUSTOMER_ID,
        limit: 100,
        status: 'paid',
      });
    });

    it('should omit the status filter when none is given', async () => {
      client.invoices.list.mockResolvedValue({ data: [] });

      await invoices.list({ customer: STRIPE_FIXTURES.CUSTOMER_ID, limit: 10 });

      expect(client.invoices.list).toHaveBeenCalledWith({
        customer: STRIPE_FIXTURES.CUSTOMER_ID,
        limit: 10,
      });
    });

    it('should map every invoice', async () => {
      client.invoices.list.mockResolvedValue({
        data: STRIPE_FIXTURES.INVOICES,
      });

      const result = await invoices.list({
        customer: STRIPE_FIXTURES.CUSTOMER_ID,
      });

      expect(result).toEqual(STRIPE_FIXTURES.EXPECTED_INVOICES);
    });
  });

  describe('pay', () => {
    it('should pay the invoice with the given payment method', async () => {
      client.invoices.pay.mockResolvedValue(
        STRIPE_FIXTURES.SUBSCRIPTION_INVOICE,
      );

      const invoice = await invoices.pay(STRIPE_FIXTURES.INVOICE_ID, {
        paymentMethod: STRIPE_FIXTURES.PAYMENT_METHOD_ID,
      });

      expect(client.invoices.pay).toHaveBeenCalledWith(
        STRIPE_FIXTURES.INVOICE_ID,
        { payment_method: STRIPE_FIXTURES.PAYMENT_METHOD_ID },
      );
      expect(invoice).toEqual(STRIPE_FIXTURES.EXPECTED_INVOICES[0]);
    });

    it('should pay the invoice with the default payment method when none is given', async () => {
      client.invoices.pay.mockResolvedValue(
        STRIPE_FIXTURES.SUBSCRIPTION_INVOICE,
      );

      await invoices.pay(STRIPE_FIXTURES.INVOICE_ID);

      expect(client.invoices.pay).toHaveBeenCalledWith(
        STRIPE_FIXTURES.INVOICE_ID,
        {},
      );
    });
  });

  describe('void', () => {
    it('should void and map the invoice', async () => {
      client.invoices.voidInvoice.mockResolvedValue(
        STRIPE_FIXTURES.SUBSCRIPTION_INVOICE,
      );

      const invoice = await invoices.void(STRIPE_FIXTURES.INVOICE_ID);

      expect(client.invoices.voidInvoice).toHaveBeenCalledWith(
        STRIPE_FIXTURES.INVOICE_ID,
      );
      expect(invoice).toEqual(STRIPE_FIXTURES.EXPECTED_INVOICES[0]);
    });
  });
});
