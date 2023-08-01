import "./pane-view.css";

import { Y_AXIS_WIDTH } from "@util/constants";
import { formatter } from "@util/misc";
import { Bounds, Pane, PriceMonitoringBounds } from "@util/types";
import { forwardRef, useState } from "react";

import {
  Colors,
  getAccentColor,
} from "../../../feature/candlestick-chart/helpers";
import { CloseButton, IndicatorInfo } from "..";
import { getIntent, getStudyInfoFieldValue, studyInfoFields } from "./helpers";

export type PaneViewProps = {
  bounds: Bounds | null;
  colors: Colors;
  dataIndex: number | null;
  decimalPlaces: number;
  positionDecimalPlaces: number;
  priceMonitoringBounds: PriceMonitoringBounds[];
  overlays: string[];
  pane: Pane;
  simple: boolean;
  onClosePane: (id: string) => void;
  onRemoveOverlay: (id: string) => void;
};

export const PaneView = forwardRef<HTMLDivElement, PaneViewProps>(
  (
    {
      bounds,
      colors,
      dataIndex,
      decimalPlaces,
      positionDecimalPlaces,
      priceMonitoringBounds,
      overlays,
      pane,
      simple,
      onClosePane,
      onRemoveOverlay,
    },
    ref,
  ) => {
    const [showPaneControls, setShowPaneControls] = useState<string | null>(
      null,
    );

    const volume = getStudyInfoFieldValue(
      pane.originalData,
      dataIndex,
      "volume",
    );

    const noTrading = volume === 0;

    let colorCount = 0;

    return (
      <div
        ref={ref}
        className="pane__pane"
        onMouseOver={() => setShowPaneControls(pane.id)}
        onMouseOut={() => setShowPaneControls(null)}
      >
        <d3fc-canvas class="plot-area" use-device-pixel-ratio />
        {!simple && <d3fc-svg class="plot-area-interaction" />}
        <div className="plot-area-annotations" />
        <d3fc-canvas
          class="y-axis"
          use-device-pixel-ratio
          style={{ width: simple ? 0 : "100%" }}
        />
        <d3fc-svg
          class="y-axis-interaction"
          style={{
            width: simple ? 0 : `${Y_AXIS_WIDTH}px`,
          }}
        />
        {pane.id !== "main" && !simple && (
          <div
            className="pane__close-button-wrapper"
            style={{
              right: `${Y_AXIS_WIDTH}px`,
              opacity: showPaneControls === pane.id ? 1 : 0,
              visibility: showPaneControls === pane.id ? "visible" : "hidden",
            }}
          >
            <div className="pane__close-button">
              <CloseButton
                onClick={() => {
                  onClosePane(pane.id);
                }}
              />
            </div>
          </div>
        )}
        <div
          className="pane__info-overlay"
          style={{ alignItems: simple ? "flex-end" : "flex-start" }}
        >
          <IndicatorInfo
            title={studyInfoFields[simple ? "simple" : pane.id].label}
            info={studyInfoFields[simple ? "simple" : pane.id].fields.map(
              (field) => {
                const value = getStudyInfoFieldValue(
                  pane.originalData,
                  dataIndex,
                  field.id,
                );

                const places =
                  field.id === "volume" ? positionDecimalPlaces : decimalPlaces;

                return {
                  id: field.id,
                  label: field.label,
                  value: field.format
                    ? field.format(value, places)
                    : formatter(value, places),
                  displayWhileNoTrading: field.displayWhileNoTrading,
                  intent: getIntent(field, value),
                };
              },
            )}
            noTrading={noTrading}
          />

          {pane.id === "main" &&
            overlays.map((overlay) => {
              if (overlay === "priceMonitoringBounds") {
                // Cap at 4 bounds for the UI
                return priceMonitoringBounds.slice(0, 4).map((_bounds, i) => (
                  <IndicatorInfo
                    key={studyInfoFields[`priceMonitoringBounds${i + 1}`].label}
                    title={
                      studyInfoFields[`priceMonitoringBounds${i + 1}`].label
                    }
                    info={studyInfoFields[
                      `priceMonitoringBounds${i + 1}`
                    ].fields.map((field) => {
                      const value = getStudyInfoFieldValue(
                        pane.originalData,
                        dataIndex,
                        field.id,
                      );

                      return {
                        id: field.id,
                        label: field.label,
                        value: field.format
                          ? field.format(value, decimalPlaces)
                          : formatter(value, decimalPlaces),
                        color: colors[getAccentColor(colorCount++)],
                      };
                    })}
                    noTrading={noTrading}
                    closeable
                    onClose={() => {
                      onRemoveOverlay(overlay);
                    }}
                  />
                ));
              }

              return (
                <IndicatorInfo
                  key={studyInfoFields[overlay].label}
                  title={studyInfoFields[overlay].label}
                  info={studyInfoFields[overlay].fields.map((field) => {
                    const value = getStudyInfoFieldValue(
                      pane.originalData,
                      dataIndex,
                      field.id,
                    );

                    return {
                      id: field.id,
                      label: field.label,
                      value: field.format
                        ? field.format(value, decimalPlaces)
                        : formatter(value, decimalPlaces),
                      color: colors[getAccentColor(colorCount++)],
                    };
                  })}
                  noTrading={noTrading}
                  closeable
                  onClose={() => {
                    onRemoveOverlay(overlay);
                  }}
                />
              );
            })}
        </div>
      </div>
    );
  },
);
