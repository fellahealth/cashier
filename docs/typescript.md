# TypeScript

`@aios-medical/cashier` works on its own in any Node.js or TypeScript project. The [NestJS](nestjs.md) and [Express](express.md) packages are thin layers on top of it.

```bash
npm install @aios-medical/cashier stripe recurly
```

## Create a Cashier

Configure your providers once and create one Cashier for your app:

```ts
import { createCashier } from '@aios-medical/cashier';

export const cashier = createCashier({
  default: 'stripe',
  providers: {
    stripe: { apiKey: process.env.STRIPE_SECRET_KEY! },
    recurly: { apiKey: process.env.RECURLY_API_KEY! },
  },
});
```

| Option      | Type                                                            | Description                                                                  |
| ----------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `default`   | `'stripe' \| 'recurly'`                                         | The provider `use()` returns. Optional when only one provider is configured. |
| `providers` | `{ stripe?: { apiKey: string }, recurly?: { apiKey: string } }` | The providers your app uses. Each one needs a non-empty `apiKey`.            |

`createCashier(config)` is the same as `new Cashier(config)`. Both config options are optional. With no config at all, pass the API key to every `use` call, as shown below.

Cashier checks the config when it is created. An empty `apiKey` throws `AuthenticationError`, and a `default` that is not in `providers` throws `ValidationError`, so a missing environment variable fails at startup instead of on the first payment.

## Get a driver with `use`

`use` returns a driver. A driver has the `customers`, `invoices`, `products`, `prices` and `subscriptions` resources described in the [API reference](README.md#api-reference).

```ts
await cashier.use().subscriptions.create({
  customer: 'cus_123',
  price: 'price_123',
  currency: 'USD',
});

await cashier.use('recurly').invoices.list({ customer: 'code-customer-42' });

await cashier
  .use('stripe', { apiKey: tenant.stripeApiKey })
  .customers.get('cus_456');
```

| Call                        | Returns                                               |
| --------------------------- | ----------------------------------------------------- |
| `use()`                     | The driver for the `default` provider.                |
| `use('recurly')`            | The driver for a provider in `providers`.             |
| `use('stripe', { apiKey })` | A driver for any API key, for example one per tenant. |

`cashier.defaultProvider` tells you which provider `use()` returns, or `null` when there is no default.

| Mistake                                             | Error                 |
| --------------------------------------------------- | --------------------- |
| `use()` without a default provider                  | `ValidationError`     |
| `use('recurly')` when Recurly is not in `providers` | `ValidationError`     |
| `use('stripe', { apiKey: '' })`                     | `AuthenticationError` |

You can call `use` on every request. Cashier keeps the drivers it creates and returns the same one for the same provider and API key. See [API keys and providers](api-keys.md) for details.

## The shared instance

`cashier`, exported by the package, is a shared Cashier with no config. It is handy for scripts:

```ts
import { cashier } from '@aios-medical/cashier';

const billing = cashier.use('stripe', {
  apiKey: process.env.STRIPE_SECRET_KEY!,
});
```

In an application, prefer your own `createCashier(...)` so the config lives in one place and tests can replace it.

## Passing Cashier to your classes

Give your classes the Cashier instead of importing it, so tests can pass a fake:

```ts
import { Cashier, Subscription } from '@aios-medical/cashier';

export class BillingService {
  constructor(private readonly cashier: Cashier) {}

  getSubscription(subscriptionId: string): Promise<Subscription> {
    return this.cashier.use().subscriptions.get(subscriptionId);
  }
}

const billing = new BillingService(cashier);
```

## Testing

Every method returns a promise, so a fake driver is a plain object with `jest.fn()` methods:

```ts
import { Cashier, CashierDriver } from '@aios-medical/cashier';

const driver = {
  provider: 'stripe',
  subscriptions: { get: jest.fn().mockResolvedValue(subscription) },
} as unknown as CashierDriver;

const fakeCashier = { use: () => driver } as unknown as Cashier;

const billing = new BillingService(fakeCashier);
```

## Handling errors

Every method rejects with a subclass of `CashierError`. See [Errors](errors.md) for the full list and for `toHttpError`, which turns an error into an HTTP status and response body.
