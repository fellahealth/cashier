# Products

`driver.products` reads Stripe products and Recurly plans.

- [`products.get(productId)`](#productsgetproductid)
- [`products.list(params?)`](#productslistparams)
- [The `Product` object](#the-product-object)

## `products.get(productId)`

Returns one product.

```ts
const product = await driver.products.get('prod_123');
const plan = await recurlyDriver.products.get('code-pro-monthly');
```

| Provider | Behavior                                                      |
| -------- | ------------------------------------------------------------- |
| Stripe   | Retrieves the product.                                        |
| Recurly  | Retrieves the plan by id, or by code with the `code-` prefix. |

## `products.list(params?)`

Returns an array of products.

```ts
const products = await driver.products.list({ active: true });
```

| Parameter | Type      | Description                                                 |
| --------- | --------- | ----------------------------------------------------------- |
| `active`  | `boolean` | Only return active (`true`) or inactive (`false`) products. |
| `limit`   | `number`  | Maximum number of products. Defaults to `100`.              |

| Provider | Behavior                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| Stripe   | Returns one page of up to `limit` products. The maximum is 100.                                              |
| Recurly  | Reads pages of plans until `limit` is reached, filtered by state `active` or `inactive`. The maximum is 200. |

## The `Product` object

| Field         | Type                    | Description                                     |
| ------------- | ----------------------- | ----------------------------------------------- |
| `id`          | `string`                | The provider's id.                              |
| `code`        | `string \| null`        | The Recurly plan code. Always `null` on Stripe. |
| `name`        | `string`                | Name.                                           |
| `description` | `string \| null`        | Description.                                    |
| `active`      | `boolean`               | Whether the product or plan can be used.        |
| `createdAt`   | `Date`                  | When it was created.                            |
| `provider`    | `'stripe' \| 'recurly'` | The provider it came from.                      |
