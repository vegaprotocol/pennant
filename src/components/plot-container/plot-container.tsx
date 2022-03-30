import "./plot-container.css";
import "../../lib/d3fc-element";

import { Allotment } from "allotment";
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

import { THROTTLE_INTERVAL } from "../../constants";
import { Core } from "../../core";
import { asyncSnapshot } from "../../helpers";
import {
  Bounds,
  PlotContainerElement,
  Scenegraph,
  Viewport,
} from "../../types";
import { FcElement, Interval } from "../../types";
import { PaneView } from "../pane-view";
import { XAxisView } from "../x-axis-view";

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
  onViewportChanged?: (viewport: Viewport) => void;
  onRightClick?: (event: any) => void;
  onGetDataRange?: (from: Date, to: Date, interval: Interval) => void;
  onClosePane: (id: string) => void;
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
      onViewportChanged = () => {},
      onRightClick = () => {},
      onGetDataRange = () => {},
      onClosePane,
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
        initialNumCandles
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

    const showStudy = scenegraph.panes.length === 2;

    useEffect(() => {
      if (chartElement.current) {
        chartElement.current.interval(interval);
      }
    }, [interval]);

    return (
      <d3fc-group ref={chartRef} class="plot-container__chart">
        <Allotment
          minSize={100}
          vertical
          onChange={(_sizes) => {
            if (typeof chartRef.current?.requestRedraw === "function") {
              chartRef.current?.requestRedraw();
            }
          }}
        >
          <PaneView
            ref={refs[scenegraph.panes[0].id]}
            bounds={bounds}
            dataIndex={dataIndex}
            decimalPlaces={decimalPlaces}
            overlays={overlays}
            pane={scenegraph.panes[0]}
            simple={simple}
            onClosePane={onClosePane}
          />
          <Allotment.Pane visible={showStudy}>
            {showStudy ? (
              <PaneView
                ref={refs[scenegraph.panes[1].id]}
                bounds={bounds}
                dataIndex={dataIndex}
                decimalPlaces={decimalPlaces}
                overlays={overlays}
                pane={scenegraph.panes[1]}
                simple={simple}
                onClosePane={onClosePane}
              />
            ) : (
              <div>No study selected</div>
            )}
          </Allotment.Pane>
        </Allotment>

        <XAxisView ref={xAxisRef} simple={simple} />
      </d3fc-group>
    );
  }
);
