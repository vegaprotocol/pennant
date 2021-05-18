import {
  OrderRejectionReason,
  OrderStatus,
  OrderTimeInForce,
  OrderType,
  PeggedReference,
  PendingAction,
  Side,
} from "..";

export interface orders_orders {
  __typename: "Order";
  /**
   * Hash of the order data
   */
  id: string;
  /**
   * The worst price the order will trade at (e.g. buy for price or less, sell for price or more) (uint64)
   */
  price: string;
  /**
   * Total number of contracts that may be bought or sold (immutable) (uint64)
   */
  size: string;
  /**
   * RFC3339Nano time the order was altered
   */
  updatedAt: string | null;
  /**
   * RFC3339Nano formatted date and time for when the order was created (timestamp)
   */
  createdAt: string;
  /**
   * The timeInForce of order (determines how and if it executes, and whether it persists on the book)
   */
  timeInForce: OrderTimeInForce;
  /**
   * Whether the order is to buy or sell
   */
  side: Side;
  /**
   * The status of an order, for example 'Active'
   */
  status: OrderStatus;
  /**
   * The trader who place the order (probably stored internally as the trader's public key)
   */
  party: orders_orders_party;
  /**
   * The external reference (if available) for the order
   */
  reference: string;
  /**
   * Number of contracts remaining of the total that have not yet been bought or sold (uint64)
   */
  remaining: string;
  /**
   * Type the order type (defaults to TRADER)
   */
  type: OrderType | null;
  /**
   * The market the order is trading on (probably stored internally as a hash of the market details)
   */
  market: orders_orders_market | null;
  /**
   * The liquidity provision this order was created from
   */
  liquidityProvision: orders_orders_liquidityProvision | null;
  /**
   * PeggedOrder contains the details about a pegged order
   */
  peggedOrder: orders_orders_peggedOrder | null;
  /**
   * Expiration time of this order (ISO-8601 RFC3339+Nano formatted date)
   */
  expiresAt: string | null;
  /**
   * Reason for the order to be rejected
   */
  rejectionReason: OrderRejectionReason | null;
  /**
   * Whether or the not the order is processing on the blockchain
   */
  pending: boolean;
  pendingAction: PendingAction;
}

export interface orders_orders_party {
  __typename: "Party";
  /**
   * Party identifier
   */
  id: string;
}

export interface orders_orders_market {
  __typename: "Market";
  /**
   * Market ID
   */
  id: string;
  /**
   * decimalPlaces indicates the number of decimal places that an integer must be shifted by in order to get a correct
   * number denominated in the currency of the Market. (uint64)
   *
   * Examples:
   * Currency     Balance  decimalPlaces  Real Balance
   * GBP              100              0       GBP 100
   * GBP              100              2       GBP   1.00
   * GBP              100              4       GBP   0.01
   * GBP                1              4       GBP   0.0001   (  0.01p  )
   *
   * GBX (pence)      100              0       GBP   1.00     (100p     )
   * GBX (pence)      100              2       GBP   0.01     (  1p     )
   * GBX (pence)      100              4       GBP   0.0001   (  0.01p  )
   * GBX (pence)        1              4       GBP   0.000001 (  0.0001p)
   */
  decimalPlaces: number;
  /**
   * An instance of or reference to a tradable instrument.
   */
  tradableInstrument: orders_orders_market_tradableInstrument;
}

export interface orders_orders_liquidityProvision {
  __typename: "LiquidityProvision";
  /**
   * Unique identifier for the order (set by the system after consensus)
   */
  id: string | null;
}

export interface orders_orders_peggedOrder {
  __typename: "PeggedOrder";
  /**
   * Price offset from the peg
   */
  offset: string;
  /**
   * Index to link this order to
   */
  reference: PeggedReference;
}

export interface orders_orders_market_tradableInstrument {
  __typename: "TradableInstrument";
  /**
   * An instance of or reference to a fully specified instrument.
   */
  instrument: orders_orders_market_tradableInstrument_instrument;
}

export interface orders_orders_market_tradableInstrument_instrument {
  __typename: "Instrument";
  /**
   * Uniquely identify an instrument accrods all instruments available on Vega (string)
   */
  id: string;
  /**
   * Full and fairly descriptive name for the instrument
   */
  name: string;
  /**
   * A short non necessarily unique code used to easily describe the instrument (e.g: FX:BTCUSD/DEC18) (string)
   */
  code: string;
}
