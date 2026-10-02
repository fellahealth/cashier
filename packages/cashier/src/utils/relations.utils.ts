import { CashierProvider } from '../types/cashier.types';
import { UnsupportedOperationError } from '../errors/unsupported-operation.error';

export const resolveRelations = <Relation extends string>(
  provider: CashierProvider,
  resource: string,
  supported: ReadonlySet<string>,
  requested: readonly Relation[] = [],
): ReadonlySet<Relation> => {
  const unsupported = requested.filter((relation) => !supported.has(relation));

  if (unsupported.length > 0) {
    throw new UnsupportedOperationError(
      `${provider} cannot load ${unsupported.map((relation) => `"${relation}"`).join(', ')} with ${resource}`,
      { provider },
    );
  }

  return new Set(requested);
};
