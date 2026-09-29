import Stripe from 'stripe';
import {
  CancelSubscriptionParams,
  CreateSubscriptionParams,
  Subscription,
  SubscriptionsResource,
  UpdateSubscriptionParams,
} from '../../../types/subscription.types';
import { ValidationError } from '../../../errors/validation.error';
import { mapStripeSubscription } from '../mappers/stripe-subscription.mapper';
import { stripeRequest } from '../stripe-request';

export class StripeSubscriptionsResource implements SubscriptionsResource {
  constructor(private readonly client: Stripe) {}

  create({
    customer,
    price,
    currency,
    quantity = 1,
    paymentMethod,
    couponCode,
    trialEnd,
    metadata,
  }: CreateSubscriptionParams): Promise<Subscription> {
    return stripeRequest(async () =>
      mapStripeSubscription(
        await this.client.subscriptions.create({
          customer,
          items: [{ price, quantity }],
          currency: currency.toLowerCase(),
          ...(paymentMethod ? { default_payment_method: paymentMethod } : {}),
          ...(couponCode ? { coupon: couponCode } : {}),
          ...(trialEnd
            ? { trial_end: Math.floor(trialEnd.getTime() / 1000) }
            : {}),
          ...(metadata ? { metadata } : {}),
        }),
      ),
    );
  }

  get(subscriptionId: string): Promise<Subscription> {
    return stripeRequest(async () =>
      mapStripeSubscription(
        await this.client.subscriptions.retrieve(subscriptionId),
      ),
    );
  }

  update(
    subscriptionId: string,
    { price, quantity, metadata }: UpdateSubscriptionParams,
  ): Promise<Subscription> {
    return stripeRequest(async () => {
      const isItemChange = price !== undefined || quantity !== undefined;
      const items = isItemChange
        ? [
            {
              id: await this.getSingleItemId(subscriptionId),
              ...(price ? { price } : {}),
              ...(quantity !== undefined ? { quantity } : {}),
            },
          ]
        : undefined;

      return mapStripeSubscription(
        await this.client.subscriptions.update(subscriptionId, {
          ...(items ? { items } : {}),
          ...(metadata ? { metadata } : {}),
        }),
      );
    });
  }

  cancel(
    subscriptionId: string,
    { atPeriodEnd = false }: CancelSubscriptionParams = {},
  ): Promise<Subscription> {
    return stripeRequest(async () =>
      mapStripeSubscription(
        atPeriodEnd
          ? await this.client.subscriptions.update(subscriptionId, {
              cancel_at_period_end: true,
            })
          : await this.client.subscriptions.cancel(subscriptionId),
      ),
    );
  }

  private async getSingleItemId(subscriptionId: string): Promise<string> {
    const subscription =
      await this.client.subscriptions.retrieve(subscriptionId);
    const [item, ...otherItems] = subscription.items.data;

    if (!item || otherItems.length > 0) {
      throw new ValidationError(
        'Changing price or quantity requires a subscription with exactly one item',
        { provider: 'stripe' },
      );
    }

    return item.id;
  }
}
