import {
  ScaleLinear as d3ScaleLinear,
  ScaleTime as d3ScaleTime,
} from "d3-scale";

export type ScaleTime = d3ScaleTime<number, number, number>;
export type ScaleLinear = d3ScaleLinear<number, number, number>;
