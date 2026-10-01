import { CashierProvider } from './cashier.types';

export interface Product {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: Date;
  provider: CashierProvider;
}

export interface ListProductsParams {
  active?: boolean;
  limit?: number;
}

export interface ProductsResource {
  get(productId: string): Promise<Product>;
  list(params?: ListProductsParams): Promise<Product[]>;
}
