import { Price, PricesResource } from '../../../types/price.types';
import { UnsupportedOperationError } from '../../../errors/unsupported-operation.error';

const createUnsupportedPricesError = (): UnsupportedOperationError =>
  new UnsupportedOperationError(
    'Recurly has no price objects; pricing is defined on the plan',
    { provider: 'recurly' },
  );

export class RecurlyPricesResource implements PricesResource {
  get(): Promise<Price> {
    return Promise.reject(createUnsupportedPricesError());
  }

  list(): Promise<Price[]> {
    return Promise.reject(createUnsupportedPricesError());
  }
}
