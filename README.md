# Cashier

[![npm](https://img.shields.io/npm/v/@aios-medical/cashier.svg)](https://www.npmjs.com/package/@aios-medical/cashier)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/fellahealth/cashier/blob/main/LICENSE)

Unified subscription billing for Node.js and TypeScript. One API across payment providers, with typed errors and NestJS support. Stripe and Recurly are supported today.

Cashier wraps the official `stripe` and `recurly` Node.js clients behind one set of methods and types. Your code asks for a driver, calls `driver.subscriptions.create(...)`, and gets back the same `Subscription` shape whichever provider is behind it. Provider errors are turned into a small set of typed errors, so you can handle a declined card or a missing customer the same way on both.

- One interface for Stripe and Recurly, so you can switch providers or run both.
- Consistent results: amounts in minor units (cents), uppercase ISO 4217 currency codes, `Date` objects for timestamps.
- Typed errors such as `NotFoundError`, `PaymentFailedError` and `RateLimitError`, with the original provider error kept as `cause`.
- Works from CommonJS and ES modules, with TypeScript types included.
- Fits NestJS and other dependency injection containers: register `new Cashier()` as a provider and inject it. See [Dependency injection](https://github.com/fellahealth/cashier/blob/main/docs/dependency-injection.md).
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

## Documentation

Every resource works the same way on each provider. The full reference, with parameters, provider behavior and returned objects, is in [`docs/`](https://github.com/fellahealth/cashier/blob/main/docs/README.md).

| Resource                                                                                | Methods                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Customers](https://github.com/fellahealth/cashier/blob/main/docs/customers.md)         | [`get`](https://github.com/fellahealth/cashier/blob/main/docs/customers.md#customersgetcustomerid), [`list`](https://github.com/fellahealth/cashier/blob/main/docs/customers.md#customerslistparams), [`create`](https://github.com/fellahealth/cashier/blob/main/docs/customers.md#customerscreateparams), [`update`](https://github.com/fellahealth/cashier/blob/main/docs/customers.md#customersupdatecustomerid-params)                                                            |
| [Invoices](https://github.com/fellahealth/cashier/blob/main/docs/invoices.md)           | [`get`](https://github.com/fellahealth/cashier/blob/main/docs/invoices.md#invoicesgetinvoiceid), [`list`](https://github.com/fellahealth/cashier/blob/main/docs/invoices.md#invoiceslistparams), [`pay`](https://github.com/fellahealth/cashier/blob/main/docs/invoices.md#invoicespayinvoiceid-params), [`void`](https://github.com/fellahealth/cashier/blob/main/docs/invoices.md#invoicesvoidinvoiceid)                                                                             |
| [Products](https://github.com/fellahealth/cashier/blob/main/docs/products.md)           | [`get`](https://github.com/fellahealth/cashier/blob/main/docs/products.md#productsgetproductid), [`list`](https://github.com/fellahealth/cashier/blob/main/docs/products.md#productslistparams)                                                                                                                                                                                                                                                                                        |
| [Prices](https://github.com/fellahealth/cashier/blob/main/docs/prices.md)               | [`get`](https://github.com/fellahealth/cashier/blob/main/docs/prices.md#pricesgetpriceid), [`list`](https://github.com/fellahealth/cashier/blob/main/docs/prices.md#priceslistparams)                                                                                                                                                                                                                                                                                                  |
| [Subscriptions](https://github.com/fellahealth/cashier/blob/main/docs/subscriptions.md) | [`create`](https://github.com/fellahealth/cashier/blob/main/docs/subscriptions.md#subscriptionscreateparams), [`get`](https://github.com/fellahealth/cashier/blob/main/docs/subscriptions.md#subscriptionsgetsubscriptionid), [`update`](https://github.com/fellahealth/cashier/blob/main/docs/subscriptions.md#subscriptionsupdatesubscriptionid-params), [`cancel`](https://github.com/fellahealth/cashier/blob/main/docs/subscriptions.md#subscriptionscancelsubscriptionid-params) |

Guides:

- [Drivers and conventions](https://github.com/fellahealth/cashier/blob/main/docs/drivers.md): amounts, currencies, metadata, Recurly codes and pagination.
- [Errors](https://github.com/fellahealth/cashier/blob/main/docs/errors.md): every error class and how provider errors are mapped.
- [Dependency injection](https://github.com/fellahealth/cashier/blob/main/docs/dependency-injection.md): NestJS, plain classes and testing.

## Errors

Every method rejects with a subclass of `CashierError`, such as `NotFoundError`, `PaymentFailedError` or `RateLimitError`. Each error has a `code`, the `provider`, the provider's HTTP status and error code, and the original error as `cause`. See [Errors](https://github.com/fellahealth/cashier/blob/main/docs/errors.md) for the full list.

```ts
import { NotFoundError } from '@aios-medical/cashier';

try {
  await billing.customers.get('cus_123');
} catch (error) {
  if (error instanceof NotFoundError) return null;
  throw error;
}
```

## NestJS

Register a `Cashier` instance as a provider and inject it:

```ts
@Module({
  providers: [{ provide: Cashier, useValue: new Cashier() }, BillingService],
})
export class BillingModule {}
```

See [Dependency injection](https://github.com/fellahealth/cashier/blob/main/docs/dependency-injection.md) for a full service example and how to fake it in tests.

## Contributing

See [CONTRIBUTING.md](https://github.com/fellahealth/cashier/blob/main/CONTRIBUTING.md). To report a security issue, see [SECURITY.md](https://github.com/fellahealth/cashier/blob/main/SECURITY.md).

## License

[MIT](https://github.com/fellahealth/cashier/blob/main/LICENSE) © AIOS
