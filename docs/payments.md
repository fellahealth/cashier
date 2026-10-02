# Payments

`driver.payments` lists a customer's payments: the charges made against their payment method, whether they succeeded or not.

- [`payments.list(params)`](#paymentslistparams)
- [`payments.cursorPaginate(params)`](#paymentscursorpaginateparams)
- [The `Payment` object](#the-payment-object)

## `payments.list(params)`

Returns a customer's payments, newest first.

```ts
const payments = await driver.payments.list({ customer: 'cus_123' });
```

| Parameter  | Type     | Description                                    |
| ---------- | -------- | ---------------------------------------------- |
| `customer` | `string` | Required. The customer id.                     |
| `limit`    | `number` | Maximum number of payments. Defaults to `100`. |

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

| Parameter  | Type             | Description                                                                         |
| ---------- | ---------------- | ----------------------------------------------------------------------------------- |
| `customer` | `string`         | Required. The customer id.                                                          |
| `perPage`  | `number`         | Number of payments per page. Defaults to `100`.                                     |
| `cursor`   | `string \| null` | The `nextCursor` of the previous page. Leave it out, or pass `null`, for the first. |

It returns a `CursorPaginator<Payment>`. See [Pagination and limits](drivers.md#pagination-and-limits).

| Provider | Behavior                                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------ |
| Stripe   | Lists the customer's PaymentIntents after the cursor, which is the id of the last payment. The maximum `perPage` is 100. |
| Recurly  | Lists the account's payment transactions with Recurly's own cursor. The maximum `perPage` is 200.                        |

## The `Payment` object

| Field            | Type                          | Description                                               |
| ---------------- | ----------------------------- | --------------------------------------------------------- |
| `id`             | `string`                      | The provider's id.                                        |
| `customerId`     | `string \| null`              | The customer or account id.                               |
| `invoiceId`      | `string \| null`              | The invoice it paid, when there is one.                   |
| `status`         | `PaymentStatus`               | See below.                                                |
| `amount`         | `number`                      | In minor units.                                           |
| `amountRefunded` | `number`                      | In minor units. `0` when nothing was refunded.            |
| `currency`       | `string`                      | Uppercase ISO 4217 code.                                  |
| `description`    | `string \| null`              | The payment's description, when it has one.               |
| `dispute`        | `PaymentDispute \| null`      | The dispute on the payment, when there is one. See below. |
| `receiptUrl`     | `string \| null`              | The receipt page, when the provider has one.              |
| `reversed`       | `boolean`                     | `true` when a refund went back to the card as a reversal. |
| `subscription`   | `PaymentSubscription \| null` | The subscription the payment's invoice billed. See below. |
| `createdAt`      | `Date`                        | When the payment was created.                             |
| `provider`       | `CashierProvider`             | The provider it came from.                                |

| Field            | Stripe                                                                                  | Recurly                                                                                                      |
| ---------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `amountRefunded` | The latest charge's `amount_refunded`                                                   | The sum of the account's successful and pending `refund` transactions whose original transaction is this one |
| `dispute`        | The latest charge's dispute                                                             | Always `null`. Recurly transactions have no dispute.                                                         |
| `receiptUrl`     | The latest charge's `receipt_url`                                                       | Always `null`                                                                                                |
| `reversed`       | `true` when one of the latest charge's refunds has the card destination type `reversal` | Always `false`                                                                                               |
| `subscription`   | The invoice's subscription, with its `status` and `cancelAt`                            | The transaction's first subscription id, with `status` and `cancelAt` set to `null`                          |

On Stripe, Cashier expands `latest_charge`, its `dispute` and `refunds`, and `invoice.subscription` in the same request, so these fields cost no extra requests. On Recurly, a page with a refunded payment (`refunded` is `true`) makes one more request for the account's refunds created since the oldest refunded payment on the page. A page with no refunded payment makes no extra request.

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
