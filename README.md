# Cashier

[![npm](https://img.shields.io/npm/v/@aios-medical/cashier.svg)](https://www.npmjs.com/package/@aios-medical/cashier)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/fellahealth/cashier/blob/main/LICENSE)

Unified subscription billing for Node.js and TypeScript. One API across payment providers, with typed errors and NestJS and Express support. Stripe and Recurly are supported today.

Cashier wraps the official `stripe` and `recurly` Node.js clients behind one set of methods and types. Your code asks for a driver, calls `driver.subscriptions.create(...)`, and gets back the same `Subscription` shape whichever provider is behind it. Provider errors are turned into a small set of typed errors, so you can handle a declined card or a missing customer the same way on both.

- One interface for Stripe and Recurly, so you can switch providers or run both.
- Consistent results: amounts in minor units (cents), uppercase ISO 4217 currency codes, `Date` objects for timestamps.
- Typed errors such as `NotFoundError`, `PaymentFailedError` and `RateLimitError`, with the original provider error kept as `cause`.
- Works from CommonJS and ES modules, with TypeScript types included.
- First-class NestJS (`CashierModule.forRoot`, injectable `CashierService`) and Express (`req.cashier`, error handler) packages.
- Switch providers with one config value, or pass a different API key per tenant.
- No runtime dependencies besides the provider clients you install yourself.

## Packages

| Package                                                                                        | Use it for                                                                              |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [`@aios-medical/cashier`](https://www.npmjs.com/package/@aios-medical/cashier)                 | The core library. Works in any Node.js or TypeScript project.                           |
| [`@aios-medical/cashier-nestjs`](https://www.npmjs.com/package/@aios-medical/cashier-nestjs)   | NestJS module with `forRoot`, `forRootAsync`, `CashierService` and an exception filter. |
| [`@aios-medical/cashier-express`](https://www.npmjs.com/package/@aios-medical/cashier-express) | Express middleware for `req.cashier` and an error handler.                              |

All packages are released together with the same version.

## Install

```bash
npm install @aios-medical/cashier stripe recurly
```

`stripe` (v13) and `recurly` (v4.67 or later) are peer dependencies. Install both, since Cashier loads both clients. Node.js 20 or later is required.

## Quick start

```ts
import { createCashier, PaymentFailedError } from '@aios-medical/cashier';

const cashier = createCashier({
  default: 'stripe',
  providers: {
    stripe: { apiKey: process.env.STRIPE_SECRET_KEY! },
    recurly: { apiKey: process.env.RECURLY_API_KEY! },
  },
});

const customer = await cashier.use().customers.create({
  email: 'jane@example.com',
  firstName: 'Jane',
  lastName: 'Doe',
});

try {
  const subscription = await cashier.use().subscriptions.create({
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

`use` picks the provider for each call:

| Call                                | Driver                                                           |
| ----------------------------------- | ---------------------------------------------------------------- |
| `cashier.use()`                     | The `default` provider. Switch providers by changing the config. |
| `cashier.use('recurly')`            | A provider from `providers`.                                     |
| `cashier.use('stripe', { apiKey })` | Any API key, for example one per tenant.                         |

Drivers are created once and reused, so calling `use` on every request is cheap. See [API keys and providers](https://github.com/fellahealth/cashier/blob/main/docs/api-keys.md).

## Use with

### TypeScript

The core package is all you need. Pass the Cashier to your classes so tests can replace it. See [TypeScript](https://github.com/fellahealth/cashier/blob/main/docs/typescript.md).

### NestJS

```bash
npm install @aios-medical/cashier-nestjs
```

```ts
@Module({
  imports: [
    CashierModule.forRootAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        default: 'stripe',
        providers: {
          stripe: { apiKey: config.getOrThrow('STRIPE_SECRET_KEY') },
        },
      }),
    }),
  ],
  providers: [{ provide: APP_FILTER, useClass: CashierExceptionFilter }],
})
export class AppModule {}

@Injectable()
export class BillingService {
  constructor(private readonly cashier: CashierService) {}

  getInvoice(invoiceId: string) {
    return this.cashier.use().invoices.get(invoiceId);
  }
}
```

See [NestJS](https://github.com/fellahealth/cashier/blob/main/docs/nestjs.md).

### Express

```bash
npm install @aios-medical/cashier-express
```

```ts
app.use(cashierMiddleware(cashier));

app.get('/invoices/:id', async (req, res) => {
  res.json(await req.cashier.use().invoices.get(req.params.id));
});

app.use(cashierErrorHandler());
```

See [Express](https://github.com/fellahealth/cashier/blob/main/docs/express.md).

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
- [Errors](https://github.com/fellahealth/cashier/blob/main/docs/errors.md): every error class, how provider errors are mapped, and the HTTP responses.
- [TypeScript](https://github.com/fellahealth/cashier/blob/main/docs/typescript.md), [NestJS](https://github.com/fellahealth/cashier/blob/main/docs/nestjs.md) and [Express](https://github.com/fellahealth/cashier/blob/main/docs/express.md): setup and testing for each.
- [API keys and providers](https://github.com/fellahealth/cashier/blob/main/docs/api-keys.md): one default provider, several providers, or a key per tenant.

## Errors

Every method rejects with a subclass of `CashierError`, such as `NotFoundError`, `PaymentFailedError` or `RateLimitError`. Each error has a `code`, the `provider`, the provider's HTTP status and error code, and the original error as `cause`. See [Errors](https://github.com/fellahealth/cashier/blob/main/docs/errors.md) for the full list.

```ts
import { NotFoundError } from '@aios-medical/cashier';

try {
  await cashier.use().customers.get('cus_123');
} catch (error) {
  if (error instanceof NotFoundError) return null;
  throw error;
}
```

## Contributing

See [CONTRIBUTING.md](https://github.com/fellahealth/cashier/blob/main/CONTRIBUTING.md). To report a security issue, see [SECURITY.md](https://github.com/fellahealth/cashier/blob/main/SECURITY.md).

## License

[MIT](https://github.com/fellahealth/cashier/blob/main/LICENSE) © AIOS
