# Subscriptions

`driver.subscriptions` creates, changes and cancels subscriptions.

- [`subscriptions.create(params)`](#subscriptionscreateparams)
- [`subscriptions.get(subscriptionId)`](#subscriptionsgetsubscriptionid)
- [`subscriptions.update(subscriptionId, params)`](#subscriptionsupdatesubscriptionid-params)
- [`subscriptions.cancel(subscriptionId, params?)`](#subscriptionscancelsubscriptionid-params)
- [The `Subscription` object](#the-subscription-object)

## `subscriptions.create(params)`

Creates a subscription and returns it.

```ts
const subscription = await driver.subscriptions.create({
  customer: 'cus_123',
  price: 'price_123',
  currency: 'USD',
  quantity: 1,
  couponCode: 'WELCOME',
  trialEnd: new Date('2026-12-01T00:00:00Z'),
  metadata: { source: 'checkout' },
});
```

| Parameter       | Type                     | Description                                                             |
| --------------- | ------------------------ | ----------------------------------------------------------------------- |
| `customer`      | `string`                 | Required. The customer id.                                              |
| `price`         | `string`                 | Required. A Stripe price id, or a Recurly plan id or `code-` plan code. |
| `currency`      | `string`                 | Required. ISO 4217 code, for example `USD`.                             |
| `quantity`      | `number`                 | Defaults to `1`.                                                        |
| `paymentMethod` | `string`                 | Stripe payment method id or Recurly billing info id.                    |
| `couponCode`    | `string`                 | Coupon to apply.                                                        |
| `trialEnd`      | `Date`                   | End of the free trial.                                                  |
| `metadata`      | `Record<string, string>` | Extra key and value pairs.                                              |

| Provider | Behavior                                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Stripe   | Creates a subscription with one item for `price` and `quantity`. `paymentMethod` becomes the default payment method and `couponCode` the coupon. |
| Recurly  | Looks up the account, then creates the subscription for its code. `metadata` is saved as custom fields.                                          |

A declined first payment rejects with `PaymentFailedError` or `PaymentMethodError`. See [Errors](errors.md).

## `subscriptions.get(subscriptionId)`

Returns one subscription.

```ts
const subscription = await driver.subscriptions.get('sub_123');
```

## `subscriptions.update(subscriptionId, params)`

Changes the price, quantity or metadata and returns the updated subscription.

```ts
const subscription = await driver.subscriptions.update('sub_123', {
  price: 'price_456',
  quantity: 2,
});
```

| Parameter  | Type                     | Description                                              |
| ---------- | ------------------------ | -------------------------------------------------------- |
| `price`    | `string`                 | New Stripe price id, or Recurly plan id or `code-` code. |
| `quantity` | `number`                 | New quantity.                                            |
| `metadata` | `Record<string, string>` | Metadata to set.                                         |

| Provider | Behavior                                                                                                                               |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Stripe   | Replaces the price or quantity of the subscription's only item. A subscription with more than one item rejects with `ValidationError`. |
| Recurly  | Applies the plan or quantity change right away, then saves `metadata` as custom fields, then reads the subscription again.             |

## `subscriptions.cancel(subscriptionId, params?)`

Cancels a subscription and returns it.

```ts
await driver.subscriptions.cancel('sub_123');
await driver.subscriptions.cancel('sub_123', { atPeriodEnd: true });
```

| Parameter     | Type      | Description                                                                     |
| ------------- | --------- | ------------------------------------------------------------------------------- |
| `atPeriodEnd` | `boolean` | Keep the subscription running until the end of the period. Defaults to `false`. |

| Provider | Default                                  | `atPeriodEnd: true`                       |
| -------- | ---------------------------------------- | ----------------------------------------- |
| Stripe   | Cancels right away.                      | Cancels at the end of the current period. |
| Recurly  | Terminates right away, without a refund. | Cancels at the end of the current term.   |

## The `Subscription` object

| Field                | Type                     | Description                                       |
| -------------------- | ------------------------ | ------------------------------------------------- |
| `id`                 | `string`                 | The provider's id.                                |
| `customerId`         | `string \| null`         | The customer or account id.                       |
| `status`             | `SubscriptionStatus`     | See below.                                        |
| `items`              | `SubscriptionItem[]`     | See below.                                        |
| `currency`           | `string`                 | Uppercase ISO 4217 code.                          |
| `currentPeriodStart` | `Date \| null`           | Start of the current billing period.              |
| `currentPeriodEnd`   | `Date \| null`           | End of the current billing period.                |
| `cancelAtPeriodEnd`  | `boolean`                | Whether it ends at the end of the current period. |
| `canceledAt`         | `Date \| null`           | When it was canceled.                             |
| `trialEnd`           | `Date \| null`           | End of the free trial.                            |
| `createdAt`          | `Date`                   | When it was created.                              |
| `metadata`           | `Record<string, string>` | Stripe metadata or Recurly custom fields.         |
| `provider`           | `CashierProvider`        | The provider it came from.                        |

### Subscription items

| Field        | Type             | Description                                                |
| ------------ | ---------------- | ---------------------------------------------------------- |
| `id`         | `string \| null` | The Stripe subscription item id. Always `null` on Recurly. |
| `priceId`    | `string`         | The Stripe price id or the Recurly plan id.                |
| `quantity`   | `number`         | Quantity.                                                  |
| `unitAmount` | `number \| null` | In minor units.                                            |

Recurly subscriptions always have exactly one item.

### Subscription status

| `status`             | Stripe               | Recurly                                      |
| -------------------- | -------------------- | -------------------------------------------- |
| `active`             | `active`             | `active`, `live`, and `canceled` (see below) |
| `trialing`           | `trialing`           | `in_trial`                                   |
| `past_due`           | `past_due`           | `past_due`                                   |
| `unpaid`             | `unpaid`             |                                              |
| `paused`             | `paused`             | `paused`                                     |
| `canceled`           | `canceled`           | `expired`                                    |
| `incomplete`         | `incomplete`         |                                              |
| `incomplete_expired` | `incomplete_expired` |                                              |
| `future`             |                      | `future`                                     |
| `failed`             |                      | `failed`                                     |
| `unknown`            |                      | Any other state                              |

A Recurly subscription in the `canceled` state keeps running until the end of its term, like a Stripe subscription with `cancel_at_period_end`. Cashier returns it with `status: 'active'` and `cancelAtPeriodEnd: true`.
