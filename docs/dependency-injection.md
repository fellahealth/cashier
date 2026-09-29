# Dependency injection

`cashier` is a shared instance of the `Cashier` class. For dependency injection, create your own with `new Cashier()` and register it with your container. In tests you can then swap it for a fake that returns a mock `CashierDriver`.

## NestJS

```ts
import { Injectable, Module } from '@nestjs/common';
import { Cashier, CashierDriver, Subscription } from '@aios-medical/cashier';

@Injectable()
export class BillingService {
  private readonly billing: CashierDriver;

  constructor(cashier: Cashier) {
    this.billing = cashier.use('stripe', {
      apiKey: process.env.STRIPE_SECRET_KEY!,
    });
  }

  getSubscription(subscriptionId: string): Promise<Subscription> {
    return this.billing.subscriptions.get(subscriptionId);
  }
}

@Module({
  providers: [{ provide: Cashier, useValue: new Cashier() }, BillingService],
  exports: [BillingService],
})
export class BillingModule {}
```

The driver is created once, in the constructor, and reused for every request.

### Testing with NestJS

Provide a fake in place of `Cashier`:

```ts
import { Test } from '@nestjs/testing';
import { Cashier, CashierDriver } from '@aios-medical/cashier';

const driver = {
  provider: 'stripe',
  subscriptions: { get: jest.fn() },
} as unknown as CashierDriver;

const moduleRef = await Test.createTestingModule({
  providers: [
    BillingService,
    { provide: Cashier, useValue: { use: () => driver } },
  ],
}).compile();
```

## Without a framework

Pass the instance to your constructor:

```ts
import { Cashier, CashierDriver } from '@aios-medical/cashier';

class BillingService {
  private readonly billing: CashierDriver;

  constructor(cashier: Cashier, apiKey: string) {
    this.billing = cashier.use('recurly', { apiKey });
  }
}

const service = new BillingService(new Cashier(), process.env.RECURLY_API_KEY!);
```

## Choosing the provider at runtime

Because both drivers share the `CashierDriver` interface, the rest of your code does not change when the provider does:

```ts
import { Cashier, CashierProvider } from '@aios-medical/cashier';

const provider = process.env.BILLING_PROVIDER as CashierProvider;
const driver = new Cashier().use(provider, {
  apiKey: process.env.BILLING_API_KEY!,
});
```
