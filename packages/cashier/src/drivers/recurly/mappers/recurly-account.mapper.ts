import * as recurly from 'recurly';
import { CashierProvider } from '../../../types/cashier.types';
import { Customer } from '../../../types/customer.types';
import { mapCustomFields } from './recurly-subscription.mapper';

export const mapRecurlyAccount = (account: recurly.Account): Customer => ({
  id: account.id ?? '',
  code: account.code ?? null,
  email: account.email ?? null,
  name: [account.firstName, account.lastName].filter(Boolean).join(' ') || null,
  metadata: mapCustomFields(account.customFields),
  createdAt: account.createdAt ?? new Date(0),
  provider: CashierProvider.Recurly,
});
