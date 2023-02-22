import "./plot-container.css";
import "../../../lib/d3fc-element";

import { Core } from "@ui/core";
import { THROTTLE_INTERVAL } from "@util/constants";
import { asyncSnapshot, calculatePreferredSize } from "@util/misc";
import {
  Bounds,
  FcElement,
  Interval,
  PlotContainerElement,
  Scenegraph,
  Viewport,
} from "@util/types";
import { Allotment, AllotmentHandle } from "allotment";
import { throttle } from "lodash";
import React, {
  createRef,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import { Colors } from "../../../feature/candlestick-chart/helpers";
import { XAxisView } from "..";
import { PaneView } from "../pane-view";

export type PlotContainerProps = {
  width: number;
  height: number;
  decimalPlaces: number;
  scenegraph: Scenegraph;
  interval: Interval;
  initialViewport: Viewport;
  overlays: string[];
  simple: boolean;
  initialNumCandles: number;
  colors: Colors;
  marketOpen: Date;
  studySize: number | string;
  onViewportChanged?: (viewport: Viewport) => void;
  onRightClick?: (event: any) => void;
  onGetDataRange?: (from: Date, to: Date, interval: Interval) => void;
  onClosePane: (id: string) => void;
  onRemoveOverlay: (id: string) => void;
};

export const PlotContainer = forwardRef<
  PlotContainerElement,
  PlotContainerProps
>(
  (
    {
      scenegraph,
      interval,
      initialViewport,
      decimalPlaces,
      overlays,
      simple,
      initialNumCandles,
      colors,
      marketOpen,
      studySize,
      onViewportChanged = () => {},
      onRightClick = () => {},
      onGetDataRange = () => {},
      onClosePane,
      onRemoveOverlay,
    },
    ref
  ) => {
    useImperativeHandle(ref, () => ({
      panBy: (n: number) => {
        chartElement.current?.panBy(n);
      },
      reset: () => {
        chartElement.current?.reset();
      },
      snapshot: async () => {
        return snapshot();
      },
      zoomIn: (delta: number) => {
        chartElement.current?.zoomIn(delta);
      },
      zoomOut: (delta: number) => {
        chartElement.current?.zoomOut(delta);
      },
    }));

    const onViewportChangedThrottled = useMemo(
      () => throttle(onViewportChanged, 200),
      [onViewportChanged]
    );

    const onGetDataRangeThrottled = useMemo(
      () => throttle(onGetDataRange, 800),
      [onGetDataRange]
    );

    const snapshot = useCallback(() => asyncSnapshot(chartRef), []);
    const [bounds, setBounds] = useState<Bounds | null>(null);
    const [dataIndex, setDataIndex] = useState<number | null>(null);
    const chartRef = useRef<FcElement>(null!);
    const xAxisRef = useRef<HTMLDivElement>(null!);
    const allotmentRef = useRef<AllotmentHandle>(null!);

    const handleBoundsChanged = useMemo(
      () => throttle(setBounds, THROTTLE_INTERVAL),
      []
    );

    const handleDataIndexChanged = useMemo(
      () => throttle(setDataIndex, THROTTLE_INTERVAL),
      []
    );

    const handleViewportChanged = useMemo(
      () => throttle(onViewportChanged, THROTTLE_INTERVAL),
      [onViewportChanged]
    );

    const refs = useMemo(
      () =>
        scenegraph.panes
          .map((pane) => pane.id)
          .reduce((acc, value) => {
            acc[value] = createRef<HTMLDivElement>();
            return acc;
          }, {} as { [index: string]: React.RefObject<HTMLDivElement> }),
      [scenegraph.panes]
    );

    const chartElement = useRef<Core | null>(null);

    useEffect(() => {
      chartElement.current = new Core(
        Object.fromEntries(
          scenegraph.panes.map((pane) => [
            pane.id,
            {
              id: String(pane.id),
              ref: refs[pane.id],
              data: pane.originalData,
              renderableElements: pane.renderableElements.flat(1),
              yEncodingFields: pane.yEncodingFields,
              labels: pane.labels ?? [],
              labelLines: pane.labelLines ?? [],
            },
          ])
        ),
        {
          ref: xAxisRef,
          data: scenegraph.panes[0].originalData.map((d) => d.date),
        },
        initialViewport,
        decimalPlaces,
        simple,
        initialNumCandles,
        colors,
        marketOpen
      )
        .interval(interval)
        .on("redraw", () => {
          chartRef.current?.requestRedraw();
        })
        .on("bounds_changed", (bounds: Bounds) => {
          handleBoundsChanged(bounds);
        })
        .on("viewport_changed", (viewport: Viewport) => {
          handleViewportChanged(viewport);
        })
        .on("mousemove", (index: number, id: string) => {
          handleDataIndexChanged(index);
        })
        .on("mouseout", () => {
          handleDataIndexChanged(null);
        })
        .on("fetch_data", (from: Date, to: Date) => {
          onGetDataRangeThrottled(from, to, interval);
        })
        .on("contextmenu", (event: any) => {
          onRightClick(event);
        });

      chartRef.current?.requestRedraw();

      requestAnimationFrame(() =>
        chartElement.current?.initialize(initialViewport)
      );

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update interval and fetch data callback
    useEffect(() => {
      if (chartElement.current) {
        chartElement.current
          .interval(interval)
          .on("fetch_data", (from: Date, to: Date) => {
            onGetDataRangeThrottled(from, to, interval);
          });
      }
    }, [interval, onGetDataRangeThrottled]);

    useEffect(() => {
      if (chartElement.current) {
        chartElement.current.update(
          Object.fromEntries(
            scenegraph.panes.map((pane) => [
              pane.id,
              {
                id: String(pane.id),
                ref: refs[pane.id],
                data: pane.originalData,
                renderableElements: pane.renderableElements.flat(1),
                yEncodingFields: pane.yEncodingFields,
                labels: pane.labels ?? [],
                labelLines: pane.labelLines ?? [],
              },
            ])
          ),
          {
            ref: xAxisRef,
            data: scenegraph.panes[0].originalData.map((d) => d.date),
          }
        );

        chartRef.current?.requestRedraw();
      }
    }, [chartElement, refs, scenegraph.panes]);

    useEffect(() => {
      if (chartElement.current) {
        chartElement.current.interval(interval);
      }
    }, [interval]);

    useEffect(() => {
      if (chartElement.current) {
        chartElement.current.colors = colors;
      }
    }, [colors]);

    const numPanes = scenegraph.panes.length;

    useEffect(() => {
      allotmentRef.current.reset();
    }, [numPanes, studySize]);

    return (
      <d3fc-group ref={chartRef} class="plot-container__chart">
        <Allotment
          ref={allotmentRef}
          minSize={20}
          vertical
          onChange={(_sizes) => {
            if (typeof chartRef.current?.requestRedraw === "function") {
              chartRef.current?.requestRedraw();
            }
          }}
        >
          {scenegraph.panes.map((pane, index) => (
            <Allotment.Pane
              key={pane.id}
              preferredSize={calculatePreferredSize(
                studySize,
                numPanes,
                index === 0
              )}
            >
              <PaneView
                ref={refs[pane.id]}
                bounds={bounds}
                colors={colors}
                dataIndex={dataIndex}
                decimalPlaces={decimalPlaces}
                overlays={overlays}
                pane={pane}
                simple={simple}
                onClosePane={onClosePane}
                onRemoveOverlay={onRemoveOverlay}
              />
            </Allotment.Pane>
          ))}
        </Allotment>
        <XAxisView ref={xAxisRef} simple={simple} />
      </d3fc-group>
    );
  }
);
