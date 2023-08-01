import { LabelAnnotation, LabelAnnotationCell } from "../..";
import {
  orders_orders,
  OrderStatus,
  PendingAction,
  positions_party_positions,
  Side,
} from "../api/vega-graphql";
import { formatNumber, parseVegaDecimal } from "../helpers";
import * as i18n from "../i18n";

function getSignFromValue(value: number) {
  return value >= 0 ? "+" : "-";
}

function getSignFromSide(side: Side) {
  return side === Side.Buy ? "+" : "-";
}

export function createPositionLabelAnnotation(
  position: positions_party_positions,
  decimalPlaces: number,
): LabelAnnotation {
  return {
    type: "label",
    id: "position",
    cells: [
      { label: "Position" },
      {
        label: `${formatNumber(position.averageEntryPrice, decimalPlaces)}`,
      },
      {
        label: `${getSignFromValue(Number(position.openVolume))}${Math.abs(
          Number(position.openVolume),
        )}`,
        fill: true,
      },
      {
        label: `${i18n.GLOBAL.pnl} ${formatNumber(
          position.unrealisedPNL,
          decimalPlaces,
        )}`,
        stroke: true,
      },
    ],
    intent: Number(position.unrealisedPNL) > 0 ? "success" : "danger",
    y: parseVegaDecimal(position.averageEntryPrice, decimalPlaces),
  };
}

export function createOrderLabelAnnotation(
  order: orders_orders,
  decimalPlaces: number,
  onOrderCancelled: (id: string) => void,
): LabelAnnotation {
  const cells: LabelAnnotationCell[] = [
    // Type and time-in-force
    {
      label: `${order.type ? i18n.ORDER_TYPE[order.type] : "-"} ${
        i18n.ORDER_TIF[order.timeInForce]
      }`,
      stroke: true,
    },
    // Price
    {
      label: `${formatNumber(order.price, order.market?.decimalPlaces ?? 0)}`,
    },
    // Size
    {
      label: `${getSignFromSide(order.side)}${Number(order.size)}`,
      stroke: true,
    },
  ];

  // Optional cancel button
  if (order.status === OrderStatus.Active) {
    cells.push({
      label: `${i18n.GLOBAL.cancel}`,
      onClick: () => onOrderCancelled(order.id),
      spinner: order.pending && order.pendingAction === PendingAction.Cancel,
    });
  }

  return {
    type: "label",
    id: order.id,
    cells: cells,
    intent: "danger",
    y: parseVegaDecimal(
      order.price,
      order.market?.decimalPlaces ?? decimalPlaces,
    ),
  };
}
