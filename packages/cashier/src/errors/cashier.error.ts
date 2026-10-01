import { CashierProvider } from '../types/cashier.types';
import { CashierErrorCode } from './cashier-error-code';

export interface CashierErrorDetails {
  provider?: CashierProvider;
  providerStatus?: number;
  providerCode?: string;
  cause?: unknown;
}

export abstract class CashierError extends Error {
  abstract readonly code: CashierErrorCode;
  readonly provider?: CashierProvider;
  readonly providerStatus?: number;
  readonly providerCode?: string;
  readonly cause?: unknown;

  constructor(message: string, details: CashierErrorDetails = {}) {
    super(message);
    this.name = new.target.name;
    this.provider = details.provider;
    this.providerStatus = details.providerStatus;
    this.providerCode = details.providerCode;
    this.cause = details.cause;
  }
}
