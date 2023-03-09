import { Field } from "./channeldef";

export type Predicate = FieldLTPredicate | FieldGTPredicate;

interface FieldPredicateBase {
  field: Field;
}

interface FieldLTPredicate extends FieldPredicateBase {
  lt: string | number;
}

export function isFieldLTPredicate(
  predicate: any
): predicate is FieldLTPredicate {
  return predicate.lt !== undefined;
}

interface FieldGTPredicate extends FieldPredicateBase {
  gt: string | number;
}

export function isFieldGTPredicate(
  predicate: any
): predicate is FieldGTPredicate {
  return predicate.gt !== undefined;
}
