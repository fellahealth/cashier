import {
  CashierConfig,
  CashierDriver,
  CashierProvider,
  CashierProviderOptions,
  CashierProvidersConfig,
} from './types/cashier.types';
import { AuthenticationError } from './errors/authentication.error';
import { ValidationError } from './errors/validation.error';
import { DRIVER_CACHE_SIZE } from './constants/cashier.constants';
import { createDriver } from './drivers/create-driver';
import { DriverCache, toDriverCacheKey } from './utils/driver-cache.utils';

const getConfiguredProviders = (
  providers: CashierProvidersConfig,
): CashierProvider[] =>
  (Object.keys(providers) as CashierProvider[]).filter(
    (provider) => providers[provider] !== undefined,
  );

const assertApiKey = (provider: CashierProvider, apiKey: string): void => {
  if (!apiKey) {
    throw new AuthenticationError(`An api key is required to use ${provider}`, {
      provider,
    });
  }
};

const resolveDefaultProvider = (
  config: CashierConfig,
  configuredProviders: CashierProvider[],
): CashierProvider | null => {
  if (config.default) return config.default;

  const [onlyProvider, ...otherProviders] = configuredProviders;

  return onlyProvider && otherProviders.length === 0 ? onlyProvider : null;
};

export class Cashier {
  readonly defaultProvider: CashierProvider | null;
  private readonly providers: CashierProvidersConfig;
  private readonly drivers = new DriverCache(DRIVER_CACHE_SIZE);

  constructor(config: CashierConfig = {}) {
    this.providers = config.providers ?? {};

    const configuredProviders = getConfiguredProviders(this.providers);

    for (const provider of configuredProviders) {
      assertApiKey(provider, this.providers[provider]?.apiKey ?? '');
    }

    this.defaultProvider = resolveDefaultProvider(config, configuredProviders);

    if (this.defaultProvider && !this.providers[this.defaultProvider]) {
      throw new ValidationError(
        `The default provider "${this.defaultProvider}" is not configured in providers`,
        { provider: this.defaultProvider },
      );
    }
  }

  use(): CashierDriver;
  use(provider: CashierProvider): CashierDriver;
  use<Provider extends CashierProvider>(
    provider: Provider,
    options: CashierProviderOptions[Provider],
  ): CashierDriver;
  use(
    provider?: CashierProvider,
    options?: CashierProviderOptions[CashierProvider],
  ): CashierDriver {
    const name = provider ?? this.defaultProvider;

    if (!name) {
      throw new ValidationError(
        'No default provider is configured. Pass a provider to use() or set "default" in the Cashier config',
      );
    }

    const resolvedOptions = options ?? this.providers[name];

    if (!resolvedOptions) {
      throw new ValidationError(
        `The ${name} provider is not configured. Add it to "providers" in the Cashier config or pass its options to use()`,
        { provider: name },
      );
    }

    assertApiKey(name, resolvedOptions.apiKey);

    return this.drivers.get(
      toDriverCacheKey(name, resolvedOptions.apiKey),
      () => createDriver(name, resolvedOptions.apiKey),
    );
  }
}

export const createCashier = (config?: CashierConfig): Cashier =>
  new Cashier(config);

export const cashier = new Cashier();
