import * as recurly from 'recurly';
import {
  ListProductsParams,
  Product,
  ProductsResource,
} from '../../../types/product.types';
import { DEFAULT_LIST_LIMIT } from '../../../constants/cashier.constants';
import { mapRecurlyPlan } from '../mappers/recurly-plan.mapper';
import { recurlyRequest } from '../recurly-request';

const toRecurlyPlanState = (active: boolean): string =>
  active ? 'active' : 'inactive';

export class RecurlyProductsResource implements ProductsResource {
  constructor(private readonly client: recurly.Client) {}

  get(productId: string): Promise<Product> {
    return recurlyRequest(async () =>
      mapRecurlyPlan(await this.client.getPlan(productId)),
    );
  }

  list({
    active,
    limit = DEFAULT_LIST_LIMIT,
  }: ListProductsParams = {}): Promise<Product[]> {
    return recurlyRequest(async () => {
      const pager = this.client.listPlans({
        params: {
          limit,
          ...(active !== undefined
            ? { state: toRecurlyPlanState(active) }
            : {}),
        },
      });

      const products: Product[] = [];

      for await (const plan of pager.each()) {
        products.push(mapRecurlyPlan(plan));

        if (products.length >= limit) break;
      }

      return products;
    });
  }
}
