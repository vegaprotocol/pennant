import { AreaElement, BarElement, LineElement, RuleElement } from "../elements";
import { Color, Gradient, Mark } from "../mark";
import {
  Predicate,
  isFieldGTPredicate,
  isFieldLTPredicate,
} from "../predicate";

import { Colors } from ".";
import { PositionalElement } from "../types";

export const PADDING_INNER = 0.4;

export function createElement(type: Mark, options: any): PositionalElement {
  if (type === "area") {
    return new AreaElement(options);
  } else if (type === "bar") {
    return new BarElement(options);
  } else if (type === "line") {
    return new LineElement(options);
  } else if (type === "rule") {
    return new RuleElement(options);
  }

  throw new Error(`Element type not recognized: ${type}`);
}

export function getAreaConfig(
  data: any,
  x: string,
  y: string,
  y2: string,
  fill: string | Gradient | undefined,
  line: Color | undefined
) {
  if (y2 === undefined) {
    return {
      points: data.map((d: any) => [d[x], 0, d[y]]),
      fill: fill ?? Colors.GRAY,
      line: line,
    };
  }

  return {
    points: data.map((d: any) => [d[x], d[y], d[y2]]),
    fill: fill ?? Colors.GRAY,
    line: line,
  };
}

export function getBarConfig(
  d: any,
  x: string,
  y: string,
  y2: string,
  width: number,
  fill: string | null,
  stroke: string | null
) {
  let base = 0;

  if (y2) {
    base = d[y2];
  }

  return {
    x: d[x],
    y: Math.max(d[y] as number, base),
    height: Math.abs(base - (d[y] as number)),
    width: width * (1 - PADDING_INNER),
    fill: fill,
    stroke: stroke,
  };
}

export function getLineConfig(
  data: any,
  x: string,
  y: string,
  color: string | Gradient | undefined
) {
  return {
    points: data.map((d: any) => [d[x], d[y]]),
    color: color,
  };
}

export function getRuleConfig(
  d: any,
  x: string,
  x2: string,
  y: string,
  y2: string,
  color: string | null
) {
  if (x === undefined) {
    return {
      x: null,
      x2: null,
      y: d[y],
      y2: y2 !== undefined ? d[y2] : null,
      color: color,
    };
  }

  if (y === undefined) {
    return {
      x: d[x],
      x2: x2 !== undefined ? d[x2] : null,
      y: null,
      y2: null,
      color: color,
    };
  }

  return {
    x: d[x],
    x2: x2 !== undefined ? d[x2] : null,
    y: d[y],
    y2: d[y2],
    color,
  };
}

export function getConditionalColor(colorDef: any | undefined) {
  let color: (datum: any) => string | null;

  if (colorDef === undefined) {
    color = () => null;
  } else if ("condition" in colorDef) {
    const predicate: Predicate = colorDef.condition?.test;

    if (isFieldLTPredicate(predicate)) {
      const comparison =
        typeof predicate.lt === "string"
          ? (datum: any) => datum[predicate.lt]
          : () => predicate.lt;

      color = (datum) =>
        datum[predicate.field] < comparison(datum)
          ? colorDef.condition.value ?? Colors.GRAY
          : colorDef.value ?? Colors.GRAY;
    } else if (isFieldGTPredicate(predicate)) {
      const comparison =
        typeof predicate.gt === "string"
          ? (datum: any) => datum[predicate.gt]
          : () => predicate.gt;

      color = (datum) =>
        datum[predicate.field] > comparison(datum)
          ? colorDef.condition.value ?? Colors.GRAY
          : colorDef.value ?? Colors.GRAY;
    } else {
      color = () => null;
    }
  } else if ("value" in colorDef) {
    color = () => colorDef.value;
  } else {
    color = () => null;
  }

  return color;
}
