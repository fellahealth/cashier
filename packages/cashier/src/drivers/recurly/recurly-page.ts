import * as recurly from 'recurly';

interface RecurlyPagerState {
  done?: boolean;
  path?: string | null;
}

export interface RecurlyPage<Item> {
  items: Item[];
  hasMorePages: boolean;
  nextCursor: string | null;
}

const getCursor = (path: string | null | undefined): string | null => {
  const query = path?.split('?')[1];

  return query ? new URLSearchParams(query).get('cursor') : null;
};

export const readRecurlyPage = async <Item>(
  pager: recurly.Pager<Item>,
): Promise<RecurlyPage<Item>> => {
  for await (const items of pager.eachPage()) {
    const { done, path } = pager as unknown as RecurlyPagerState;
    const nextCursor = done ? null : getCursor(path);

    return { items, hasMorePages: nextCursor !== null, nextCursor };
  }

  return { items: [], hasMorePages: false, nextCursor: null };
};

export const readRecurlyItems = async <Item>(
  pager: recurly.Pager<Item>,
  limit = Infinity,
): Promise<Item[]> => {
  const items: Item[] = [];

  for await (const item of pager.each()) {
    items.push(item);

    if (items.length >= limit) break;
  }

  return items;
};
