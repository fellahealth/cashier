import { CashierProvider } from './cashier.types';

export type ProviderRelation<
  Relations extends Record<CashierProvider, string>,
  Provider extends CashierProvider,
> = (
  Provider extends CashierProvider
    ? (relation: Relations[Provider]) => void
    : never
) extends (relation: infer Relation) => void
  ? Relation
  : never;

export type LoadedRelations<Fields, Relation extends keyof Fields> = (
  Relation extends keyof Fields ? (fields: Fields[Relation]) => void : never
) extends (fields: infer Loaded) => void
  ? Loaded
  : never;

export interface WithParams<Relation extends string> {
  with?: readonly Relation[];
}
