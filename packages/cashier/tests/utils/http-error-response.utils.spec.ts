import {
  INTERNAL_ERROR_MESSAGE,
  getHttpStatus,
  toHttpError,
} from '../../src/utils/http-error-response.utils';
import { AuthenticationError } from '../../src/errors/authentication.error';
import { AuthorizationError } from '../../src/errors/authorization.error';
import { CashierError } from '../../src/errors/cashier.error';
import { ConflictError } from '../../src/errors/conflict.error';
import { NotFoundError } from '../../src/errors/not-found.error';
import { PaymentFailedError } from '../../src/errors/payment-failed.error';
import { PaymentMethodError } from '../../src/errors/payment-method.error';
import { ProviderError } from '../../src/errors/provider.error';
import { RateLimitError } from '../../src/errors/rate-limit.error';
import { SubscriptionError } from '../../src/errors/subscription.error';
import { UnsupportedOperationError } from '../../src/errors/unsupported-operation.error';
import { ValidationError } from '../../src/errors/validation.error';

describe('getHttpStatus', () => {
  it.each<[CashierError, number]>([
    [new NotFoundError('missing'), 404],
    [new ValidationError('invalid'), 422],
    [new PaymentFailedError('declined'), 402],
    [new PaymentMethodError('expired'), 402],
    [new SubscriptionError('immutable'), 409],
    [new ConflictError('busy'), 409],
    [new RateLimitError('slow down'), 429],
    [new UnsupportedOperationError('no prices'), 501],
    [new AuthenticationError('bad key'), 500],
    [new AuthorizationError('forbidden'), 500],
    [new ProviderError('down'), 502],
  ])('should map %s to %i', (error, status) => {
    expect(getHttpStatus(error)).toBe(status);
  });
});

describe('toHttpError', () => {
  it('should return the status, code and message of a client error', () => {
    expect(toHttpError(new NotFoundError('Invoice in_1 not found'))).toEqual({
      status: 404,
      body: { code: 'not_found', message: 'Invoice in_1 not found' },
    });
  });

  it('should include the decline code of a failed payment', () => {
    expect(
      toHttpError(
        new PaymentFailedError('Card declined', {
          declineCode: 'insufficient_funds',
        }),
      ),
    ).toEqual({
      status: 402,
      body: {
        code: 'payment_failed',
        message: 'Card declined',
        declineCode: 'insufficient_funds',
      },
    });
  });

  it.each([
    new AuthenticationError('Invalid API Key provided: sk_test_****'),
    new AuthorizationError('Restricted key'),
    new ProviderError('socket hang up'),
  ])('should hide the provider message of %s', (error) => {
    expect(toHttpError(error).body).toEqual({
      code: error.code,
      message: INTERNAL_ERROR_MESSAGE,
    });
  });
});
