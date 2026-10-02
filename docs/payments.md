# Payments

`driver.payments` lists a customer's payments: the charges made against their payment method, whether they succeeded or not.

- [`payments.list(params)`](#paymentslistparams)
- [`payments.cursorPaginate(params)`](#paymentscursorpaginateparams)
- [Loading relations with `with`](#loading-relations-with-with)
- [The `Payment` object](#the-payment-object)

## `payments.list(params)`

Returns a customer's payments, newest first.

```ts
const payments = await driver.payments.list({ customer: 'cus_123' });
```

| Parameter  | Type                | Description                                                               |
| ---------- | ------------------- | ------------------------------------------------------------------------- |
| `customer` | `string`            | Required. The customer id.                                                |
| `limit`    | `number`            | Maximum number of payments. Defaults to `100`.                            |
| `with`     | `PaymentRelation[]` | Relations to load. See [Loading relations](#loading-relations-with-with). |

| Provider | Behavior                                                                                                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Stripe   | Lists the customer's PaymentIntents, the same payments the Dashboard shows. Returns one page of up to `limit` payments. The maximum is 100.                                    |
| Recurly  | Lists the account's payment transactions (`purchase` and `capture`), so refunds and card verifications are left out. Reads pages until `limit` is reached. The maximum is 200. |

## `payments.cursorPaginate(params)`

Returns one page of a customer's payments, newest first, with a cursor for the next page.

```ts
const payments = await driver.payments.cursorPaginate({
  customer: 'cus_123',
  perPage: 25,
});

const nextPayments = await driver.payments.cursorPaginate({
  customer: 'cus_123',
  perPage: 25,
  cursor: payments.nextCursor,
});
```

| Parameter  | Type                | Description                                                                         |
| ---------- | ------------------- | ----------------------------------------------------------------------------------- |
| `customer` | `string`            | Required. The customer id.                                                          |
| `perPage`  | `number`            | Number of payments per page. Defaults to `100`.                                     |
| `cursor`   | `string \| null`    | The `nextCursor` of the previous page. Leave it out, or pass `null`, for the first. |
| `with`     | `PaymentRelation[]` | Relations to load. See [Loading relations](#loading-relations-with-with).           |

It returns a `CursorPaginator<Payment>`. See [Pagination and limits](drivers.md#pagination-and-limits).

| Provider | Behavior                                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------ |
| Stripe   | Lists the customer's PaymentIntents after the cursor, which is the id of the last payment. The maximum `perPage` is 100. |
| Recurly  | Lists the account's payment transactions with Recurly's own cursor. The maximum `perPage` is 200.                        |

## Loading relations with `with`

A payment has only its own fields by default. Pass `with` to load related data, as with Eloquent's `with`. Each relation adds one field, and costs only what it needs:

```ts
const payments = await cashier
  .use(CashierProvider.Stripe)
  .payments.cursorPaginate({
    customer: 'cus_123',
    perPage: 25,
    with: ['refunds', 'dispute', 'subscription'],
  });

payments.data[0].amountRefunded;
payments.data[0].dispute;
```

| Relation       | Adds             | Stripe                          | Recurly                                                                                 |
| -------------- | ---------------- | ------------------------------- | --------------------------------------------------------------------------------------- |
| `refunds`      | `amountRefunded` | Expands `latest_charge`         | One more request for the account's refunds, only when a payment on the page is refunded |
| `dispute`      | `dispute`        | Expands `latest_charge.dispute` | Not available                                                                           |
| `receipt`      | `receiptUrl`     | Expands `latest_charge`         | Not available                                                                           |
| `reversal`     | `reversed`       | Expands `latest_charge.refunds` | Not available                                                                           |
| `subscription` | `subscription`   | Expands `invoice.subscription`  | No extra cost                                                                           |

Stripe expansions are part of the same request, so they make the response bigger but add no requests. On Recurly, the refunds request lists the account's `refund` transactions created since the oldest refunded payment on the page.

The relations each provider supports are typed in `CashierPaymentRelations`, so the compiler only accepts what the driver can load:

| Driver                                              | Accepted relations                                               |
| --------------------------------------------------- | ---------------------------------------------------------------- |
| `cashier.use(CashierProvider.Stripe)`               | `refunds`, `dispute`, `receipt`, `reversal`, `subscription`      |
| `cashier.use(CashierProvider.Recurly)`              | `refunds`, `subscription`                                        |
| `cashier.use()`, or `use(provider)` with a variable | The relations every provider supports: `refunds`, `subscription` |

The result type only has the fields you loaded, so reading `receiptUrl` without `with: ['receipt']` does not compile. When a relation reaches a driver that cannot load it, for example from plain JavaScript, the call rejects with `UnsupportedOperationError` before any request is made.

## The `Payment` object

| Field         | Type              | Description                                 |
| ------------- | ----------------- | ------------------------------------------- |
| `id`          | `string`          | The provider's id.                          |
| `customerId`  | `string \| null`  | The customer or account id.                 |
| `invoiceId`   | `string \| null`  | The invoice it paid, when there is one.     |
| `status`      | `PaymentStatus`   | See below.                                  |
| `amount`      | `number`          | In minor units.                             |
| `currency`    | `string`          | Uppercase ISO 4217 code.                    |
| `description` | `string \| null`  | The payment's description, when it has one. |
| `createdAt`   | `Date`            | When the payment was created.               |
| `provider`    | `CashierProvider` | The provider it came from.                  |

These fields are added by `with`:

| Field            | Type                          | Relation       | Stripe                                                                                  | Recurly                                                                                                          |
| ---------------- | ----------------------------- | -------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `amountRefunded` | `number`                      | `refunds`      | The latest charge's `amount_refunded`                                                   | The sum of the account's successful and pending `refund` transactions whose original transaction is this payment |
| `dispute`        | `PaymentDispute \| null`      | `dispute`      | The latest charge's dispute                                                             |                                                                                                                  |
| `receiptUrl`     | `string \| null`              | `receipt`      | The latest charge's `receipt_url`                                                       |                                                                                                                  |
| `reversed`       | `boolean`                     | `reversal`     | `true` when one of the latest charge's refunds has the card destination type `reversal` |                                                                                                                  |
| `subscription`   | `PaymentSubscription \| null` | `subscription` | The invoice's subscription, with its `status` and `cancelAt`                            | The transaction's first subscription id, with `status` and `cancelAt` set to `null`                              |

Amounts are in minor units. `amountRefunded` is `0` when nothing was refunded.

### Payment status

| `status`     | Stripe                                                                                                                | Recurly                                |
| ------------ | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `succeeded`  | `succeeded`                                                                                                           | `success`                              |
| `pending`    | `processing`, `requires_capture`                                                                                      | `pending`, `processing`, `scheduled`   |
| `incomplete` | `requires_payment_method`, `requires_confirmation`, `requires_action`                                                 |                                        |
| `failed`     | `requires_payment_method` after a declined attempt (`last_payment_error` is set), which the Dashboard shows as Failed | `declined`, `error`                    |
| `canceled`   | `canceled`                                                                                                            | `void`                                 |
| `unknown`    | Any other status                                                                                                      | Any other status, such as `chargeback` |

### The `PaymentDispute` object

| Field           | Type                   | Description                                                                                                                                                            |
| --------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`            | `string`               | The provider's id.                                                                                                                                                     |
| `status`        | `PaymentDisputeStatus` | Stripe's status: `warning_needs_response`, `warning_under_review`, `warning_closed`, `needs_response`, `under_review`, `won` or `lost`. Any other status is `unknown`. |
| `reason`        | `string`               | The provider's reason, for example `fraudulent`.                                                                                                                       |
| `createdAt`     | `Date`                 | When the dispute was opened.                                                                                                                                           |
| `evidenceDueBy` | `Date \| null`         | When evidence is due.                                                                                                                                                  |

### The `PaymentSubscription` object

| Field      | Type                         | Description                                                                                                          |
| ---------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `id`       | `string`                     | The subscription id.                                                                                                 |
| `status`   | `SubscriptionStatus \| null` | The subscription's status. See [Subscriptions](subscriptions.md). `null` when the provider does not return it.       |
| `cancelAt` | `Date \| null`               | When the subscription is scheduled to cancel: Stripe's `cancel_at`, or the period end when it cancels at period end. |
