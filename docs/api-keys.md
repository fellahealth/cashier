# API keys and providers

There are three ways to choose the provider and API key for a call. They all go through `use`, and they work the same in [TypeScript](typescript.md), [NestJS](nestjs.md) and [Express](express.md).

| Situation                                     | Call                                       |
| --------------------------------------------- | ------------------------------------------ |
| One provider for the whole app                | `use()`                                    |
| Several providers, chosen per call            | `use('stripe')`, `use('recurly')`          |
| A different API key per tenant or per account | `use('stripe', { apiKey: tenant.apiKey })` |

## One provider for the whole app

Set a `default` and call `use()`:

```ts
const cashier = createCashier({
  default: process.env.BILLING_PROVIDER as CashierProvider,
  providers: {
    stripe: { apiKey: process.env.STRIPE_SECRET_KEY! },
    recurly: { apiKey: process.env.RECURLY_API_KEY! },
  },
});

await cashier
  .use()
  .customers.create({ email: 'jane@example.com', code: 'customer-42' });
```

Switching the whole app to another provider is a config change: set `BILLING_PROVIDER=recurly`. No code changes.

## Several providers at once

Configure each provider and name it in the call. This is useful while moving from one provider to another: new customers go to the new provider and existing customers stay where they are.

```ts
await cashier.use(customer.billingProvider).invoices.list({
  customer: customer.billingId,
});
```

## A different API key per tenant

When each tenant or account has its own Stripe or Recurly API key, pass the key in the call:

```ts
const tenant = await tenants.findOrFail(tenantId);

await cashier
  .use(tenant.billingProvider, { apiKey: tenant.billingApiKey })
  .subscriptions.create({ customer: customerId, price, currency: 'USD' });
```

You load the tenant and its key the way your app already does. Cashier does not need to know what a tenant is. These calls work without any `providers` config.

## Drivers are reused

Calling `use` on every request is cheap. Cashier keeps the drivers it creates:

- The same provider and API key always return the same driver, so the Stripe or Recurly client is created once.
- A different API key, for example after a key rotation, gets a new driver.
- Up to 100 drivers are kept. When there are more, the least recently used one is dropped and created again the next time it is needed.
- Drivers are looked up by a SHA-256 hash of the API key, so keys never appear in cache keys, logs or error messages.

## Save the provider with every id

Provider ids only make sense to the provider that created them. A Stripe `cus_...` id means nothing to Recurly, so switching the default provider does not move existing data.

Every object Cashier returns has a `provider` field. Save it next to the id:

```ts
const customer = await cashier.use().customers.create({ email, code: userId });

await users.update(userId, {
  billingProvider: customer.provider,
  billingId: customer.id,
});
```

Then always call the provider that owns the record:

```ts
await cashier.use(user.billingProvider).customers.get(user.billingId);
```
