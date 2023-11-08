import "./plot-container.css";
import "../../../lib/d3fc-element";

import { Core } from "@ui/core";
import { asyncSnapshot, calculatePreferredSize } from "@util/misc";
import {
  Bounds,
  FcElement,
  Interval,
  PlotContainerElement,
  PriceMonitoringBounds,
  Scenegraph,
  Viewport,
} from "@util/types";
import { Allotment, AllotmentHandle, LayoutPriority } from "allotment";
import { throttle } from "lodash";
import {
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
  positionDecimalPlaces: number;
  priceMonitoringBounds: PriceMonitoringBounds[];
  scenegraph: Scenegraph;
  interval: Interval;
  initialViewport: Viewport;
  overlays: string[];
  simple: boolean;
  initialNumCandles: number;
  colors: Colors;
  studySize: number | string;
  studySizes: Array<number | string>;
  drawThrottleMs: number;
  onBoundsChanged?: (bounds: Bounds) => void;
  onViewportChanged?: (viewport: Viewport) => void;
  onRightClick?: (event: any) => void;
  onGetDataRange?: (from: Date, to: Date, interval: Interval) => void;
  onClosePane: (id: string) => void;
  onChangePane: (sizes: number[]) => void;
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
      positionDecimalPlaces,
      priceMonitoringBounds,
      overlays,
      simple,
      initialNumCandles,
      colors,
      studySize,
      studySizes,
      drawThrottleMs,
      onViewportChanged = () => {},
      onBoundsChanged = () => {},
      onRightClick = () => {},
      onGetDataRange = () => {},
      onClosePane,
      onChangePane,
      onRemoveOverlay,
    },
    ref,
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

    const onGetDataRangeThrottled = useMemo(
      () => throttle(onGetDataRange, 800),
      [onGetDataRange],
    );

    const snapshot = useCallback(() => asyncSnapshot(chartRef), []);
    const [bounds, setBounds] = useState<Bounds | null>(null);
    const [dataIndex, setDataIndex] = useState<number | null>(null);
    const chartRef = useRef<FcElement>(null!);
    const xAxisRef = useRef<HTMLDivElement>(null!);
    const allotmentRef = useRef<AllotmentHandle>(null!);

    const requestRedraw = useCallback(() => {
      chartRef.current?.requestRedraw();
    }, []);

    const throttleRequestRedraw = useMemo(
      () => throttle(requestRedraw, drawThrottleMs),
      [requestRedraw],
    );

    const handleBoundsChanged = useCallback(
      (bounds: Bounds) => {
        setBounds(bounds);
        onBoundsChanged?.(bounds);
      },
      [onBoundsChanged],
    );

    const handleThrottledBoundsChanged = useMemo(
      () => throttle(handleBoundsChanged, drawThrottleMs),
      [handleBoundsChanged],
    );

    const handleDataIndexChanged = useMemo(
      () => throttle(setDataIndex, drawThrottleMs),
      [],
    );

    const handleViewportChanged = useMemo(
      () => throttle(onViewportChanged, drawThrottleMs),
      [onViewportChanged],
    );

    const refs = useMemo(
      () =>
        scenegraph.panes
          .map((pane) => pane.id)
          .reduce(
            (acc, value) => {
              acc[value] = createRef<HTMLDivElement>();
              return acc;
            },
            {} as { [index: string]: React.RefObject<HTMLDivElement> },
          ),
      [scenegraph.panes],
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
          ]),
        ),
        {
          ref: xAxisRef,
          data: scenegraph.panes[0].originalData.map((d) => d.date),
        },
        initialViewport,
        decimalPlaces,
        positionDecimalPlaces,
        simple,
        initialNumCandles,
        colors,
      )
        .interval(interval)
        .on("redraw", () => {
          throttleRequestRedraw();
        })
        .on("bounds_changed", (bounds: Bounds) => {
          handleThrottledBoundsChanged(bounds);
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

      throttleRequestRedraw();
      requestAnimationFrame(
        () => chartElement.current?.initialize(initialViewport),
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
            ]),
          ),
          {
            ref: xAxisRef,
            data: scenegraph.panes[0].originalData.map((d) => d.date),
          },
        );

        throttleRequestRedraw();
      }
    }, [chartElement, refs, scenegraph.panes, throttleRequestRedraw]);

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
          proportionalLayout={false}
          onChange={(sizes) => {
            throttleRequestRedraw();
            onChangePane(sizes);
          }}
        >
          {scenegraph.panes.map((pane, index) => {
            const isMain = index === 0;
            // get size from studySizes option, skip main as that should
            // always render greedily
            const size = isMain ? undefined : studySizes[index - 1];
            const preferredSize = calculatePreferredSize(
              size,
              studySize,
              numPanes,
              isMain,
            );
            return (
              <Allotment.Pane
                key={pane.id}
                preferredSize={preferredSize}
                priority={isMain ? LayoutPriority.High : LayoutPriority.Low}
              >
                <PaneView
                  ref={refs[pane.id]}
                  bounds={bounds}
                  colors={colors}
                  dataIndex={dataIndex}
                  decimalPlaces={decimalPlaces}
                  positionDecimalPlaces={positionDecimalPlaces}
                  priceMonitoringBounds={priceMonitoringBounds}
                  overlays={overlays}
                  pane={pane}
                  simple={simple}
                  onClosePane={onClosePane}
                  onRemoveOverlay={onRemoveOverlay}
                />
              </Allotment.Pane>
            );
          })}
        </Allotment>
        <XAxisView ref={xAxisRef} simple={simple} />
      </d3fc-group>
    );
  },
);
