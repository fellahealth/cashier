import { RecurlyPricesResource } from '../../src/drivers/recurly/resources/recurly-prices.resource';
import { UnsupportedOperationError } from '../../src/errors/unsupported-operation.error';
import { CashierProvider } from '../../src/types/cashier.types';

describe('RecurlyPricesResource', () => {
  const prices = new RecurlyPricesResource();

  it('should reject get with UnsupportedOperationError', async () => {
    await expect(prices.get()).rejects.toMatchObject({
      constructor: UnsupportedOperationError,
      provider: CashierProvider.Recurly,
    });
  });

  it('should reject list with UnsupportedOperationError', async () => {
    await expect(prices.list()).rejects.toBeInstanceOf(
      UnsupportedOperationError,
    );
  });
});
