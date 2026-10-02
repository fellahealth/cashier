import Stripe from 'stripe';
import { CursorPaginator } from '../../../types/pagination.types';

export const getExpandableId = (
  value: string | { id: string } | null | undefined,
): string | null => {
  if (!value) return null;

  return typeof value === 'string' ? value : value.id;
};

export const getExpanded = <Value extends object>(
  value: string | Value | null | undefined,
): Value | null => (value && typeof value === 'object' ? value : null);

export const fromUnixSeconds = (
  unixSeconds: number | null | undefined,
): Date | null => (unixSeconds ? new Date(unixSeconds * 1000) : null);

export const toStripeCursorPaginator = <Item extends { id: string }, Result>(
  list: Stripe.ApiList<Item>,
  perPage: number,
  map: (item: Item) => Result,
): CursorPaginator<Result> => ({
  data: list.data.map(map),
  perPage,
  hasMorePages: list.has_more,
  nextCursor: list.has_more ? (list.data.at(-1)?.id ?? null) : null,
});
