# Drivers and conventions

## Creating a driver

```ts
import { createCashier } from '@aios-medical/cashier';

const cashier = createCashier({
  default: 'stripe',
  providers: { stripe: { apiKey: process.env.STRIPE_SECRET_KEY! } },
});

const driver = cashier.use();
```

`use()` returns a `CashierDriver` for the default provider, `use('recurly')` for a configured provider, and `use('stripe', { apiKey })` for any API key. Drivers are created once and reused. See [TypeScript](typescript.md) for every option and [API keys and providers](api-keys.md) for choosing between them.

On Stripe the SDK is created with API version `2023-08-16`, the version the mappers are written for.

## What a driver has

| Property        | Type                    | Reference                         |
| --------------- | ----------------------- | --------------------------------- |
| `provider`      | `'stripe' \| 'recurly'` | The provider behind the driver.   |
| `customers`     | `CustomersResource`     | [Customers](customers.md)         |
| `invoices`      | `InvoicesResource`      | [Invoices](invoices.md)           |
| `products`      | `ProductsResource`      | [Products](products.md)           |
| `prices`        | `PricesResource`        | [Prices](prices.md)               |
| `subscriptions` | `SubscriptionsResource` | [Subscriptions](subscriptions.md) |

Every method returns a promise. When it fails, it rejects with a subclass of `CashierError`. See [Errors](errors.md).

## How providers map to Cashier

| Cashier      | Stripe       | Recurly                                        |
| ------------ | ------------ | ---------------------------------------------- |
| Customer     | Customer     | Account                                        |
| Invoice      | Invoice      | Invoice                                        |
| Product      | Product      | Plan                                           |
| Price        | Price        | Not available. Pricing is defined on the plan. |
| Subscription | Subscription | Subscription, with a single item for its plan  |

## Conventions

- **Amounts** (`subtotal`, `tax`, `total`, `unitAmount`) are integers in the currency's minor unit, for example `14999` for USD 149.99 and `5000` for JPY 5000. Recurly returns major units, and Cashier converts them using the currency's number of decimal places.
- **Currencies** are uppercase ISO 4217 codes such as `USD`.
- **Timestamps** are `Date` objects.
- **Metadata** is a `Record<string, string>`. On Recurly it is read from and written to custom fields.
- **Unknown states** from a provider are returned as `status: 'unknown'` instead of failing.
- **`provider`** is set on every returned object, so you always know where it came from.

## Recurly ids and codes

Recurly methods that take an id also accept a code with the `code-` prefix, as the Recurly API does:

- `code-customer-42` is the account with code `customer-42`.
- `code-pro-monthly` is the plan with code `pro-monthly`.

## Pagination and limits

Every `list` method takes an optional `limit`, which defaults to `100`.

| Provider | Behavior                                                                      |
| -------- | ----------------------------------------------------------------------------- |
| Stripe   | Returns a single page of up to `limit` results. Stripe accepts at most 100.   |
| Recurly  | Reads pages until `limit` results are collected. Recurly accepts at most 200. |

## TypeScript

The package exports every type it uses: `CashierDriver`, `CashierProvider`, `CashierProviderOptions`, the resource interfaces (`CustomersResource`, `InvoicesResource`, `ProductsResource`, `PricesResource`, `SubscriptionsResource`), the result types (`Customer`, `Invoice`, `Product`, `Price`, `Subscription`) and the parameter types such as `CreateSubscriptionParams`.
