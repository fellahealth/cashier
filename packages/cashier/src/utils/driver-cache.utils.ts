import { createHash } from 'crypto';
import { CashierDriver, CashierProvider } from '../types/cashier.types';

export const toDriverCacheKey = (
  provider: CashierProvider,
  apiKey: string,
): string => `${provider}:${createHash('sha256').update(apiKey).digest('hex')}`;

export class DriverCache {
  private readonly drivers = new Map<string, CashierDriver>();

  constructor(private readonly maxSize: number) {}

  get(key: string, create: () => CashierDriver): CashierDriver {
    const cached = this.drivers.get(key);

    if (cached) {
      this.drivers.delete(key);
      this.drivers.set(key, cached);

      return cached;
    }

    const driver = create();

    this.drivers.set(key, driver);

    if (this.drivers.size > this.maxSize) {
      const [oldestKey] = this.drivers.keys();

      if (oldestKey !== undefined) this.drivers.delete(oldestKey);
    }

    return driver;
  }

  get size(): number {
    return this.drivers.size;
  }
}
