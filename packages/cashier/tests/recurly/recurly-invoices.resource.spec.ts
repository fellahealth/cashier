import * as recurly from 'recurly';
import { RecurlyInvoicesResource } from '../../src/drivers/recurly/resources/recurly-invoices.resource';
import { NotFoundError } from '../../src/errors/not-found.error';
import { ProviderError } from '../../src/errors/provider.error';
import { UnsupportedOperationError } from '../../src/errors/unsupported-operation.error';
import {
  RECURLY_FIXTURES,
  createFailingRecurlyPager,
  createRecurlyPagePager,
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

    it('should add the refunded amount with refunds', async () => {
      client.getInvoice.mockResolvedValue(RECURLY_FIXTURES.PAID_INVOICE);

      const invoice = await invoices.get(RECURLY_FIXTURES.INVOICE_ID, {
        with: ['refunds'],
      });

      expect(invoice).toEqual({
        ...RECURLY_FIXTURES.EXPECTED_INVOICES[0],
        amountRefunded: 4999,
      });
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

    it.each([
      [
        'a credit invoice',
        { type: 'credit', paid: 10, refundableAmount: null },
      ],
      [
        'a charge invoice without a refundable amount',
        { type: 'charge', paid: 10, refundableAmount: null },
      ],
    ])('should count no refund on %s', async (_case, overrides) => {
      client.listAccountInvoices.mockReturnValue(
        createRecurlyPager([
          { ...RECURLY_FIXTURES.PAID_INVOICE, ...overrides },
        ]),
      );

      const [invoice] = await invoices.list({
        customer: RECURLY_FIXTURES.ACCOUNT_ID,
        with: ['refunds'],
      });

      expect(invoice?.amountRefunded).toBe(0);
    });

    it('should add the refunded amount of charge invoices in minor units with refunds', async () => {
      client.listAccountInvoices.mockReturnValue(
        createRecurlyPager([
          ...RECURLY_FIXTURES.INVOICES,
          RECURLY_FIXTURES.ZERO_DECIMAL_INVOICE,
        ]),
      );

      const result = await invoices.list({
        customer: RECURLY_FIXTURES.ACCOUNT_ID,
        with: ['refunds'],
      });

      expect(result.map((invoice) => invoice.amountRefunded)).toEqual([
        4999, 0, 2000,
      ]);
    });

    it('should reject a relation Recurly does not support without calling Recurly', async () => {
      await expect(
        invoices.list({
          customer: RECURLY_FIXTURES.ACCOUNT_ID,
          with: ['payments' as 'refunds'],
        }),
      ).rejects.toMatchObject({
        constructor: UnsupportedOperationError,
        provider: CashierProvider.Recurly,
      });
      expect(client.listAccountInvoices).not.toHaveBeenCalled();
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

  describe('cursorPaginate', () => {
    it('should request the first page with the state filter and return the next cursor', async () => {
      client.listAccountInvoices.mockReturnValue(
        createRecurlyPagePager(
          RECURLY_FIXTURES.INVOICES,
          RECURLY_FIXTURES.NEXT_PATH,
        ),
      );

      const page = await invoices.cursorPaginate({
        customer: RECURLY_FIXTURES.ACCOUNT_ID,
        status: 'paid',
        perPage: 2,
        with: ['refunds'],
      });

      expect(client.listAccountInvoices).toHaveBeenCalledWith(
        RECURLY_FIXTURES.ACCOUNT_ID,
        { params: { limit: 2, state: 'paid' } },
      );
      expect(page).toEqual({
        data: [
          { ...RECURLY_FIXTURES.EXPECTED_INVOICES[0], amountRefunded: 4999 },
          { ...RECURLY_FIXTURES.EXPECTED_INVOICES[1], amountRefunded: 0 },
        ],
        perPage: 2,
        hasMorePages: true,
        nextCursor: RECURLY_FIXTURES.CURSOR,
      });
    });

    it('should pass the cursor to Recurly', async () => {
      client.listAccountInvoices.mockReturnValue(
        createRecurlyPagePager(
          [RECURLY_FIXTURES.PAID_INVOICE],
          RECURLY_FIXTURES.NEXT_PATH,
        ),
      );

      await invoices.cursorPaginate({
        customer: RECURLY_FIXTURES.ACCOUNT_ID,
        perPage: 1,
        cursor: RECURLY_FIXTURES.CURSOR,
      });

      expect(client.listAccountInvoices).toHaveBeenCalledWith(
        RECURLY_FIXTURES.ACCOUNT_ID,
        { params: { limit: 1, cursor: RECURLY_FIXTURES.CURSOR } },
      );
    });

    it('should return no next cursor on the last page', async () => {
      client.listAccountInvoices.mockReturnValue(
        createRecurlyPagePager([RECURLY_FIXTURES.PAID_INVOICE]),
      );

      const page = await invoices.cursorPaginate({
        customer: RECURLY_FIXTURES.ACCOUNT_ID,
      });

      expect(page).toEqual({
        data: [RECURLY_FIXTURES.EXPECTED_INVOICES[0]],
        perPage: 100,
        hasMorePages: false,
        nextCursor: null,
      });
    });

    it('should map failures raised while paging', async () => {
      client.listAccountInvoices.mockReturnValue(
        createFailingRecurlyPager(new Error('Network down')),
      );

      await expect(
        invoices.cursorPaginate({ customer: RECURLY_FIXTURES.ACCOUNT_ID }),
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
