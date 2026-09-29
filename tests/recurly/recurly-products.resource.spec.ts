import { RecurlyProductsResource } from '../../src/drivers/recurly/resources/recurly-products.resource';
import {
  RECURLY_FIXTURES,
  createRecurlyPager,
} from '../fixtures/recurly.fixtures';
import {
  RecurlyClientMock,
  asRecurlyClient,
  createRecurlyClientMock,
} from '../fixtures/recurly-client.mock';

describe('RecurlyProductsResource', () => {
  let client: RecurlyClientMock;
  let products: RecurlyProductsResource;

  beforeEach(() => {
    client = createRecurlyClientMock();
    products = new RecurlyProductsResource(asRecurlyClient(client));
  });

  describe('get', () => {
    it('should retrieve the plan and map it to a product', async () => {
      client.getPlan.mockResolvedValue(RECURLY_FIXTURES.ACTIVE_PLAN);

      const product = await products.get(RECURLY_FIXTURES.PLAN_ID);

      expect(client.getPlan).toHaveBeenCalledWith(RECURLY_FIXTURES.PLAN_ID);
      expect(product).toEqual(RECURLY_FIXTURES.EXPECTED_PRODUCTS[0]);
    });
  });

  describe('list', () => {
    it('should list plans with the default limit and map them', async () => {
      client.listPlans.mockReturnValue(
        createRecurlyPager(RECURLY_FIXTURES.PLANS),
      );

      const result = await products.list();

      expect(client.listPlans).toHaveBeenCalledWith({
        params: { limit: 100 },
      });
      expect(result).toEqual(RECURLY_FIXTURES.EXPECTED_PRODUCTS);
    });

    it('should translate the active filter into a plan state', async () => {
      client.listPlans.mockReturnValue(createRecurlyPager([]));

      await products.list({ active: false });

      expect(client.listPlans).toHaveBeenCalledWith({
        params: { limit: 100, state: 'inactive' },
      });
    });

    it('should stop reading pages once the limit is reached', async () => {
      client.listPlans.mockReturnValue(
        createRecurlyPager(RECURLY_FIXTURES.PLANS),
      );

      const result = await products.list({ limit: 1 });

      expect(result).toEqual([RECURLY_FIXTURES.EXPECTED_PRODUCTS[0]]);
    });
  });
});
