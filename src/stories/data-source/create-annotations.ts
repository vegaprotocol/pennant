import { LabelAnnotation } from "../../types";
import {
  orders_orders,
  positions_party_positions,
  Side,
} from "../api/vega-graphql";
import { addDecimal, formatNumber } from "../helpers";

function getSignFromValue(value: number) {
  return value >= 0 ? "+" : "-";
}

function getSignFromSide(side: Side) {
  return side === Side.Buy ? "+" : "-";
}

export function createPositionLabelAnnotation(
  position: positions_party_positions,
  decimalPlaces: number
): LabelAnnotation {
  return {
    type: "label",
    id: "position",
    cells: [
      { label: "Position" },
      {
        label: `${formatNumber(
          addDecimal(position.averageEntryPrice, 0),
          decimalPlaces
        )}`,
      },
      {
        label: `${getSignFromValue(Number(position.openVolume))}${Math.abs(
          Number(position.openVolume)
        )}`,
        fill: true,
      },
      {
        label: `PnL ${formatNumber(
          addDecimal(position.unrealisedPNL, 0),
          decimalPlaces
        )}`,
        stroke: true,
      },
    ],
    intent: "success",
    y: Number(addDecimal(position.averageEntryPrice, decimalPlaces)),
  };
}

export function createOrderLabelAnnotation(
  order: orders_orders,
  decimalPlaces: number
): LabelAnnotation {
  return {
    type: "label",
    id: order.id,
    cells: [
      {
        label: `${order.type} ${order.timeInForce}`,
        stroke: true,
      },
      {
        label: `${formatNumber(
          addDecimal(order.price, 0),
          order.market?.decimalPlaces ?? 0
        )}`,
      },
      {
        label: `${getSignFromSide(order.side)}${Number(order.size)}`,
        stroke: true,
      },
    ],
    intent: "danger",
    y: Number(
      addDecimal(order.price, order.market?.decimalPlaces ?? decimalPlaces)
    ),
  };
}
