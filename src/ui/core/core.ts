import { RenderableHTMLElement } from "@ui/elements";
import {
  DEFAULT_INTERVAL_WIDTH,
  INITIAL_NUM_CANDLES_TO_DISPLAY,
  MAX_ZOOM,
  MIN_ZOOM,
  Y_AXIS_WIDTH,
} from "@util/constants";
import { getSubMinutes } from "@util/misc";
import {
  Interval,
  RenderableElement,
  ScaleLinear,
  ScaleTime,
  Viewport,
} from "@util/types";
import { dispatch } from "d3-dispatch";
import { scaleLinear, scaleTime } from "d3-scale";
import { select, Selection } from "d3-selection";
import {
  zoom as d3Zoom,
  ZoomBehavior,
  zoomIdentity,
  ZoomTransform,
  zoomTransform,
} from "d3-zoom";
import { compareAsc } from "date-fns";
import { difference, intersection, omit, union } from "lodash";
import { MutableRefObject } from "react";

import { Colors } from "../../feature/candlestick-chart/helpers";
import {
  drawPlotArea,
  drawPlotAreaInteraction,
  drawXAxis,
  drawYAxis,
  handleMousemove,
  handleMouseout,
  handleXAxisDrag,
  handleYAxisDrag,
  handleZoom,
  handleZoomend,
  handleZoomstart,
  measureXAxis,
  measureYAxis,
  recalculateScale,
} from "./helpers";
import { PlotArea } from "./plot-area";
import { PlotAreaAnnotations } from "./plot-area-annotations";
import { PlotAreaInteraction } from "./plot-area-interaction";
import { XAxis } from "./x-axis";
import { XAxisInteraction } from "./x-axis-interaction";
import { YAxis } from "./y-axis";
import { YAxisInteraction } from "./y-axis-interaction";

// Padding between center of right-most candle and y-axis or right hand edge
function getCandlePadding(isSimple: boolean, intervalWidth: number) {
  return (isSimple ? 0 : Y_AXIS_WIDTH) + (isSimple ? 0.5 : 3) * intervalWidth;
}

export type Panes<T> = { [id: string]: T };

type ChartPane = {
  id: string;
  ref: React.RefObject<HTMLDivElement>;
  data: any[];
  renderableElements: RenderableElement[];
  yEncodingFields: string[];
  labels: RenderableHTMLElement[];
  labelLines: RenderableElement[];
};

/**
 * The Core class renders multiple plot areas which share a common x-axis.
 *
 * Zooming and panning of plot areas is supported. Dragging the axes will zoom the apprpriate dimension.
 */
export class Core {
  private listeners = dispatch(
    "bounds_changed",
    "click",
    "contextmenu",
    "dblclick",
    "drag",
    "dragend",
    "dragstart",
    "fetch_data",
    "mousemove",
    "mouseout",
    "mouseover",
    "redraw",
    "rightclick",
    "viewport_changed",
  );

  private _interval: Interval = Interval.I1M;

  private _decimalPlaces = 5;
  private _positionDecimalPlaces = 3;
  private initialNumCandles = INITIAL_NUM_CANDLES_TO_DISPLAY;

  // Modes
  private isPinned = true;
  private isFreePan = false;

  private isSimple = false;
  private _colors: Colors;

  // Data
  private dates: Date[];

  // x-axis
  private xAxis: XAxis;
  private xAxisInteraction: XAxisInteraction;
  private xElement: Selection<Element, any, null, any>;
  private xScale: ScaleTime;
  private xTransform: () => ZoomTransform;
  private xZoom: ZoomBehavior<Element, unknown>;

  // y-axis
  private yAxes: Panes<YAxis>;
  private yAxisInteractions: Panes<YAxisInteraction>;
  private yElements: Panes<Selection<Element, any, null, any>>;
  private yScales: Panes<ScaleLinear>;
  private yTransforms: Panes<() => ZoomTransform>;
  private yZooms: Panes<ZoomBehavior<Element, unknown>>;

  // plot-area
  private plotAreas: Panes<PlotArea>;
  private plotAreaInteractions: Panes<PlotAreaInteraction>;
  private plotAreaAnnotations: Panes<PlotAreaAnnotations>;
  private plotAreaElements: Panes<Selection<Element, any, null, any>>;

  constructor(
    panes: Panes<ChartPane>,
    axis: { ref: MutableRefObject<HTMLDivElement>; data: any[] },
    initialViewport: Viewport,
    decimalPlaces: number = 5,
    positionDecimalPlaces: number = 0,
    simple = false,
    initialNumCandles = 24,
    colors: Colors,
  ) {
    this._decimalPlaces = decimalPlaces;
    this._positionDecimalPlaces = positionDecimalPlaces;
    this.isSimple = simple;
    this.initialNumCandles = initialNumCandles;
    this._colors = colors;

    // x-axis
    this.dates = axis.data;
    this.xScale = scaleTime();
    this.xZoom = d3Zoom().scaleExtent([MIN_ZOOM, MAX_ZOOM]);
    this.xElement = select(axis.ref.current)
      .select<Element>(".x-axis")
      .style("pointer-events", "none");

    this.xAxis = new XAxis(this.xScale, this._interval, colors);
    this.xAxisInteraction = new XAxisInteraction()
      .on("drag", (e) => {
        handleXAxisDrag(
          this.xElement,
          this.xZoom,
          e,
          this.xScale,
          this.isPinned,
          this.xTransform,
          this.xAxis,
          this.plotAreas,
          this.yAxes,
          (bounds: [Date, Date]) =>
            this.listeners.call("bounds_changed", this, bounds),
          () => this.listeners.call("redraw"),
        );
      })
      .on("dblclick", () => {
        this.resetXAxis();
        this.isPinned = true;
        this.listeners.call("redraw");
      });

    this.xTransform = () => zoomTransform(this.xElement.node()!);

    // y-axis
    this.yScales = Object.fromEntries(
      Object.keys(panes).map((id) => [id, scaleLinear()]),
    );

    this.yAxes = Object.fromEntries(
      Object.entries(this.yScales).map(([id, scale]) => [
        id,
        new YAxis(
          this.xScale,
          scale,
          id === "volume" ? this._positionDecimalPlaces : this._decimalPlaces,
          this._colors,
        ),
      ]),
    );

    this.yAxisInteractions = Object.fromEntries(
      Object.keys(panes).map((id) => [
        id,
        new YAxisInteraction()
          .on("drag", (e) => {
            handleYAxisDrag(
              this.yElements[id],
              this.yZooms[id],
              e,
              this.yScales[id],
              this.yTransforms[id],
              this.plotAreas[id],
              this.yAxes[id],
              (isFreePan: boolean) => {
                this.isFreePan = isFreePan;
              },
              () => this.listeners.call("redraw"),
            );
          })
          .on("dblclick", () => {
            this.resetYAxis(id);
            this.isFreePan = false;
            this.listeners.call("redraw");
          }),
      ]),
    );

    this.yElements = Object.fromEntries(
      Object.entries(panes).map(([id, pane]) => [
        id,
        select(pane.ref.current)
          .select<Element>(".y-axis")
          .style("pointer-events", "none"),
      ]),
    );

    // plot-area
    this.plotAreas = Object.fromEntries(
      Object.entries(panes).map(([id, pane]) => [
        pane.id,
        new PlotArea(
          this.xScale,
          this.yScales[id],
          pane.renderableElements.flat(1),
          pane.data,
          pane.yEncodingFields,
          pane.labelLines,
          this.isSimple,
          this._colors,
        ),
      ]),
    );

    this.plotAreaInteractions = Object.fromEntries(
      Object.keys(panes).map((id) => [
        id,
        new PlotAreaInteraction(this.xScale, this.yScales[id])
          .on("zoom", (_e: any, t: any, point: [number, number]) => {
            handleZoom(
              this.xScale,
              this.yScales,
              this.xAxis,
              this.yAxes,
              this.xElement,
              this.xZoom,
              this.xTransform,
              this.yElements,
              this.yTransforms,
              this.yZooms,
              this.plotAreas,
              this.isPinned,
              this.isFreePan,
              this.isSimple,
              this.dates,
              t,
              point,
              id,
              (bounds: [Date, Date]) => {
                this.listeners.call("bounds_changed", this, bounds);
              },
              () => this.listeners.call("redraw"),
              (from: Date, to: Date) =>
                this.listeners.call("fetch_data", this, from, to),
              (isPinned) => {
                this.isPinned = isPinned;
              },
            );
          })
          .on("zoomstart", () => {
            handleZoomstart(this.plotAreas, this.yAxes, this.xAxis);
          })
          .on("zoomend", (offset: [number, number]) => {
            handleZoomend(
              this.plotAreas,
              offset,
              this.yTransforms[id]().rescaleY(this.yScales[id]),
              this.xAxis,
              this.yAxes[id],
              id,
              () => this.listeners.call("redraw"),
            );
          })
          .on("dblclick", () => {
            this.reset();
            this.listeners.call("dblclick", this);
          })
          .on("mousemove", (offset: [number, number]) => {
            handleMousemove(
              this.plotAreas,
              offset,
              this.yTransforms[id]().rescaleY(this.yScales[id]),
              this.yAxes,
              this.xAxis,
              id,
              (index, id) => this.listeners.call("mousemove", this, index, id),
              () => this.listeners.call("redraw"),
            );
          })
          .on("mouseout", () => {
            handleMouseout(
              this.plotAreas,
              this.xAxis,
              this.yAxes,
              () => this.listeners.call("redraw"),
              () => this.listeners.call("mouseout", this),
            );
          })
          .on("contextmenu", (event) => {
            this.listeners.call("contextmenu", this, event);
          }),
      ]),
    );

    this.plotAreaAnnotations = Object.fromEntries(
      Object.entries(panes).map(([id, value]) => [
        value.id,
        new PlotAreaAnnotations(
          this.xScale,
          this.yScales[id],
          panes[id].labels,
        ),
      ]),
    );

    this.plotAreaElements = Object.fromEntries(
      Object.entries(panes).map(([id, area]) => [
        id,
        select<Element, any>(area.ref.current!)
          .select<Element>(".plot-area")
          .style("pointer-events", "none"),
      ]),
    );

    this.yTransforms = Object.fromEntries(
      Object.entries(this.yElements).map(([id, yElement]) => [
        id,
        () => zoomTransform(yElement.node()!),
      ]),
    );

    // Configure
    Object.entries(this.yScales).forEach(([id, scale]) => {
      scale.domain(this.plotAreas[id].extent());
    });

    this.yZooms = Object.fromEntries(
      Object.keys(panes).map((id) => [id, d3Zoom<Element, unknown>()]),
    );

    this.xElement.call(this.xZoom);

    Object.entries(this.plotAreaElements).forEach(([id, plotAreaElement]) =>
      plotAreaElement.call(this.yZooms[id]),
    );

    // Measure and draw
    select<HTMLDivElement, unknown>(axis.ref.current)
      .select(".x-axis")
      .on("measure", (event) => {
        measureXAxis(
          event,
          this.xScale,
          this.xZoom,
          this.xTransform,
          this.xAxis,
          this.yAxes,
          this.plotAreas,
          this.dates,
          (bounds: [Date, Date]) => {
            this.listeners.call("bounds_changed", this, bounds);
          },
        );
      })
      .on("draw", (event) => {
        drawXAxis(event, this.xAxis);
      });

    select<HTMLDivElement, unknown>(axis.ref.current)
      .select(".x-axis-interaction")
      .on("draw", (event) => {
        this.xAxisInteraction.draw(select(event.currentTarget).select("svg"));
      });

    Object.entries(this.yScales).map(([id, scale]) =>
      select<HTMLDivElement, unknown>(panes[id].ref.current!)
        .select(".y-axis")
        .on("measure", (event) => {
          measureYAxis(
            event,
            scale,
            this.yTransforms[id],
            this.plotAreas[id],
            this.plotAreaInteractions[id],
            this.plotAreaAnnotations[id],
            this.yAxes[id],
            this.isFreePan,
            id,
            this.resetYAxis.bind(this),
          );
        })
        .on("draw", (event) => {
          drawYAxis(event, this.yAxes[id]);
        }),
    );

    Object.entries(panes).forEach(([id, area]) =>
      select<HTMLDivElement, unknown>(area.ref.current!)
        .select(".y-axis-interaction")
        .on("draw", (event) => {
          this.yAxisInteractions[id].draw(
            select(event.currentTarget).select("svg"),
          );
        }),
    );

    Object.entries(panes).forEach(([id, area]) => {
      const selection = select<Element, any>(area.ref.current!).select<Element>(
        ".plot-area-annotations",
      );

      select<HTMLDivElement, unknown>(area.ref.current!)
        .select(".plot-area")
        .on("draw", (event) => {
          drawPlotArea(event, this.plotAreas[id]);

          this.plotAreaAnnotations[id].draw(selection);
        });
    });

    Object.entries(panes).forEach(([id, area]) => {
      select<HTMLDivElement, unknown>(area.ref.current!)
        .select(".plot-area-interaction")
        .on("draw", (event) => {
          drawPlotAreaInteraction(event, this.plotAreaInteractions[id]);
        });
    });

    // Update latest price
    const latestPrice = panes["main"].data[panes["main"].data.length - 1].close;

    this.yAxes["main"].latestPrice(latestPrice);
    this.plotAreas["main"].latestPrice(latestPrice);
  }

  draw() {
    this.listeners.call("redraw");
  }

  interval(interval: Interval): this {
    this._interval = interval;
    this.xAxis.interval(interval);
    this.initialize();

    return this;
  }

  on(typenames: string, callback: (this: object, ...args: any[]) => void) {
    this.listeners.on(typenames, callback);
    return this;
  }

  panBy(n: number): void {
    const xr = this.xTransform().rescaleX(this.xScale);

    this.xElement.call(
      this.xZoom.translateBy,
      -(
        this.xScale(1000 * 60 * getSubMinutes(this._interval, n)) -
        this.xScale(0)
      ),
      0,
    );

    this.xAxis.xScale(xr);

    Object.entries(this.plotAreas).forEach(([id, plotArea]) => {
      plotArea.xScale(xr);

      if (!this.isFreePan) {
        recalculateScale(
          this.xTransform,
          this.xScale,
          this.yScales,
          id,
          this.plotAreas,
          this.yElements,
          this.yZooms,
        );
      }
    });

    this.isPinned = false;

    this.listeners.call("redraw");
    this.listeners.call("bounds_changed", this, xr.domain());
  }

  initialize(initialViewport?: Viewport): void {
    let viewport = initialViewport;

    if (!viewport) {
      viewport = {
        date: this.dates[this.dates.length - 1],
        intervalWidth: 10,
      };
    }

    this.resetXAxis();

    Object.keys(this.yAxes).map((id) => {
      this.resetYAxis(id);
    });

    this.isPinned = true;
    this.isFreePan = false;

    this.listeners.call("redraw");
    this.listeners.call(
      "bounds_changed",
      this,
      this.xTransform().rescaleX(this.xScale).domain(),
    );
  }

  reset(): void {
    this.resetXAxis();

    Object.keys(this.yAxes).map((id) => {
      this.resetYAxis(id);
    });

    this.isPinned = true;
    this.isFreePan = false;

    this.listeners.call("redraw");
  }

  pinXAxis(): void {
    const width = this.xScale.range()[1] - this.xScale.range()[0];

    const intervalWidth =
      width / this.initialNumCandles ?? DEFAULT_INTERVAL_WIDTH;

    const xr = this.xTransform().rescaleX(this.xScale);

    const latestDate = this.dates[this.dates.length - 1];
    const previousLatestDate = xr.invert(
      xr.range()[1] - getCandlePadding(this.isSimple, intervalWidth),
    );

    if (compareAsc(latestDate, previousLatestDate) === 1) {
      const difference = xr(latestDate) - xr(previousLatestDate);

      this.xElement.call(this.xZoom.translateBy, -difference, 0);
    }
  }

  resetXAxis(): void {
    const latestDate = this.dates[this.dates.length - 1];

    const width = this.xScale.range()[1] - this.xScale.range()[0];

    const intervalWidth =
      width / this.initialNumCandles ?? DEFAULT_INTERVAL_WIDTH;

    const ratio =
      width /
      (this.xScale.range()[1] -
        getCandlePadding(this.isSimple, intervalWidth) -
        this.xScale.range()[0]);

    const date0 = new Date(
      latestDate.getTime() -
        (Math.abs(
          this.xScale.range()[1] -
            this.xScale.range()[0] -
            getCandlePadding(this.isSimple, intervalWidth),
        ) /
          intervalWidth) *
          1000 *
          60 *
          getSubMinutes(this._interval, 1),
    );

    const domain = [
      date0,
      new Date(
        latestDate.getTime() +
          (latestDate.getTime() - date0.getTime()) * (ratio - 1),
      ),
    ];

    this.xScale.domain(domain);
    this.xElement.call(this.xZoom.transform, zoomIdentity);
  }

  resetYAxis(id: string) {
    const domain = this.plotAreas[id].extent(
      this.xTransform().rescaleX(this.xScale).domain() as [Date, Date],
    );

    this.yScales[id].domain(domain);

    this.yElements[id].call(this.yZooms[id].transform, zoomIdentity);
  }

  /**
   * Updates the chart when new data arrives
   *
   * @param panes
   * @param axis
   */
  update(
    panes: Panes<ChartPane>,
    axis: { ref: React.MutableRefObject<HTMLDivElement>; data: any[] },
  ): this {
    const oldIds = Object.keys(this.plotAreas);
    const newIds = Object.keys(panes);

    const enteringIds = difference(newIds, oldIds);
    const updatingIds = intersection(newIds, oldIds);

    for (const id of union(oldIds, newIds)) {
      if (updatingIds.includes(id)) {
        this.plotAreas[id]
          .data(panes[id].data)
          .renderableElements(panes[id].renderableElements)
          .yEncodingFields(panes[id].yEncodingFields)
          .labels(panes[id].labelLines);

        this.plotAreaAnnotations[id].labels(panes[id].labels);
      } else if (enteringIds.includes(id)) {
        this.yScales[id] = scaleLinear();

        this.yElements[id] = select(panes[id].ref.current)
          .select<Element>(".y-axis")
          .style("pointer-events", "none");

        this.yAxes[id] = new YAxis(
          this.xTransform().rescaleX(this.xScale),
          this.yScales[id],
          id === "volume" ? this._positionDecimalPlaces : this._decimalPlaces,
          this._colors,
        );

        this.yAxisInteractions[id] = new YAxisInteraction()
          .on("drag", (e) => {
            handleYAxisDrag(
              this.yElements[id],
              this.yZooms[id],
              e,
              this.yScales[id],
              this.yTransforms[id],
              this.plotAreas[id],
              this.yAxes[id],
              (isFreePan: boolean) => {
                this.isFreePan = isFreePan;
              },
              () => this.listeners.call("redraw"),
            );
          })
          .on("dblclick", () => {
            this.resetYAxis(id);
            this.isFreePan = false;
            this.listeners.call("redraw");
          });

        this.plotAreas[id] = new PlotArea(
          this.xTransform().rescaleX(this.xScale),
          this.yScales[id],
          panes[id].renderableElements,
          panes[id].data,
          panes[id].yEncodingFields,
          panes[id].labelLines,
          this.isSimple,
          this._colors,
        );

        this.plotAreaInteractions[id] = new PlotAreaInteraction(
          this.xTransform().rescaleX(this.xScale),
          this.yScales[id],
        )
          .on("zoom", (e, t, point) => {
            handleZoom(
              this.xScale,
              this.yScales,
              this.xAxis,
              this.yAxes,
              this.xElement,
              this.xZoom,
              this.xTransform,
              this.yElements,
              this.yTransforms,
              this.yZooms,
              this.plotAreas,
              this.isPinned,
              this.isFreePan,
              this.isSimple,
              this.dates,
              t,
              point,
              id,
              (bounds: [Date, Date]) => {
                this.listeners.call("bounds_changed", this, bounds);
              },
              () => this.listeners.call("redraw"),
              (from: Date, to: Date) =>
                this.listeners.call("fetch_data", this, from, to),
              (isPinned) => {
                this.isPinned = isPinned;
              },
            );
          })
          .on("zoomstart", () => {
            handleZoomstart(this.plotAreas, this.yAxes, this.xAxis);
          })
          .on("zoomend", (offset: [number, number]) => {
            handleZoomend(
              this.plotAreas,
              offset,
              this.yTransforms[id]().rescaleY(this.yScales[id]),
              this.xAxis,
              this.yAxes[id],
              id,
              () => this.listeners.call("redraw"),
            );
          })
          .on("dblclick", () => {
            this.reset();
            this.listeners.call("dblclick", this);
          })
          .on("mousemove", (offset: [number, number]) => {
            handleMousemove(
              this.plotAreas,
              offset,
              this.yTransforms[id]().rescaleY(this.yScales[id]),
              this.yAxes,
              this.xAxis,
              id,
              (index, id) => this.listeners.call("mousemove", this, index, id),
              () => this.listeners.call("redraw"),
            );
          })
          .on("mouseout", () => {
            handleMouseout(
              this.plotAreas,
              this.xAxis,
              this.yAxes,
              () => this.listeners.call("mouseout", this),
              () => this.listeners.call("redraw"),
            );
          })
          .on("contextmenu", (event) => {
            this.listeners.call("contextmenu", this, [
              event.pageX,
              event.pageY,
            ]);
          });

        this.plotAreaAnnotations[id] = new PlotAreaAnnotations(
          this.xScale,
          this.yScales[id],
          panes[id].labels,
        );

        const domain = this.xTransform().rescaleX(this.xScale).domain() as [
          Date,
          Date,
        ];

        const newExtent = this.plotAreas[id].extent(domain);

        this.yZooms[id] = d3Zoom<Element, unknown>();
        this.plotAreaElements[id] = select<Element, unknown>(
          panes[id].ref.current!,
        );
        this.yTransforms[id] = () => zoomTransform(this.yElements[id].node()!);
        this.yScales[id].domain(newExtent);

        const originalExtent = this.yScales[id].range();

        select<HTMLDivElement, unknown>(axis.ref.current)
          .select(".x-axis")
          .on("measure", (event) => {
            measureXAxis(
              event,
              this.xScale,
              this.xZoom,
              this.xTransform,
              this.xAxis,
              this.yAxes,
              this.plotAreas,
              this.dates,
              (bounds: [Date, Date]) => {
                this.listeners.call("bounds_changed", this, bounds);
              },
            );
          })
          .on("draw", (event) => {
            drawXAxis(event, this.xAxis);
          });

        select<HTMLDivElement, unknown>(panes[id].ref.current!)
          .select(".y-axis")
          .on("measure", (event) => {
            measureYAxis(
              event,
              this.yScales[id],
              this.yTransforms[id],
              this.plotAreas[id],
              this.plotAreaInteractions[id],
              this.plotAreaAnnotations[id],
              this.yAxes[id],
              this.isFreePan,
              id,
              this.resetYAxis.bind(this),
            );
          })
          .on("draw", (event) => {
            drawYAxis(event, this.yAxes[id]);
          });

        select<HTMLDivElement, unknown>(panes[id].ref.current!)
          .select(".y-axis-interaction")
          .on("draw", (event) => {
            this.yAxisInteractions[id].draw(
              select(event.currentTarget).select("svg"),
            );
          });

        select<HTMLDivElement, unknown>(panes[id].ref.current!)
          .select(".plot-area")
          .on("draw", (event) => {
            drawPlotArea(event, this.plotAreas[id]);

            this.plotAreaAnnotations[id].draw(
              select(panes[id].ref.current).select(".plot-area-annotations"),
            );
          });

        select<HTMLDivElement, unknown>(panes[id].ref.current!)
          .select(".plot-area-interaction")
          .on("draw", (event) => {
            drawPlotAreaInteraction(event, this.plotAreaInteractions[id]);
          });

        this.resetYAxis(id);
      } else {
        // Must be exiting
        this.yScales = omit(this.yScales, id);
        this.yAxes = omit(this.yAxes, id);
        this.yAxisInteractions = omit(this.yAxisInteractions, id);
        this.yElements = omit(this.yElements, id);
        this.yTransforms = omit(this.yTransforms, id);
        this.yZooms = omit(this.yZooms, id);

        this.plotAreas = omit(this.plotAreas, id);
        this.plotAreaInteractions = omit(this.plotAreaInteractions, id);
        this.plotAreaElements = omit(this.plotAreaElements, id);
      }
    }

    this.dates = axis.data;

    // Update latest price
    const latestPrice = panes["main"].data[panes["main"].data.length - 1].close;

    this.yAxes["main"].latestPrice(latestPrice);
    this.plotAreas["main"].latestPrice(latestPrice);

    // Ensure latest data is visible
    if (this.isPinned) {
      this.pinXAxis();
    }

    return this;
  }

  private zoom(delta: number) {
    const xr = this.xTransform().rescaleX(this.xScale);
    const intervalWidth = DEFAULT_INTERVAL_WIDTH;

    this.xElement.call(this.xZoom.scaleBy, 2 ** delta, [
      this.isPinned
        ? this.xScale.range()[1] -
          getCandlePadding(this.isSimple, intervalWidth)
        : (this.xScale.range()[0] + this.xScale.range()[1]) / 2,
      0,
    ]);

    this.xAxis.xScale(xr);

    Object.entries(this.plotAreas).forEach(([id, plotArea]) => {
      plotArea.xScale(xr);

      if (!this.isFreePan) {
        recalculateScale(
          this.xTransform,
          this.xScale,
          this.yScales,
          id,
          this.plotAreas,
          this.yElements,
          this.yZooms,
        );
      }
    });

    this.listeners.call("redraw");
    this.listeners.call("bounds_changed", this, xr.domain());
  }

  zoomIn(delta: number): void {
    this.zoom(delta);
  }

  zoomOut(delta: number): void {
    this.zoom(-delta);
  }

  set colors(colors: Colors) {
    this._colors = colors;

    Object.values(this.plotAreas).forEach((plotArea) => {
      plotArea.colors = colors;
    });

    Object.values(this.yAxes).map((yAxis) => {
      yAxis.colors = colors;
    });

    this.xAxis.colors = colors;

    this.listeners.call("redraw");
  }
}
