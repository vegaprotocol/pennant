import "./price-monitoring-info.scss";

export type PriceMonitoringInfoProps = {
  priceMonitoringBounds: {
    minValidPrice: number;
    maxValidPrice: number;
    referencePrice: number;
  };
  decimalPlaces: number;
};

export const PriceMonitoringInfo = ({
  priceMonitoringBounds,
  decimalPlaces,
}: PriceMonitoringInfoProps) => {
  return (
    <div className="price-monitoring-info-wrapper">
      <div>
        <span className="text-muted">Price monitoring triggers: </span>
      </div>
      <div>
        <span className="text-muted">Minimum valid price: </span>
        <span className="monospace-text">
          {priceMonitoringBounds.minValidPrice.toFixed(decimalPlaces)}
        </span>
      </div>
      <div>
        <span className="text-muted">Maximum valid price: </span>
        <span className="monospace-text">
          {priceMonitoringBounds.maxValidPrice.toFixed(decimalPlaces)}
        </span>
      </div>
    </div>
  );
};
