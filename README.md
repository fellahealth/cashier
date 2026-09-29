# Cashier

[![npm](https://img.shields.io/npm/v/@aios-medical/cashier.svg)](https://www.npmjs.com/package/@aios-medical/cashier)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Provider-agnostic subscription billing for Node.js and TypeScript. One API across payment providers, with typed errors and NestJS support. Stripe and Recurly are supported today.

Cashier wraps the official `stripe` and `recurly` Node.js clients behind one set of methods and types. Your code asks for a driver, calls `driver.subscriptions.create(...)`, and gets back the same `Subscription` shape whichever provider is behind it. Provider errors are turned into a small set of typed errors, so you can handle a declined card or a missing customer the same way on both.

- One interface for Stripe and Recurly, so you can switch providers or run both.
- Consistent results: amounts in minor units (cents), uppercase ISO 4217 currency codes, `Date` objects for timestamps.
- Typed errors such as `NotFoundError`, `PaymentFailedError` and `RateLimitError`, with the original provider error kept as `cause`.
- Works from CommonJS and ES modules, with TypeScript types included.
- Fits NestJS and other dependency injection containers: register `new Cashier()` as a provider and inject it. See [Dependency injection](#dependency-injection).
- No runtime dependencies besides the provider clients you install yourself.

## Install

```bash
npm install @aios-medical/cashier stripe recurly
```

`stripe` (v13) and `recurly` (v4.67 or later) are peer dependencies. Install both, since Cashier loads both clients. Node.js 20 or later is required.

## Quick start

```ts
import { cashier, PaymentFailedError } from '@aios-medical/cashier';

const billing = cashier.use('stripe', {
  apiKey: process.env.STRIPE_SECRET_KEY!,
});

const customer = await billing.customers.create({
  email: 'jane@example.com',
  firstName: 'Jane',
  lastName: 'Doe',
});

try {
  const subscription = await billing.subscriptions.create({
    customer: customer.id,
    price: 'price_123',
    currency: 'USD',
  });

  console.log(subscription.status, subscription.items[0]?.unitAmount);
} catch (error) {
  if (error instanceof PaymentFailedError) {
    console.log('Payment failed', error.declineCode);
  } else {
    throw error;
  }
}
```

Switching to Recurly only changes the `use` call:

```ts
const billing = cashier.use('recurly', {
  apiKey: process.env.RECURLY_API_KEY!,
});
```

`use` creates a new provider client each time it is called. Call it once per API key and reuse the driver it returns.

On Stripe the SDK is created with API version `2023-08-16`, the version the mappers are written for.

## Drivers

A driver has a `provider` property (`'stripe'` or `'recurly'`) and five resources: `customers`, `invoices`, `products`, `prices` and `subscriptions`. Every method returns a promise. The tables below show what each method calls on each provider.

Recurly methods that take an id also accept a code with the `code-` prefix, as the Recurly API does. For example, `code-customer-42` is the account with code `customer-42` and `code-pro-monthly` is the plan with code `pro-monthly`.

### Customers

| Method                                                                              | Stripe                                                                                                                 | Recurly                                                                                                                 |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `driver.customers.get(customerId)`                                                  | Retrieves the customer. A deleted customer rejects with `NotFoundError`.                                               | Retrieves the account by id or `code-` code.                                                                            |
| `driver.customers.list({ email?, limit? })`                                         | Lists customers, optionally by email. Returns one page of up to `limit` (default 100, max 100).                        | Lists accounts, optionally by email. Reads pages until `limit` (default 100, max 200).                                  |
| `driver.customers.create({ email, code?, firstName?, lastName?, metadata? })`       | Creates a customer. `firstName` and `lastName` are joined into `name`. `code` is ignored.                              | Creates an account. `code` is required, otherwise rejects with `ValidationError`. `metadata` is saved as custom fields. |
| `driver.customers.update(customerId, { email?, firstName?, lastName?, metadata? })` | Updates the given fields. `firstName` and `lastName` must be given together, otherwise rejects with `ValidationError`. | Updates the given fields. `metadata` is saved as custom fields.                                                         |

### Invoices

| Method                                                | Stripe                                                                                                             | Recurly                                                                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `driver.invoices.get(invoiceId)`                      | Retrieves the invoice.                                                                                             | Retrieves the invoice. Amounts are converted from major to minor units.                                            |
| `driver.invoices.list({ customer, status?, limit? })` | Lists the customer's invoices. `status` can be `'paid'`. Returns one page of up to `limit` (default 100, max 100). | Lists the account's invoices. `status: 'paid'` filters by state. Reads pages until `limit` (default 100, max 200). |
| `driver.invoices.pay(invoiceId, { paymentMethod? })`  | Pays the invoice, with the given payment method or the customer's default.                                         | Collects the invoice, with the given billing info id or the account's default.                                     |
| `driver.invoices.void(invoiceId)`                     | Voids the invoice.                                                                                                 | Voids the invoice.                                                                                                 |

### Products

| Method                                      | Stripe                                                                                            | Recurly                                                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `driver.products.get(productId)`            | Retrieves the product.                                                                            | Retrieves the plan by id or `code-` code. Recurly plans are returned as products.                            |
| `driver.products.list({ active?, limit? })` | Lists products, optionally by `active`. Returns one page of up to `limit` (default 100, max 100). | Lists plans, optionally by state (`active` or `inactive`). Reads pages until `limit` (default 100, max 200). |

### Prices

| Method                                              | Stripe                                                                                                      | Recurly                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `driver.prices.get(priceId)`                        | Retrieves the price.                                                                                        | Rejects with `UnsupportedOperationError`. Recurly prices live on plans. |
| `driver.prices.list({ product?, active?, limit? })` | Lists prices, optionally by product and `active`. Returns one page of up to `limit` (default 100, max 100). | Rejects with `UnsupportedOperationError`.                               |

### Subscriptions

| Method                                                                                                                     | Stripe                                                                                                                                                           | Recurly                                                                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `driver.subscriptions.create({ customer, price, currency, quantity?, paymentMethod?, couponCode?, trialEnd?, metadata? })` | Creates a subscription with one item for `price` and `quantity` (default 1), using `paymentMethod` as the default payment method and `couponCode` as the coupon. | Looks up the account, then creates a subscription. `price` is a plan id, or a plan code with the `code-` prefix. `paymentMethod` is a billing info id and `metadata` is saved as custom fields. |
| `driver.subscriptions.get(subscriptionId)`                                                                                 | Retrieves the subscription.                                                                                                                                      | Retrieves the subscription.                                                                                                                                                                     |
| `driver.subscriptions.update(subscriptionId, { price?, quantity?, metadata? })`                                            | Updates the subscription. Changing `price` or `quantity` needs a subscription with exactly one item, otherwise rejects with `ValidationError`.                   | Changes the plan or quantity right away, updates `metadata` as custom fields, then returns the updated subscription.                                                                            |
| `driver.subscriptions.cancel(subscriptionId, { atPeriodEnd? })`                                                            | Cancels right away by default. With `atPeriodEnd: true`, cancels at the end of the current period.                                                               | Terminates right away without a refund by default. With `atPeriodEnd: true`, cancels at the end of the current term.                                                                            |

## Results

Every method returns plain objects of the types below, which are exported from the package.

| Type           | Fields                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Customer`     | `id`, `code`, `email`, `name`, `metadata`, `createdAt`, `provider`                                                                                                              |
| `Invoice`      | `id`, `number`, `customerId`, `subscriptionIds`, `billingReason`, `status`, `currency`, `subtotal`, `tax`, `total`, `createdAt`, `paidAt`, `provider`                           |
| `Product`      | `id`, `code`, `name`, `description`, `active`, `createdAt`, `provider`                                                                                                          |
| `Price`        | `id`, `productId`, `currency`, `unitAmount`, `type`, `interval`, `active`, `createdAt`, `provider`                                                                              |
| `Subscription` | `id`, `customerId`, `status`, `items`, `currency`, `currentPeriodStart`, `currentPeriodEnd`, `cancelAtPeriodEnd`, `canceledAt`, `trialEnd`, `createdAt`, `metadata`, `provider` |

A few things work the same on both providers:

- Amounts (`subtotal`, `tax`, `total`, `unitAmount`) are integers in the currency's minor unit, for example `14999` for USD 149.99 and `5000` for JPY 5000.
- `currency` is an uppercase ISO 4217 code such as `USD`.
- `metadata` is a `Record<string, string>`. On Recurly it is read from and written to custom fields.
- Recurly subscriptions have one item, with `id: null` and the plan id as `priceId`.
- A Recurly subscription in the `canceled` state is still running until the end of its term. It is returned with `status: 'active'` and `cancelAtPeriodEnd: true`. An `expired` Recurly subscription is returned with `status: 'canceled'`.
- States that Cashier does not know are returned as `status: 'unknown'`.

## Errors

Every method rejects with a subclass of `CashierError`. Raw Stripe or Recurly errors are never thrown directly.

| Error                       | `code`                  | When                                                                                                                    |
| --------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `NotFoundError`             | `not_found`             | The customer, invoice, product, price or subscription does not exist, or the Stripe customer was deleted.               |
| `AuthenticationError`       | `authentication`        | The API key is missing or invalid.                                                                                      |
| `AuthorizationError`        | `authorization`         | The API key is valid but not allowed to perform the request.                                                            |
| `ValidationError`           | `validation`            | The request has invalid or missing parameters, from the provider or from Cashier's own checks.                          |
| `PaymentFailedError`        | `payment_failed`        | A charge was declined or payment is required. `declineCode` holds the provider's decline code when there is one.        |
| `PaymentMethodError`        | `payment_method`        | The card or payment method is invalid, for example an expired card, a wrong CVC or an invalid token.                    |
| `SubscriptionError`         | `subscription`          | The subscription cannot be changed in its current state.                                                                |
| `RateLimitError`            | `rate_limit`            | The provider is rate limiting requests.                                                                                 |
| `ConflictError`             | `conflict`              | The request conflicts with another one, for example an idempotency key reuse, a lock timeout or a simultaneous request. |
| `UnsupportedOperationError` | `unsupported_operation` | The provider does not support the operation, for example prices on Recurly.                                             |
| `ProviderError`             | `provider`              | Anything else, such as provider server errors and network failures.                                                     |

Every error has these properties:

| Property         | Type                                 | Description                                            |
| ---------------- | ------------------------------------ | ------------------------------------------------------ |
| `name`           | `string`                             | The class name, for example `NotFoundError`.           |
| `message`        | `string`                             | The provider's message, or Cashier's own message.      |
| `code`           | `CashierErrorCode`                   | One of the codes in the table above.                   |
| `provider`       | `'stripe' \| 'recurly' \| undefined` | The provider that failed.                              |
| `providerStatus` | `number \| undefined`                | The HTTP status from the provider.                     |
| `providerCode`   | `string \| undefined`                | The provider's error code, such as `resource_missing`. |
| `cause`          | `unknown`                            | The original error from the provider client.           |

You can match on the class or on `code`:

```ts
import { CashierError, NotFoundError } from '@aios-medical/cashier';

try {
  await billing.customers.get('cus_123');
} catch (error) {
  if (error instanceof NotFoundError) {
    return null;
  }

  if (error instanceof CashierError && error.code === 'rate_limit') {
    await retryLater();
  }

  throw error;
}
```

## Dependency injection

`cashier` is a shared instance of the `Cashier` class. For dependency injection, create your own with `new Cashier()` and register it with your container. In tests you can then swap it for a fake that returns a mock `CashierDriver`.

With NestJS:

```ts
import { Injectable, Module } from '@nestjs/common';
import { Cashier, CashierDriver, Subscription } from '@aios-medical/cashier';

@Injectable()
export class BillingService {
  private readonly billing: CashierDriver;

  constructor(cashier: Cashier) {
    this.billing = cashier.use('stripe', {
      apiKey: process.env.STRIPE_SECRET_KEY!,
    });
  }

  getSubscription(subscriptionId: string): Promise<Subscription> {
    return this.billing.subscriptions.get(subscriptionId);
  }
}

@Module({
  providers: [{ provide: Cashier, useValue: new Cashier() }, BillingService],
  exports: [BillingService],
})
export class BillingModule {}
```

In a test, provide a fake in place of `Cashier`:

```ts
import { Test } from '@nestjs/testing';
import { Cashier, CashierDriver } from '@aios-medical/cashier';

const driver = {
  provider: 'stripe',
  subscriptions: { get: jest.fn() },
} as unknown as CashierDriver;

const moduleRef = await Test.createTestingModule({
  providers: [
    BillingService,
    { provide: Cashier, useValue: { use: () => driver } },
  ],
}).compile();
```

Without a framework, pass the instance to your constructor:

```ts
import { Cashier, CashierDriver } from '@aios-medical/cashier';

class BillingService {
  private readonly billing: CashierDriver;

  constructor(cashier: Cashier, apiKey: string) {
    this.billing = cashier.use('recurly', { apiKey });
  }
}

const service = new BillingService(new Cashier(), process.env.RECURLY_API_KEY!);
```

## TypeScript

The package exports every type it uses, including `CashierDriver`, `CashierProvider`, `CashierProviderOptions`, the resource interfaces (`CustomersResource`, `InvoicesResource`, `ProductsResource`, `PricesResource`, `SubscriptionsResource`), the result types and the parameter types such as `CreateSubscriptionParams`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). To report a security issue, see [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © AIOS
