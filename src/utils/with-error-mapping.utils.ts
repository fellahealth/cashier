import { CashierError } from '../errors/cashier.error';

export const withErrorMapping = async <Result>(
  request: () => Promise<Result>,
  mapError: (error: unknown) => CashierError,
): Promise<Result> => {
  try {
    return await request();
  } catch (error) {
    throw mapError(error);
  }
};
