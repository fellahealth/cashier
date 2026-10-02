# Prices

`driver.prices` reads Stripe prices. Recurly has no price objects, because pricing is defined on the plan, so every method rejects with `UnsupportedOperationError` on Recurly.

- [`prices.get(priceId)`](#pricesgetpriceid)
- [`prices.list(params?)`](#priceslistparams)
- [The `Price` object](#the-price-object)

## `prices.get(priceId)`

Returns one price.

```ts
const price = await driver.prices.get('price_123');
```

| Provider | Behavior                                  |
| -------- | ----------------------------------------- |
| Stripe   | Retrieves the price.                      |
| Recurly  | Rejects with `UnsupportedOperationError`. |

## `prices.list(params?)`

Returns an array of prices.

```ts
const prices = await driver.prices.list({ product: 'prod_123', active: true });
```

| Parameter | Type      | Description                                  |
| --------- | --------- | -------------------------------------------- |
| `product` | `string`  | Only return prices of this product.          |
| `active`  | `boolean` | Only return active or inactive prices.       |
| `limit`   | `number`  | Maximum number of prices. Defaults to `100`. |

| Provider | Behavior                                                      |
| -------- | ------------------------------------------------------------- |
| Stripe   | Returns one page of up to `limit` prices. The maximum is 100. |
| Recurly  | Rejects with `UnsupportedOperationError`.                     |

## The `Price` object

| Field        | Type                        | Description                                                       |
| ------------ | --------------------------- | ----------------------------------------------------------------- |
| `id`         | `string`                    | The provider's id.                                                |
| `productId`  | `string`                    | The product this price belongs to.                                |
| `currency`   | `string`                    | Uppercase ISO 4217 code.                                          |
| `unitAmount` | `number \| null`            | In minor units. `null` for prices without a fixed amount.         |
| `type`       | `'one_time' \| 'recurring'` | Whether the price is charged once or on a schedule.               |
| `interval`   | `BillingInterval \| null`   | `{ unit, count }` for recurring prices, `null` for one-time ones. |
| `active`     | `boolean`                   | Whether the price can be used.                                    |
| `createdAt`  | `Date`                      | When it was created.                                              |
| `provider`   | `CashierProvider`           | The provider it came from.                                        |

`BillingInterval` is `{ unit: 'day' | 'week' | 'month' | 'year'; count: number }`. For example, `{ unit: 'month', count: 3 }` bills every three months.
