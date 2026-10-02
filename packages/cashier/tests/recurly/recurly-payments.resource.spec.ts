import { RecurlyPaymentsResource } from '../../src/drivers/recurly/resources/recurly-payments.resource';
import { ProviderError } from '../../src/errors/provider.error';
import { UnsupportedOperationError } from '../../src/errors/unsupported-operation.error';
import { CashierProvider } from '../../src/types/cashier.types';
import {
  RECURLY_FIXTURES,
  createFailingRecurlyPager,
  createRecurlyPagePager,
  createRecurlyPager,
} from '../fixtures/recurly.fixtures';
import {
  RecurlyClientMock,
  asRecurlyClient,
  createRecurlyClientMock,
} from '../fixtures/recurly-client.mock';

const RELATIONS = ['refunds', 'subscription'] as const;

describe('RecurlyPaymentsResource', () => {
  let client: RecurlyClientMock;
  let payments: RecurlyPaymentsResource;

  beforeEach(() => {
    client = createRecurlyClientMock();
    payments = new RecurlyPaymentsResource(asRecurlyClient(client));
  });

  describe('list', () => {
    it('should request the account payment transactions with the limit', async () => {
      client.listAccountTransactions.mockReturnValue(createRecurlyPager([]));

      await payments.list({ customer: RECURLY_FIXTURES.ACCOUNT_ID });

      expect(client.listAccountTransactions).toHaveBeenCalledTimes(1);
      expect(client.listAccountTransactions).toHaveBeenCalledWith(
        RECURLY_FIXTURES.ACCOUNT_ID,
        { params: { limit: 100, type: 'payment' } },
      );
    });

    it('should map every transaction in minor units without relation fields by default', async () => {
      client.listAccountTransactions.mockReturnValue(
        createRecurlyPager(RECURLY_FIXTURES.TRANSACTIONS),
      );

      const result = await payments.list({
        customer: RECURLY_FIXTURES.ACCOUNT_ID,
      });

      expect(client.listAccountTransactions).toHaveBeenCalledTimes(1);
      expect(result).toEqual(RECURLY_FIXTURES.EXPECTED_PAYMENTS);
    });

    it('should add the refunded amounts and subscriptions with relations', async () => {
      client.listAccountTransactions
        .mockReturnValueOnce(createRecurlyPager(RECURLY_FIXTURES.TRANSACTIONS))
        .mockReturnValueOnce(createRecurlyPager(RECURLY_FIXTURES.REFUNDS));

      const result = await payments.list({
        customer: RECURLY_FIXTURES.ACCOUNT_ID,
        with: RELATIONS,
      });

      expect(result).toEqual(RECURLY_FIXTURES.EXPECTED_PAYMENTS_WITH_RELATIONS);
    });

    it('should list refunds created since the oldest refunded payment', async () => {
      client.listAccountTransactions
        .mockReturnValueOnce(createRecurlyPager(RECURLY_FIXTURES.TRANSACTIONS))
        .mockReturnValueOnce(createRecurlyPager([]));

      const [payment] = await payments.list({
        customer: RECURLY_FIXTURES.ACCOUNT_ID,
        with: ['refunds'],
      });

      expect(client.listAccountTransactions).toHaveBeenLastCalledWith(
        RECURLY_FIXTURES.ACCOUNT_ID,
        {
          params: {
            limit: 200,
            type: 'refund',
            beginTime: new Date('2026-01-01T00:00:00Z'),
          },
        },
      );
      expect(payment?.amountRefunded).toBe(0);
    });

    it('should not list refunds when no payment was refunded', async () => {
      client.listAccountTransactions.mockReturnValue(
        createRecurlyPager([RECURLY_FIXTURES.TRANSACTIONS[1]]),
      );

      const result = await payments.list({
        customer: RECURLY_FIXTURES.ACCOUNT_ID,
        with: RELATIONS,
      });

      expect(client.listAccountTransactions).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        RECURLY_FIXTURES.EXPECTED_PAYMENTS_WITH_RELATIONS[1],
      ]);
    });

    it('should not list refunds when only the subscription is loaded', async () => {
      client.listAccountTransactions.mockReturnValue(
        createRecurlyPager(RECURLY_FIXTURES.TRANSACTIONS),
      );

      const [payment] = await payments.list({
        customer: RECURLY_FIXTURES.ACCOUNT_ID,
        with: ['subscription'],
      });

      expect(client.listAccountTransactions).toHaveBeenCalledTimes(1);
      expect(payment).toEqual({
        ...RECURLY_FIXTURES.EXPECTED_PAYMENTS[0],
        subscription: { id: 'rec_sub_1', status: null, cancelAt: null },
      });
    });

    it.each(['dispute', 'receipt', 'reversal'])(
      'should reject the %s relation without calling Recurly',
      async (relation) => {
        await expect(
          payments.list({
            customer: RECURLY_FIXTURES.ACCOUNT_ID,
            with: [relation as 'refunds'],
          }),
        ).rejects.toMatchObject({
          constructor: UnsupportedOperationError,
          provider: CashierProvider.Recurly,
        });
        expect(client.listAccountTransactions).not.toHaveBeenCalled();
      },
    );

    it.each([
      ['pending', 'pending'],
      ['processing', 'pending'],
      ['scheduled', 'pending'],
      ['error', 'failed'],
      ['void', 'canceled'],
      ['chargeback', 'unknown'],
    ])('should map the %s status to %s', async (recurlyStatus, status) => {
      client.listAccountTransactions.mockReturnValue(
        createRecurlyPager([
          { ...RECURLY_FIXTURES.TRANSACTIONS[1], status: recurlyStatus },
        ]),
      );

      const [payment] = await payments.list({
        customer: RECURLY_FIXTURES.ACCOUNT_ID,
      });

      expect(payment?.status).toBe(status);
    });

    it('should stop reading pages once the limit is reached', async () => {
      client.listAccountTransactions
        .mockReturnValueOnce(createRecurlyPager(RECURLY_FIXTURES.TRANSACTIONS))
        .mockReturnValueOnce(createRecurlyPager(RECURLY_FIXTURES.REFUNDS));

      const result = await payments.list({
        customer: RECURLY_FIXTURES.ACCOUNT_ID,
        limit: 1,
        with: RELATIONS,
      });

      expect(result).toEqual([
        RECURLY_FIXTURES.EXPECTED_PAYMENTS_WITH_RELATIONS[0],
      ]);
    });

    it('should map failures raised while paging', async () => {
      client.listAccountTransactions.mockReturnValue(
        createFailingRecurlyPager(new Error('Network down')),
      );

      await expect(
        payments.list({ customer: RECURLY_FIXTURES.ACCOUNT_ID }),
      ).rejects.toBeInstanceOf(ProviderError);
    });

    it('should map failures raised while listing refunds', async () => {
      client.listAccountTransactions
        .mockReturnValueOnce(createRecurlyPager(RECURLY_FIXTURES.TRANSACTIONS))
        .mockReturnValueOnce(
          createFailingRecurlyPager(new Error('Network down')),
        );

      await expect(
        payments.list({
          customer: RECURLY_FIXTURES.ACCOUNT_ID,
          with: RELATIONS,
        }),
      ).rejects.toBeInstanceOf(ProviderError);
    });
  });

  describe('cursorPaginate', () => {
    it('should request the first page and return the next cursor', async () => {
      client.listAccountTransactions
        .mockReturnValueOnce(
          createRecurlyPagePager(
            RECURLY_FIXTURES.TRANSACTIONS,
            RECURLY_FIXTURES.NEXT_PATH,
          ),
        )
        .mockReturnValueOnce(createRecurlyPager(RECURLY_FIXTURES.REFUNDS));

      const page = await payments.cursorPaginate({
        customer: RECURLY_FIXTURES.ACCOUNT_ID,
        perPage: 2,
        with: RELATIONS,
      });

      expect(client.listAccountTransactions).toHaveBeenNthCalledWith(
        1,
        RECURLY_FIXTURES.ACCOUNT_ID,
        { params: { limit: 2, type: 'payment' } },
      );
      expect(page).toEqual({
        data: RECURLY_FIXTURES.EXPECTED_PAYMENTS_WITH_RELATIONS,
        perPage: 2,
        hasMorePages: true,
        nextCursor: RECURLY_FIXTURES.CURSOR,
      });
    });

    it('should pass the cursor to Recurly', async () => {
      client.listAccountTransactions.mockReturnValue(
        createRecurlyPagePager(
          [RECURLY_FIXTURES.TRANSACTIONS[1]],
          RECURLY_FIXTURES.NEXT_PATH,
        ),
      );

      await payments.cursorPaginate({
        customer: RECURLY_FIXTURES.ACCOUNT_ID,
        perPage: 2,
        cursor: RECURLY_FIXTURES.CURSOR,
      });

      expect(client.listAccountTransactions).toHaveBeenCalledWith(
        RECURLY_FIXTURES.ACCOUNT_ID,
        {
          params: {
            limit: 2,
            type: 'payment',
            cursor: RECURLY_FIXTURES.CURSOR,
          },
        },
      );
    });

    it('should return no next cursor on the last page', async () => {
      client.listAccountTransactions.mockReturnValue(
        createRecurlyPagePager([RECURLY_FIXTURES.TRANSACTIONS[1]]),
      );

      const page = await payments.cursorPaginate({
        customer: RECURLY_FIXTURES.ACCOUNT_ID,
        cursor: null,
      });

      expect(client.listAccountTransactions).toHaveBeenCalledWith(
        RECURLY_FIXTURES.ACCOUNT_ID,
        { params: { limit: 100, type: 'payment' } },
      );
      expect(page).toEqual({
        data: [RECURLY_FIXTURES.EXPECTED_PAYMENTS[1]],
        perPage: 100,
        hasMorePages: false,
        nextCursor: null,
      });
    });

    it('should map failures raised while paging', async () => {
      client.listAccountTransactions.mockReturnValue(
        createFailingRecurlyPager(new Error('Network down')),
      );

      await expect(
        payments.cursorPaginate({ customer: RECURLY_FIXTURES.ACCOUNT_ID }),
      ).rejects.toBeInstanceOf(ProviderError);
    });
  });
});
