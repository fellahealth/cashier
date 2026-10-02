import { RecurlyPaymentsResource } from '../../src/drivers/recurly/resources/recurly-payments.resource';
import { ProviderError } from '../../src/errors/provider.error';
import {
  RECURLY_FIXTURES,
  createFailingRecurlyPager,
  createRecurlyPager,
} from '../fixtures/recurly.fixtures';
import {
  RecurlyClientMock,
  asRecurlyClient,
  createRecurlyClientMock,
} from '../fixtures/recurly-client.mock';

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

      expect(client.listAccountTransactions).toHaveBeenCalledWith(
        RECURLY_FIXTURES.ACCOUNT_ID,
        { params: { limit: 100, type: 'payment' } },
      );
    });

    it('should map every transaction in minor units', async () => {
      client.listAccountTransactions.mockReturnValue(
        createRecurlyPager(RECURLY_FIXTURES.TRANSACTIONS),
      );

      const result = await payments.list({
        customer: RECURLY_FIXTURES.ACCOUNT_ID,
      });

      expect(result).toEqual(RECURLY_FIXTURES.EXPECTED_PAYMENTS);
    });

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
          { ...RECURLY_FIXTURES.TRANSACTIONS[0], status: recurlyStatus },
        ]),
      );

      const [payment] = await payments.list({
        customer: RECURLY_FIXTURES.ACCOUNT_ID,
      });

      expect(payment?.status).toBe(status);
    });

    it('should stop reading pages once the limit is reached', async () => {
      client.listAccountTransactions.mockReturnValue(
        createRecurlyPager(RECURLY_FIXTURES.TRANSACTIONS),
      );

      const result = await payments.list({
        customer: RECURLY_FIXTURES.ACCOUNT_ID,
        limit: 1,
      });

      expect(result).toEqual([RECURLY_FIXTURES.EXPECTED_PAYMENTS[0]]);
    });

    it('should map failures raised while paging', async () => {
      client.listAccountTransactions.mockReturnValue(
        createFailingRecurlyPager(new Error('Network down')),
      );

      await expect(
        payments.list({ customer: RECURLY_FIXTURES.ACCOUNT_ID }),
      ).rejects.toBeInstanceOf(ProviderError);
    });
  });
});
