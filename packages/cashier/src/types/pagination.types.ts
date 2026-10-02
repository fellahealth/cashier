export interface CursorPaginateParams {
  customer: string;
  perPage?: number;
  cursor?: string | null;
}

export interface CursorPaginator<Item> {
  data: Item[];
  perPage: number;
  hasMorePages: boolean;
  nextCursor: string | null;
}
