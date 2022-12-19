import { Gradient } from "./mark";
import { Predicate } from "./predicate";
import { Type } from "./type";

export type PrimitiveValue = number | string | boolean | null;

export type Value = PrimitiveValue | number[] | Gradient;

export interface ValueDef<V extends Value = Value> {
  value: V;
}

export interface FieldDef<F extends Field> {
  field?: F;
}

export type Field = string;

export type MarkPropDef<F extends Field, V extends Value> =
  | FieldDefWithCondition<MarkPropFieldDef<F>, V>
  | ValueDefWithCondition<MarkPropFieldDef<F>, V>;

export type MarkPropFieldDef<F extends Field> = FieldDefBase<F>;

export interface FieldDefBase<F> {
  field?: F;
}

export type FieldDefWithCondition<
  F extends FieldDef<any>,
  V extends Value = Value
> = F & {
  condition?: Conditional<ValueDef<V>> | Conditional<ValueDef<V>>[];
};

export type ValueDefWithCondition<
  F extends FieldDef<any>,
  V extends Value = Value
> = ValueDef & {
  condition?: Conditional<ValueDef<V>> | Conditional<ValueDef<V>>[];
};

export type Conditional<CD extends FieldDef<any> | ValueDef<any>> =
  ConditionalPredicate<CD>;

export type ConditionalPredicate<CD extends FieldDef<any> | ValueDef<any>> = {
  test: Predicate;
} & CD;

export interface ValueDef<V extends Value = Value> {
  value: V;
}

export type ColorDef<F extends Field> = MarkPropDef<
  F,
  Gradient | string | null
>;

export interface PositionFieldDef<F> {
  field?: F;
  type?: Type;
}

export type PositionDef<F extends Field> = PositionFieldDef<F>;
