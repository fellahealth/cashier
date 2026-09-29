import { RecurlyPricesResource } from '../../src/drivers/recurly/resources/recurly-prices.resource';
import { UnsupportedOperationError } from '../../src/errors/unsupported-operation.error';

describe('RecurlyPricesResource', () => {
  const prices = new RecurlyPricesResource();

  it('should reject get with UnsupportedOperationError', async () => {
    await expect(prices.get()).rejects.toMatchObject({
      constructor: UnsupportedOperationError,
      provider: 'recurly',
    });
  });

  it('should reject list with UnsupportedOperationError', async () => {
    await expect(prices.list()).rejects.toBeInstanceOf(
      UnsupportedOperationError,
    );
  });
});
