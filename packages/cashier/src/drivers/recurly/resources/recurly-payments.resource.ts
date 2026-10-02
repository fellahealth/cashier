import * as recurly from 'recurly';
import {
  ListPaymentsParams,
  Payment,
  PaymentsResource,
} from '../../../types/payment.types';
import { DEFAULT_LIST_LIMIT } from '../../../constants/cashier.constants';
import { mapRecurlyPayment } from '../mappers/recurly-payment.mapper';
import { recurlyRequest } from '../recurly-request';

export class RecurlyPaymentsResource implements PaymentsResource {
  constructor(private readonly client: recurly.Client) {}

  list({
    customer,
    limit = DEFAULT_LIST_LIMIT,
  }: ListPaymentsParams): Promise<Payment[]> {
    return recurlyRequest(async () => {
      const pager = this.client.listAccountTransactions(customer, {
        params: { limit, type: 'payment' },
      });

      const payments: Payment[] = [];

      for await (const transaction of pager.each()) {
        payments.push(mapRecurlyPayment(transaction));

        if (payments.length >= limit) break;
      }

      return payments;
    });
  }
}
