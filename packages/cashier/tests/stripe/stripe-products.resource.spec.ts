import { StripeProductsResource } from '../../src/drivers/stripe/resources/stripe-products.resource';
import { STRIPE_FIXTURES } from '../fixtures/stripe.fixtures';
import {
  StripeClientMock,
  asStripeClient,
  createStripeClientMock,
} from '../fixtures/stripe-client.mock';

describe('StripeProductsResource', () => {
  let client: StripeClientMock;
  let products: StripeProductsResource;

  beforeEach(() => {
    client = createStripeClientMock();
    products = new StripeProductsResource(asStripeClient(client));
  });

  describe('get', () => {
    it('should retrieve and map the product', async () => {
      client.products.retrieve.mockResolvedValue(STRIPE_FIXTURES.PRODUCT);

      const product = await products.get(STRIPE_FIXTURES.PRODUCT_ID);

      expect(client.products.retrieve).toHaveBeenCalledWith(
        STRIPE_FIXTURES.PRODUCT_ID,
      );
      expect(product).toEqual(STRIPE_FIXTURES.EXPECTED_PRODUCT);
    });
  });

  describe('list', () => {
    it('should list products with the default limit', async () => {
      client.products.list.mockResolvedValue({
        data: [STRIPE_FIXTURES.PRODUCT],
      });

      const result = await products.list();

      expect(client.products.list).toHaveBeenCalledWith({ limit: 100 });
      expect(result).toEqual([STRIPE_FIXTURES.EXPECTED_PRODUCT]);
    });

    it('should pass the active filter and limit', async () => {
      client.products.list.mockResolvedValue({ data: [] });

      await products.list({ active: false, limit: 5 });

      expect(client.products.list).toHaveBeenCalledWith({
        limit: 5,
        active: false,
      });
    });
  });
});
