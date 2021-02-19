import { CandleDetailsExtended } from "../components/candlestick-chart";
import { Colors } from "./vega-colours";

export const isUp = (d: CandleDetailsExtended) => {
  return d.close > d.open;
};

export const redIfDownGreenIfUp = (d: CandleDetailsExtended) => {
  return isUp(d) ? Colors.GREEN : Colors.RED;
};

export const candleFill = (d: CandleDetailsExtended) => {
  return isUp(d) ? Colors.GREEN_DARK : Colors.RED;
};

export const candleStroke = (d: CandleDetailsExtended) => {
  return redIfDownGreenIfUp(d);
};
