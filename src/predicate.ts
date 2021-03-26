import { Field } from "./channeldef";

export type Predicate = FieldLTPredicate | FieldGTPredicate;

export interface FieldPredicateBase {
  field: Field;
}

export interface FieldLTPredicate extends FieldPredicateBase {
  lt: string | number;
}

export function isFieldLTPredicate(
  predicate: any
): predicate is FieldLTPredicate {
  return predicate.lt !== undefined;
}

export interface FieldGTPredicate extends FieldPredicateBase {
  gt: string | number;
}

export function isFieldGTPredicate(
  predicate: any
): predicate is FieldGTPredicate {
  return predicate.gt !== undefined;
}
