import * as recurly from 'recurly';
import {
  CancelSubscriptionParams,
  CreateSubscriptionParams,
  Subscription,
  SubscriptionsResource,
  UpdateSubscriptionParams,
} from '../../../types/subscription.types';
import {
  mapRecurlySubscription,
  toRecurlyCustomFields,
} from '../mappers/recurly-subscription.mapper';
import { toRecurlyPlanReference } from '../recurly-plan-reference';
import { recurlyRequest } from '../recurly-request';

export class RecurlySubscriptionsResource implements SubscriptionsResource {
  constructor(private readonly client: recurly.Client) {}

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
    return recurlyRequest(async () => {
      const account = await this.client.getAccount(customer);

      return mapRecurlySubscription(
        await this.client.createSubscription({
          ...toRecurlyPlanReference(price),
          account: { code: account.code },
          currency,
          quantity,
          ...(paymentMethod ? { billingInfoId: paymentMethod } : {}),
          ...(couponCode ? { couponCodes: [couponCode] } : {}),
          ...(trialEnd ? { trialEndsAt: trialEnd } : {}),
          ...(metadata
            ? { customFields: toRecurlyCustomFields(metadata) }
            : {}),
        }),
      );
    });
  }

  get(subscriptionId: string): Promise<Subscription> {
    return recurlyRequest(async () =>
      mapRecurlySubscription(await this.client.getSubscription(subscriptionId)),
    );
  }

  update(
    subscriptionId: string,
    { price, quantity, metadata }: UpdateSubscriptionParams,
  ): Promise<Subscription> {
    return recurlyRequest(async () => {
      if (price !== undefined || quantity !== undefined) {
        await this.client.createSubscriptionChange(subscriptionId, {
          timeframe: 'now',
          ...(price ? toRecurlyPlanReference(price) : {}),
          ...(quantity !== undefined ? { quantity } : {}),
        });
      }

      if (metadata) {
        await this.client.updateSubscription(subscriptionId, {
          customFields: toRecurlyCustomFields(metadata),
        });
      }

      return mapRecurlySubscription(
        await this.client.getSubscription(subscriptionId),
      );
    });
  }

  cancel(
    subscriptionId: string,
    { atPeriodEnd = false }: CancelSubscriptionParams = {},
  ): Promise<Subscription> {
    return recurlyRequest(async () =>
      mapRecurlySubscription(
        atPeriodEnd
          ? await this.client.cancelSubscription(subscriptionId, {
              params: { timeframe: 'term_end' },
            })
          : await this.client.terminateSubscription(subscriptionId, {
              params: { refund: 'none' },
            }),
      ),
    );
  }
}
