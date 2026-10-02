import { StripeInvoicesResource } from '../../src/drivers/stripe/resources/stripe-invoices.resource';
import { NotFoundError } from '../../src/errors/not-found.error';
import { STRIPE_FIXTURES } from '../fixtures/stripe.fixtures';
import {
  StripeClientMock,
  asStripeClient,
  createStripeClientMock,
  createStripeMissingResourceError,
} from '../fixtures/stripe-client.mock';
import { CashierProvider } from '../../src/types/cashier.types';

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
        { expand: ['charge'] },
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
        provider: CashierProvider.Stripe,
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
        expand: ['data.charge'],
      });
    });

    it('should omit the status filter when none is given', async () => {
      client.invoices.list.mockResolvedValue({ data: [] });

      await invoices.list({ customer: STRIPE_FIXTURES.CUSTOMER_ID, limit: 10 });

      expect(client.invoices.list).toHaveBeenCalledWith({
        customer: STRIPE_FIXTURES.CUSTOMER_ID,
        limit: 10,
        expand: ['data.charge'],
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

    it('should count no refund when the charge is not expanded and no hosted url when it is missing', async () => {
      client.invoices.list.mockResolvedValue({
        data: [
          {
            ...STRIPE_FIXTURES.SUBSCRIPTION_INVOICE,
            charge: 'ch_123',
            hosted_invoice_url: undefined,
          },
        ],
      });

      const [invoice] = await invoices.list({
        customer: STRIPE_FIXTURES.CUSTOMER_ID,
      });

      expect(invoice).toMatchObject({
        amountRefunded: 0,
        hostedInvoiceUrl: null,
      });
    });
  });

  describe('cursorPaginate', () => {
    it('should request the first page with the status filter', async () => {
      client.invoices.list.mockResolvedValue({
        data: STRIPE_FIXTURES.INVOICES,
        has_more: true,
      });

      const page = await invoices.cursorPaginate({
        customer: STRIPE_FIXTURES.CUSTOMER_ID,
        status: 'paid',
        perPage: 2,
      });

      expect(client.invoices.list).toHaveBeenCalledWith({
        customer: STRIPE_FIXTURES.CUSTOMER_ID,
        limit: 2,
        status: 'paid',
        expand: ['data.charge'],
      });
      expect(page).toEqual({
        data: STRIPE_FIXTURES.EXPECTED_INVOICES,
        perPage: 2,
        hasMorePages: true,
        nextCursor: 'in_456',
      });
    });

    it('should request the page after the cursor', async () => {
      client.invoices.list.mockResolvedValue({
        data: [STRIPE_FIXTURES.SUBSCRIPTION_INVOICE],
        has_more: true,
      });

      const page = await invoices.cursorPaginate({
        customer: STRIPE_FIXTURES.CUSTOMER_ID,
        perPage: 1,
        cursor: 'in_000',
      });

      expect(client.invoices.list).toHaveBeenCalledWith({
        customer: STRIPE_FIXTURES.CUSTOMER_ID,
        limit: 1,
        starting_after: 'in_000',
        expand: ['data.charge'],
      });
      expect(page.nextCursor).toBe(STRIPE_FIXTURES.INVOICE_ID);
    });

    it('should return no next cursor on the last page', async () => {
      client.invoices.list.mockResolvedValue({
        data: [STRIPE_FIXTURES.SUBSCRIPTION_INVOICE],
        has_more: false,
      });

      const page = await invoices.cursorPaginate({
        customer: STRIPE_FIXTURES.CUSTOMER_ID,
      });

      expect(page).toEqual({
        data: [STRIPE_FIXTURES.EXPECTED_INVOICES[0]],
        perPage: 100,
        hasMorePages: false,
        nextCursor: null,
      });
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
        {
          payment_method: STRIPE_FIXTURES.PAYMENT_METHOD_ID,
          expand: ['charge'],
        },
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
        { expand: ['charge'] },
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
        { expand: ['charge'] },
      );
      expect(invoice).toEqual(STRIPE_FIXTURES.EXPECTED_INVOICES[0]);
    });
  });
});
