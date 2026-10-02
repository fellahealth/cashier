import * as recurly from 'recurly';
import { CashierProvider } from '../../../types/cashier.types';
import { Product } from '../../../types/product.types';

export const mapRecurlyPlan = (plan: recurly.Plan): Product => ({
  id: plan.id ?? '',
  code: plan.code ?? null,
  name: plan.name ?? '',
  description: plan.description ?? null,
  active: plan.state === 'active',
  createdAt: plan.createdAt ?? new Date(0),
  provider: CashierProvider.Recurly,
});
