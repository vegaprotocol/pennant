import "./pane-view.css";
import "@d3fc/d3fc-element";

import { forwardRef, useState } from "react";

import { Y_AXIS_WIDTH } from "../../constants";
import { formatter } from "../../helpers";
import { Bounds, Pane } from "../../types";
import { IndicatorInfo } from "../indicator-info";
import { CloseButton } from "./close-button";
import { getIntent, getStudyInfoFieldValue, studyInfoFields } from "./helpers";

export type PaneViewProps = {
  bounds: Bounds | null;
  dataIndex: number | null;
  decimalPlaces: number;
  overlays: string[];
  pane: Pane;
  simple: boolean;
  onClosePane: (id: string) => void;
};

export const PaneView = forwardRef<HTMLDivElement, PaneViewProps>(
  (
    { bounds, dataIndex, decimalPlaces, overlays, pane, simple, onClosePane },
    ref
  ) => {
    const [showPaneControls, setShowPaneControls] = useState<string | null>(
      null
    );

    return (
      <div
        ref={ref}
        className="pane__pane"
        onMouseOver={() => setShowPaneControls(pane.id)}
        onMouseOut={() => setShowPaneControls(null)}
      >
        <d3fc-canvas class="plot-area" use-device-pixel-ratio />
        <d3fc-svg class="plot-area-interaction" />
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
        {pane.id !== "main" && (
          <div
            className="pane__close-button-wrapper"
            style={{
              right: `${Y_AXIS_WIDTH}px`,
              opacity: showPaneControls === pane.id ? 1 : 0,
              visibility: showPaneControls === pane.id ? "visible" : "hidden",
            }}
          >
            <div
              className="pane__close-button"
              onClick={() => {
                onClosePane(pane.id);
              }}
            >
              <CloseButton size={16} />
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
                  field.id
                );

                return {
                  id: field.id,
                  label: field.label,
                  value: field.format
                    ? field.format(value, decimalPlaces)
                    : formatter(value, decimalPlaces),
                  intent: getIntent(field, value),
                };
              }
            )}
          />

          {pane.id === "main" &&
            overlays.map((overlay) => (
              <IndicatorInfo
                key={studyInfoFields[overlay].label}
                title={studyInfoFields[overlay].label}
                info={studyInfoFields[overlay].fields.map((field) => {
                  const value = getStudyInfoFieldValue(
                    pane.originalData,
                    dataIndex,
                    field.id
                  );

                  return {
                    id: field.id,
                    label: field.label,
                    value: field.format
                      ? field.format(value, decimalPlaces)
                      : formatter(value, decimalPlaces),
                  };
                })}
              />
            ))}
        </div>
      </div>
    );
  }
);
