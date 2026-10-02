import { StripePricesResource } from '../../src/drivers/stripe/resources/stripe-prices.resource';
import { STRIPE_FIXTURES } from '../fixtures/stripe.fixtures';
import {
  StripeClientMock,
  asStripeClient,
  createStripeClientMock,
} from '../fixtures/stripe-client.mock';

describe('StripePricesResource', () => {
  let client: StripeClientMock;
  let prices: StripePricesResource;

  beforeEach(() => {
    client = createStripeClientMock();
    prices = new StripePricesResource(asStripeClient(client));
  });

  describe('get', () => {
    it('should retrieve and map a recurring price', async () => {
      client.prices.retrieve.mockResolvedValue(STRIPE_FIXTURES.RECURRING_PRICE);

      const price = await prices.get(STRIPE_FIXTURES.PRICE_ID);

      expect(client.prices.retrieve).toHaveBeenCalledWith(
        STRIPE_FIXTURES.PRICE_ID,
      );
      expect(price).toEqual(STRIPE_FIXTURES.EXPECTED_RECURRING_PRICE);
    });

    it('should map a one-time price with an expanded product and no interval', async () => {
      client.prices.retrieve.mockResolvedValue(STRIPE_FIXTURES.ONE_TIME_PRICE);

      const price = await prices.get(STRIPE_FIXTURES.PRICE_ID);

      expect(price).toEqual(STRIPE_FIXTURES.EXPECTED_ONE_TIME_PRICE);
    });
  });

  describe('list', () => {
    it('should list prices for a product with the active filter', async () => {
      client.prices.list.mockResolvedValue({
        data: [STRIPE_FIXTURES.RECURRING_PRICE],
      });

      const result = await prices.list({
        product: STRIPE_FIXTURES.PRODUCT_ID,
        active: true,
      });

      expect(client.prices.list).toHaveBeenCalledWith({
        limit: 100,
        product: STRIPE_FIXTURES.PRODUCT_ID,
        active: true,
      });
      expect(result).toEqual([STRIPE_FIXTURES.EXPECTED_RECURRING_PRICE]);
    });

    it('should list all prices when no filter is given', async () => {
      client.prices.list.mockResolvedValue({ data: [] });

      await prices.list();

      expect(client.prices.list).toHaveBeenCalledWith({ limit: 100 });
    });
  });
});
