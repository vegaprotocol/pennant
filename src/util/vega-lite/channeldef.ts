import { Gradient } from "./mark";
import { Predicate } from "./predicate";
import { Type } from "./type";

type PrimitiveValue = number | string | boolean | null;

type Value = PrimitiveValue | number[] | Gradient;

interface ValueDef<V extends Value = Value> {
  value: V;
}

interface FieldDef<F extends Field> {
  field?: F;
}

export type Field = string;

type MarkPropDef<F extends Field, V extends Value> =
  | FieldDefWithCondition<MarkPropFieldDef<F>, V>
  | ValueDefWithCondition<MarkPropFieldDef<F>, V>;

type MarkPropFieldDef<F extends Field> = FieldDefBase<F>;

interface FieldDefBase<F> {
  field?: F;
}

type FieldDefWithCondition<
  F extends FieldDef<any>,
  V extends Value = Value,
> = F & {
  condition?: Conditional<ValueDef<V>> | Conditional<ValueDef<V>>[];
};

type ValueDefWithCondition<
  F extends FieldDef<any>,
  V extends Value = Value,
> = ValueDef & {
  condition?: Conditional<ValueDef<V>> | Conditional<ValueDef<V>>[];
};

type Conditional<CD extends FieldDef<any> | ValueDef<any>> =
  ConditionalPredicate<CD>;

type ConditionalPredicate<CD extends FieldDef<any> | ValueDef<any>> = {
  test: Predicate;
} & CD;

export type ColorDef<F extends Field> = MarkPropDef<
  F,
  Gradient | string | null
>;

interface PositionFieldDef<F> {
  field?: F;
  type?: Type;
}

export type PositionDef<F extends Field> = PositionFieldDef<F>;

export type NumericDef<F extends Field> = MarkPropDef<F, number>;
