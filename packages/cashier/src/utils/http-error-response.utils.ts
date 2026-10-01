import { CashierError } from '../errors/cashier.error';
import { CashierErrorCode } from '../errors/cashier-error-code';
import { PaymentFailedError } from '../errors/payment-failed.error';

export interface CashierHttpErrorBody {
  code: CashierErrorCode;
  message: string;
  declineCode?: string;
}

export interface CashierHttpError {
  status: number;
  body: CashierHttpErrorBody;
}

const HTTP_STATUS_BY_CODE: Record<CashierErrorCode, number> = {
  not_found: 404,
  validation: 422,
  payment_failed: 402,
  payment_method: 402,
  subscription: 409,
  conflict: 409,
  rate_limit: 429,
  unsupported_operation: 501,
  authentication: 500,
  authorization: 500,
  provider: 502,
};

const INTERNAL_ERROR_CODES: ReadonlySet<CashierErrorCode> = new Set([
  'authentication',
  'authorization',
  'provider',
]);

export const INTERNAL_ERROR_MESSAGE = 'The billing provider request failed';

export const getHttpStatus = (error: CashierError): number =>
  HTTP_STATUS_BY_CODE[error.code];

export const toHttpError = (error: CashierError): CashierHttpError => ({
  status: getHttpStatus(error),
  body: {
    code: error.code,
    message: INTERNAL_ERROR_CODES.has(error.code)
      ? INTERNAL_ERROR_MESSAGE
      : error.message,
    ...(error instanceof PaymentFailedError && error.declineCode
      ? { declineCode: error.declineCode }
      : {}),
  },
});
