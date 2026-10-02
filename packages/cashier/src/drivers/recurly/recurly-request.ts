import { withErrorMapping } from '../../utils/with-error-mapping.utils';
import { mapRecurlyError } from './recurly-error.mapper';

export const recurlyRequest = <Result>(
  request: () => Promise<Result>,
): Promise<Result> => withErrorMapping(request, mapRecurlyError);
