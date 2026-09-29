# Invoices

`driver.invoices` reads, pays and voids invoices.

- [`invoices.get(invoiceId)`](#invoicesgetinvoiceid)
- [`invoices.list(params)`](#invoiceslistparams)
- [`invoices.pay(invoiceId, params?)`](#invoicespayinvoiceid-params)
- [`invoices.void(invoiceId)`](#invoicesvoidinvoiceid)
- [The `Invoice` object](#the-invoice-object)

## `invoices.get(invoiceId)`

Returns one invoice.

```ts
const invoice = await driver.invoices.get('in_123');
```

| Provider | Behavior                                                                |
| -------- | ----------------------------------------------------------------------- |
| Stripe   | Retrieves the invoice.                                                  |
| Recurly  | Retrieves the invoice. Amounts are converted from major to minor units. |

## `invoices.list(params)`

Returns a customer's invoices.

```ts
const invoices = await driver.invoices.list({
  customer: 'cus_123',
  status: 'paid',
});
```

| Parameter  | Type     | Description                                    |
| ---------- | -------- | ---------------------------------------------- |
| `customer` | `string` | Required. The customer id.                     |
| `status`   | `'paid'` | Only return paid invoices.                     |
| `limit`    | `number` | Maximum number of invoices. Defaults to `100`. |

| Provider | Behavior                                                                            |
| -------- | ----------------------------------------------------------------------------------- |
| Stripe   | Returns one page of up to `limit` invoices. The maximum is 100.                     |
| Recurly  | Reads pages of the account's invoices until `limit` is reached. The maximum is 200. |

## `invoices.pay(invoiceId, params?)`

Pays an open invoice and returns it.

```ts
const invoice = await driver.invoices.pay('in_123', {
  paymentMethod: 'pm_123',
});
```

| Parameter       | Type     | Description                                                                              |
| --------------- | -------- | ---------------------------------------------------------------------------------------- |
| `paymentMethod` | `string` | Stripe payment method id or Recurly billing info id. Defaults to the customer's default. |

| Provider | Behavior              |
| -------- | --------------------- |
| Stripe   | Pays the invoice.     |
| Recurly  | Collects the invoice. |

A declined payment rejects with `PaymentFailedError` or `PaymentMethodError`. See [Errors](errors.md).

## `invoices.void(invoiceId)`

Voids an invoice and returns it.

```ts
const invoice = await driver.invoices.void('in_123');
```

## The `Invoice` object

| Field             | Type                    | Description                                                         |
| ----------------- | ----------------------- | ------------------------------------------------------------------- |
| `id`              | `string`                | The provider's id.                                                  |
| `number`          | `string \| null`        | The invoice number.                                                 |
| `customerId`      | `string \| null`        | The customer or account id.                                         |
| `subscriptionIds` | `string[]`              | Subscriptions billed on this invoice.                               |
| `billingReason`   | `string \| null`        | Stripe `billing_reason` or Recurly `origin`, for example `renewal`. |
| `status`          | `InvoiceStatus`         | See below.                                                          |
| `currency`        | `string`                | Uppercase ISO 4217 code.                                            |
| `subtotal`        | `number`                | In minor units.                                                     |
| `tax`             | `number`                | In minor units. `0` when there is no tax.                           |
| `total`           | `number`                | In minor units.                                                     |
| `createdAt`       | `Date`                  | When the invoice was created.                                       |
| `paidAt`          | `Date \| null`          | When the invoice was paid.                                          |
| `provider`        | `'stripe' \| 'recurly'` | The provider it came from.                                          |

### Invoice status

| `status`        | Stripe                | Recurly                         |
| --------------- | --------------------- | ------------------------------- |
| `draft`         | `draft`, or no status |                                 |
| `open`          | `open`                | `pending`, `processing`, `open` |
| `paid`          | `paid`                | `paid`                          |
| `past_due`      |                       | `past_due`                      |
| `failed`        |                       | `failed`                        |
| `void`          | `void`                | `voided`                        |
| `uncollectible` | `uncollectible`       |                                 |
| `closed`        |                       | `closed`                        |
| `unknown`       |                       | Any other state                 |
