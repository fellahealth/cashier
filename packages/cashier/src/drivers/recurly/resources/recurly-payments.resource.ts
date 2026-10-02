import * as recurly from 'recurly';
import {
  ListPaymentsParams,
  Payment,
  PaymentsResource,
} from '../../../types/payment.types';
import {
  CursorPaginateParams,
  CursorPaginator,
} from '../../../types/pagination.types';
import {
  DEFAULT_LIST_LIMIT,
  RECURLY_MAX_LIST_LIMIT,
} from '../../../constants/cashier.constants';
import {
  mapRecurlyPayment,
  sumRecurlyRefunds,
} from '../mappers/recurly-payment.mapper';
import { readRecurlyItems, readRecurlyPage } from '../recurly-page';
import { recurlyRequest } from '../recurly-request';

const getOldestCreatedAt = (transactions: recurly.Transaction[]): Date =>
  new Date(
    Math.min(
      ...transactions.map(
        (transaction) => transaction.createdAt?.getTime() ?? 0,
      ),
    ),
  );

export class RecurlyPaymentsResource implements PaymentsResource {
  constructor(private readonly client: recurly.Client) {}

  list({
    customer,
    limit = DEFAULT_LIST_LIMIT,
  }: ListPaymentsParams): Promise<Payment[]> {
    return recurlyRequest(async () =>
      this.withRefunds(
        customer,
        await readRecurlyItems(this.payments(customer, limit), limit),
      ),
    );
  }

  cursorPaginate({
    customer,
    perPage = DEFAULT_LIST_LIMIT,
    cursor,
  }: CursorPaginateParams): Promise<CursorPaginator<Payment>> {
    return recurlyRequest(async () => {
      const page = await readRecurlyPage(
        this.payments(customer, perPage, cursor),
      );

      return {
        data: await this.withRefunds(customer, page.items),
        perPage,
        hasMorePages: page.hasMorePages,
        nextCursor: page.nextCursor,
      };
    });
  }

  private payments(
    customer: string,
    limit: number,
    cursor?: string | null,
  ): recurly.Pager<recurly.Transaction> {
    return this.client.listAccountTransactions(customer, {
      params: { limit, type: 'payment', ...(cursor ? { cursor } : {}) },
    });
  }

  private async withRefunds(
    customer: string,
    transactions: recurly.Transaction[],
  ): Promise<Payment[]> {
    const refundedPayments = transactions.filter(
      (transaction) => transaction.refunded,
    );
    const refunded =
      refundedPayments.length > 0
        ? sumRecurlyRefunds(
            await this.refunds(customer, getOldestCreatedAt(refundedPayments)),
          )
        : new Map<string, number>();

    return transactions.map((transaction) =>
      mapRecurlyPayment(transaction, refunded.get(transaction.id ?? '') ?? 0),
    );
  }

  private refunds(
    customer: string,
    beginTime: Date,
  ): Promise<recurly.Transaction[]> {
    return readRecurlyItems(
      this.client.listAccountTransactions(customer, {
        params: { limit: RECURLY_MAX_LIST_LIMIT, type: 'refund', beginTime },
      }),
    );
  }
}
