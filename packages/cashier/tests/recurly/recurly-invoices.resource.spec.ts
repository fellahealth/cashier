import * as recurly from 'recurly';
import { RecurlyInvoicesResource } from '../../src/drivers/recurly/resources/recurly-invoices.resource';
import { NotFoundError } from '../../src/errors/not-found.error';
import { ProviderError } from '../../src/errors/provider.error';
import {
  RECURLY_FIXTURES,
  createFailingRecurlyPager,
  createRecurlyPager,
  withRecurlyStatus,
} from '../fixtures/recurly.fixtures';
import {
  RecurlyClientMock,
  asRecurlyClient,
  createRecurlyClientMock,
} from '../fixtures/recurly-client.mock';
import { CashierProvider } from '../../src/types/cashier.types';

describe('RecurlyInvoicesResource', () => {
  let client: RecurlyClientMock;
  let invoices: RecurlyInvoicesResource;

  beforeEach(() => {
    client = createRecurlyClientMock();
    invoices = new RecurlyInvoicesResource(asRecurlyClient(client));
  });

  describe('get', () => {
    it('should retrieve and map the invoice in minor units', async () => {
      client.getInvoice.mockResolvedValue(RECURLY_FIXTURES.PAID_INVOICE);

      const invoice = await invoices.get(RECURLY_FIXTURES.INVOICE_ID);

      expect(client.getInvoice).toHaveBeenCalledWith(
        RECURLY_FIXTURES.INVOICE_ID,
      );
      expect(invoice).toEqual(RECURLY_FIXTURES.EXPECTED_INVOICES[0]);
    });

    it('should throw NotFoundError with the provider status when the invoice does not exist', async () => {
      client.getInvoice.mockRejectedValue(
        withRecurlyStatus(
          new recurly.errors.NotFoundError('Not found', 'not_found', {}),
          404,
        ),
      );

      await expect(
        invoices.get(RECURLY_FIXTURES.INVOICE_ID),
      ).rejects.toMatchObject({
        constructor: NotFoundError,
        provider: CashierProvider.Recurly,
        providerStatus: 404,
        providerCode: 'not_found',
      });
    });
  });

  describe('list', () => {
    it('should request account invoices with the limit and state filter', async () => {
      client.listAccountInvoices.mockReturnValue(createRecurlyPager([]));

      await invoices.list({
        customer: RECURLY_FIXTURES.ACCOUNT_ID,
        status: 'paid',
      });

      expect(client.listAccountInvoices).toHaveBeenCalledWith(
        RECURLY_FIXTURES.ACCOUNT_ID,
        { params: { limit: 100, state: 'paid' } },
      );
    });

    it('should map every invoice', async () => {
      client.listAccountInvoices.mockReturnValue(
        createRecurlyPager(RECURLY_FIXTURES.INVOICES),
      );

      const result = await invoices.list({
        customer: RECURLY_FIXTURES.ACCOUNT_ID,
      });

      expect(result).toEqual(RECURLY_FIXTURES.EXPECTED_INVOICES);
    });

    it('should use the currency exponent and keep unknown states and all subscription ids', async () => {
      client.listAccountInvoices.mockReturnValue(
        createRecurlyPager([RECURLY_FIXTURES.ZERO_DECIMAL_INVOICE]),
      );

      const result = await invoices.list({
        customer: RECURLY_FIXTURES.ACCOUNT_ID,
      });

      expect(result).toEqual([RECURLY_FIXTURES.EXPECTED_ZERO_DECIMAL_INVOICE]);
    });

    it('should stop reading pages once the limit is reached', async () => {
      client.listAccountInvoices.mockReturnValue(
        createRecurlyPager(RECURLY_FIXTURES.INVOICES),
      );

      const result = await invoices.list({
        customer: RECURLY_FIXTURES.ACCOUNT_ID,
        limit: 1,
      });

      expect(result).toEqual([RECURLY_FIXTURES.EXPECTED_INVOICES[0]]);
    });

    it('should map failures raised while paging', async () => {
      client.listAccountInvoices.mockReturnValue(
        createFailingRecurlyPager(new Error('Network down')),
      );

      await expect(
        invoices.list({ customer: RECURLY_FIXTURES.ACCOUNT_ID }),
      ).rejects.toBeInstanceOf(ProviderError);
    });
  });

  describe('pay', () => {
    it('should collect the invoice with the given billing info', async () => {
      client.collectInvoice.mockResolvedValue(RECURLY_FIXTURES.PAID_INVOICE);

      const invoice = await invoices.pay(RECURLY_FIXTURES.INVOICE_ID, {
        paymentMethod: RECURLY_FIXTURES.BILLING_INFO_ID,
      });

      expect(client.collectInvoice).toHaveBeenCalledWith(
        RECURLY_FIXTURES.INVOICE_ID,
        { body: { billingInfoId: RECURLY_FIXTURES.BILLING_INFO_ID } },
      );
      expect(invoice).toEqual(RECURLY_FIXTURES.EXPECTED_INVOICES[0]);
    });

    it('should collect with the default billing info when none is given', async () => {
      client.collectInvoice.mockResolvedValue(RECURLY_FIXTURES.PAID_INVOICE);

      await invoices.pay(RECURLY_FIXTURES.INVOICE_ID);

      expect(client.collectInvoice).toHaveBeenCalledWith(
        RECURLY_FIXTURES.INVOICE_ID,
        undefined,
      );
    });
  });

  describe('void', () => {
    it('should void and map the invoice', async () => {
      client.voidInvoice.mockResolvedValue(RECURLY_FIXTURES.PAID_INVOICE);

      const invoice = await invoices.void(RECURLY_FIXTURES.INVOICE_ID);

      expect(client.voidInvoice).toHaveBeenCalledWith(
        RECURLY_FIXTURES.INVOICE_ID,
      );
      expect(invoice).toEqual(RECURLY_FIXTURES.EXPECTED_INVOICES[0]);
    });
  });
});
