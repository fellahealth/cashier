# Payments

`driver.payments` lists a customer's payments: the charges made against their payment method, whether they succeeded or not.

- [`payments.list(params)`](#paymentslistparams)
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

### Payment status

| `status`     | Stripe                                                                                                                | Recurly                                |
| ------------ | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `succeeded`  | `succeeded`                                                                                                           | `success`                              |
| `pending`    | `processing`, `requires_capture`                                                                                      | `pending`, `processing`, `scheduled`   |
| `incomplete` | `requires_payment_method`, `requires_confirmation`, `requires_action`                                                 |                                        |
| `failed`     | `requires_payment_method` after a declined attempt (`last_payment_error` is set), which the Dashboard shows as Failed | `declined`, `error`                    |
| `canceled`   | `canceled`                                                                                                            | `void`                                 |
| `unknown`    | Any other status                                                                                                      | Any other status, such as `chargeback` |
