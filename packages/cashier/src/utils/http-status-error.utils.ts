import { CashierError, CashierErrorDetails } from '../errors/cashier.error';
import { AuthenticationError } from '../errors/authentication.error';
import { AuthorizationError } from '../errors/authorization.error';
import { ConflictError } from '../errors/conflict.error';
import { NotFoundError } from '../errors/not-found.error';
import { PaymentFailedError } from '../errors/payment-failed.error';
import { ProviderError } from '../errors/provider.error';
import { RateLimitError } from '../errors/rate-limit.error';
import { ValidationError } from '../errors/validation.error';

export const createErrorFromHttpStatus = (
  message: string,
  details: CashierErrorDetails,
): CashierError => {
  switch (details.providerStatus) {
    case 400:
    case 422:
      return new ValidationError(message, details);
    case 401:
      return new AuthenticationError(message, details);
    case 402:
      return new PaymentFailedError(message, details);
    case 403:
      return new AuthorizationError(message, details);
    case 404:
      return new NotFoundError(message, details);
    case 409:
    case 412:
      return new ConflictError(message, details);
    case 429:
      return new RateLimitError(message, details);
    default:
      return new ProviderError(message, details);
  }
};

export const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error';
