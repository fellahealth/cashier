import {
  DriverCache,
  toDriverCacheKey,
} from '../../src/utils/driver-cache.utils';
import { CashierDriver, CashierProvider } from '../../src/types/cashier.types';

const fakeDriver = (name: string) => ({ name }) as unknown as CashierDriver;

describe('DriverCache', () => {
  it('should create a driver once and reuse it', () => {
    const cache = new DriverCache(2);
    const create = jest.fn(() => fakeDriver('a'));

    expect(cache.get('a', create)).toBe(cache.get('a', create));
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('should drop the least recently used driver when full', () => {
    const cache = new DriverCache(2);
    const first = cache.get('a', () => fakeDriver('a'));

    cache.get('b', () => fakeDriver('b'));
    cache.get('a', () => fakeDriver('a2'));
    cache.get('c', () => fakeDriver('c'));

    expect(cache.size).toBe(2);
    expect(cache.get('a', () => fakeDriver('a3'))).toBe(first);

    const recreate = jest.fn(() => fakeDriver('b2'));

    cache.get('b', recreate);
    expect(recreate).toHaveBeenCalledTimes(1);
  });
});

describe('toDriverCacheKey', () => {
  it('should not contain the api key', () => {
    const key = toDriverCacheKey(CashierProvider.Stripe, 'sk_test_secret');

    expect(key).toMatch(/^stripe:[a-f0-9]{64}$/);
    expect(key).not.toContain('sk_test_secret');
  });

  it('should differ per provider and api key', () => {
    expect(toDriverCacheKey(CashierProvider.Stripe, 'key')).not.toBe(
      toDriverCacheKey(CashierProvider.Recurly, 'key'),
    );
    expect(toDriverCacheKey(CashierProvider.Stripe, 'key')).not.toBe(
      toDriverCacheKey(CashierProvider.Stripe, 'other-key'),
    );
  });
});
