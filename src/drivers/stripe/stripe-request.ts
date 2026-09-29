import { withErrorMapping } from '../../utils/with-error-mapping.utils';
import { mapStripeError } from './stripe-error.mapper';

export const stripeRequest = <Result>(
  request: () => Promise<Result>,
): Promise<Result> => withErrorMapping(request, mapStripeError);
