import { Field } from "./channeldef";

export type Predicate =
  | FieldEqualPredicate
  | FieldLTPredicate
  | FieldGTPredicate;

interface FieldPredicateBase {
  field: Field;
}

export interface FieldEqualPredicate extends FieldPredicateBase {
  equal: string | number;
}

export function isFieldEqualPredicate(
  predicate: any,
): predicate is FieldEqualPredicate {
  return predicate.equal !== undefined;
}

interface FieldLTPredicate extends FieldPredicateBase {
  lt: string | number;
}

export function isFieldLTPredicate(
  predicate: any,
): predicate is FieldLTPredicate {
  return predicate.lt !== undefined;
}

interface FieldGTPredicate extends FieldPredicateBase {
  gt: string | number;
}

export function isFieldGTPredicate(
  predicate: any,
): predicate is FieldGTPredicate {
  return predicate.gt !== undefined;
}
