import * as recurly from 'recurly';
import {
  readRecurlyItems,
  readRecurlyPage,
} from '../../src/drivers/recurly/recurly-page';
import { CASHIER_FIXTURES } from '../fixtures/cashier.fixtures';
import { RECURLY_FIXTURES } from '../fixtures/recurly.fixtures';

interface RecurlyResponsePage {
  data: unknown[];
  hasMore: boolean;
  next: string | null;
}

describe('readRecurlyPage', () => {
  let client: recurly.Client;
  let makeRequest: jest.Mock<Promise<RecurlyResponsePage>>;

  const listTransactions = () =>
    client.listAccountTransactions(RECURLY_FIXTURES.ACCOUNT_ID, {
      params: { limit: 2 },
    });

  beforeEach(() => {
    client = new recurly.Client(CASHIER_FIXTURES.API_KEY);
    makeRequest = jest.fn();
    Object.assign(client, { _makeRequest: makeRequest });
  });

  it('should read the first page and the cursor of the next one from the SDK pager', async () => {
    makeRequest.mockResolvedValue({
      data: RECURLY_FIXTURES.TRANSACTIONS,
      hasMore: true,
      next: RECURLY_FIXTURES.NEXT_PATH,
    });

    const page = await readRecurlyPage(listTransactions());

    expect(makeRequest).toHaveBeenCalledTimes(1);
    expect(page).toEqual({
      items: RECURLY_FIXTURES.TRANSACTIONS,
      hasMorePages: true,
      nextCursor: RECURLY_FIXTURES.CURSOR,
    });
  });

  it('should have no next cursor on the last page', async () => {
    makeRequest.mockResolvedValue({
      data: RECURLY_FIXTURES.TRANSACTIONS,
      hasMore: false,
      next: null,
    });

    const page = await readRecurlyPage(listTransactions());

    expect(page).toEqual({
      items: RECURLY_FIXTURES.TRANSACTIONS,
      hasMorePages: false,
      nextCursor: null,
    });
  });

  it('should treat a next link without a cursor as the last page', async () => {
    makeRequest.mockResolvedValue({
      data: [],
      hasMore: true,
      next: '/accounts/acct_1/transactions',
    });

    const page = await readRecurlyPage(listTransactions());

    expect(page).toEqual({ items: [], hasMorePages: false, nextCursor: null });
  });
});

describe('readRecurlyItems', () => {
  it('should read every item when there is no limit', async () => {
    const pager = {
      each: async function* () {
        yield* RECURLY_FIXTURES.REFUNDS;
      },
    } as unknown as recurly.Pager<recurly.Transaction>;

    await expect(readRecurlyItems(pager)).resolves.toEqual(
      RECURLY_FIXTURES.REFUNDS,
    );
  });
});
