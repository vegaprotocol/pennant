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

import {
  DEFAULT_INTERVAL_WIDTH,
  MAX_ZOOM,
  MIN_ZOOM,
  WIDTH,
} from "../constants";
import { RenderableHTMLElement } from "../elements";
import { getSubMinutes } from "../helpers";
import {
  Interval,
  RenderableElement,
  ScaleLinear,
  ScaleTime,
  Viewport,
} from "../types";
import {
  drawPlotArea,
  drawPlotAreaInteraction,
  drawXAxis,
  drawYAxis,
  handleMousemove,
  handleMouseout,
  handleXAxisDrag,
  handleYAxisDrag,
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

export type Panes<T> = { [id: string]: T };

export type ChartPanel = {
  id: string;
  ref: React.RefObject<HTMLDivElement>;
  data: any[];
  renderableElements: RenderableElement[];
  yEncodingFields: string[];
  labels: RenderableHTMLElement[];
};

/**
 * The chart component renders multiple plot areas which share a common x-axis.
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
    "viewport_changed"
  );

  private _interval = Interval.I1M;

  private _decimalPlaces = 5;

  // Modes
  private isPinned = true;
  private isFreePan = false;

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
    panels: Panes<ChartPanel>,
    axis: { ref: MutableRefObject<HTMLDivElement>; data: any[] },
    initialViewport: Viewport,
    decimalPlaces: number = 5
  ) {
    this._decimalPlaces = decimalPlaces;

    // x-axis
    this.dates = axis.data;
    this.xScale = scaleTime();
    this.xZoom = d3Zoom().scaleExtent([MIN_ZOOM, MAX_ZOOM]);
    this.xElement = select(axis.ref.current)
      .select<Element>(".x-axis")
      .style("pointer-events", "none");

    this.xAxis = new XAxis(this.xScale, this._interval);
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
          () => this.listeners.call("redraw")
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
      Object.keys(panels).map((id) => [id, scaleLinear()])
    );

    this.yAxes = Object.fromEntries(
      Object.entries(this.yScales).map(([id, scale]) => [
        id,
        new YAxis(this.xScale, scale, this._decimalPlaces),
      ])
    );

    this.yAxisInteractions = Object.fromEntries(
      Object.entries(panels).map(([id, panel]) => [
        id,
        new YAxisInteraction()
          .on("drag", (e) => {
            handleYAxisDrag(
              this.yElements,
              this.yZooms,
              e,
              this.yScales,
              this.yTransforms,
              this.plotAreas,
              this.yAxes,
              id,
              (isFreePan: boolean) => {
                this.isFreePan = isFreePan;
              },
              () => this.listeners.call("redraw")
            );
          })
          .on("dblclick", () => {
            this.resetYAxis(id);
            this.isFreePan = false;
            this.listeners.call("redraw");
          }),
      ])
    );

    this.yElements = Object.fromEntries(
      Object.entries(panels).map(([id, panel]) => [
        id,
        select(panel.ref.current)
          .select<Element>(".y-axis")
          .style("pointer-events", "none"),
      ])
    );

    // plot-area
    this.plotAreas = Object.fromEntries(
      Object.entries(panels).map(([id, panel]) => [
        panel.id,
        new PlotArea(
          this.xScale,
          this.yScales[id],
          panel.renderableElements.flat(1),
          panel.data,
          panel.yEncodingFields,
          panel.labels
        ),
      ])
    );

    this.plotAreaInteractions = Object.fromEntries(
      Object.entries(panels).map(([id, value]) => [
        value.id,
        new PlotAreaInteraction(this.xScale, this.yScales[id])
          .on("zoom", (_e: any, t: any, point: [number, number]) => {
            this.zoomed(t, point, value.id);
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
              this.yAxes,
              value.id,
              () => this.listeners.call("redraw")
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
              value.id,
              (index, id) => this.listeners.call("mousemove", this, index, id),
              () => this.listeners.call("redraw")
            );
          })
          .on("mouseout", () => {
            handleMouseout(
              this.plotAreas,
              this.xAxis,
              this.yAxes,
              () => this.listeners.call("redraw"),
              () => this.listeners.call("mouseout", this)
            );
          }),
      ])
    );

    this.plotAreaAnnotations = Object.fromEntries(
      Object.entries(panels).map(([id, value]) => [
        value.id,
        new PlotAreaAnnotations(
          this.xScale,
          this.yScales[id],
          panels[id].labels
        ),
      ])
    );

    this.plotAreaElements = Object.fromEntries(
      Object.entries(panels).map(([id, area]) => [
        id,
        select<Element, any>(area.ref.current!)
          .select<Element>(".plot-area")
          .style("pointer-events", "none"),
      ])
    );

    this.yTransforms = Object.fromEntries(
      Object.entries(this.yElements).map(([id, yElement]) => [
        id,
        () => zoomTransform(yElement.node()!),
      ])
    );

    // Configure
    Object.entries(this.yScales).forEach(([id, scale]) => {
      scale.domain(this.plotAreas[id].extent());
    });

    this.yZooms = Object.fromEntries(
      Object.keys(panels).map((id) => [id, d3Zoom<Element, unknown>()])
    );

    this.xElement.call(this.xZoom);

    Object.entries(this.plotAreaElements).forEach(([id, plotAreaElement]) =>
      plotAreaElement.call(this.yZooms[id])
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
          }
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
      select<HTMLDivElement, unknown>(panels[id].ref.current!)
        .select(".y-axis")
        .on("measure", (event) => {
          measureYAxis(
            event,
            scale,
            this.yTransforms[id],
            this.plotAreas[id],
            this.plotAreaAnnotations[id],
            this.yAxes[id],
            this.isFreePan,
            id,
            this.resetYAxis.bind(this)
          );
        })
        .on("draw", (event) => {
          drawYAxis(event, this.yAxes, id);
        })
    );

    Object.entries(panels).forEach(([id, area]) =>
      select<HTMLDivElement, unknown>(area.ref.current!)
        .select(".y-axis-interaction")
        .on("draw", (event) => {
          this.yAxisInteractions[id].draw(
            select(event.currentTarget).select("svg")
          );
        })
    );

    Object.entries(panels).forEach(([id, area]) => {
      const selection = select<Element, any>(area.ref.current!).select<Element>(
        ".plot-area-annotations"
      );

      select<HTMLDivElement, unknown>(area.ref.current!)
        .select(".plot-area")
        .on("draw", (event) => {
          drawPlotArea(event, this.plotAreas, id);

          this.plotAreaAnnotations[id].draw(selection);
        });
    });

    Object.entries(panels).forEach(([id, area]) => {
      select<HTMLDivElement, unknown>(area.ref.current!)
        .select(".plot-area-interaction")
        .on("draw", (event) => {
          drawPlotAreaInteraction(event, this.plotAreaInteractions, id);
        });
    });


    // Update latest price
    const latestPrice =
      panels["main"].data[panels["main"].data.length - 1].close;

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
      0
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
          this.yTransforms
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
      this.xTransform().rescaleX(this.xScale).domain()
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
    const intervalWidth = DEFAULT_INTERVAL_WIDTH;
    const xr = this.xTransform().rescaleX(this.xScale);

    const latestDate = this.dates[this.dates.length - 1];
    const previousLatestDate = xr.invert(
      xr.range()[1] - WIDTH - intervalWidth * 3
    );

    if (compareAsc(latestDate, previousLatestDate) === 1) {
      const difference =
        this.xScale(latestDate) - this.xScale(previousLatestDate);

      this.xElement.call(this.xZoom.translateBy, -difference, 0);
    }
  }

  resetXAxis(): void {
    const latestDate = this.dates[this.dates.length - 1];
    const intervalWidth = DEFAULT_INTERVAL_WIDTH;

    const ratio =
      (this.xScale.range()[1] - this.xScale.range()[0]) /
      (this.xScale.range()[1] -
        WIDTH -
        intervalWidth * 3 -
        this.xScale.range()[0]);

    const date0 = new Date(
      latestDate.getTime() -
        (Math.abs(
          this.xScale.range()[1] -
            this.xScale.range()[0] -
            WIDTH -
            3 * intervalWidth
        ) /
          intervalWidth) *
          1000 *
          60 *
          getSubMinutes(this._interval, 1)
    );

    const domain = [
      date0,
      new Date(
        latestDate.getTime() +
          (latestDate.getTime() - date0.getTime()) * (ratio - 1)
      ),
    ];

    this.xScale.domain(domain);
    this.xElement.call(this.xZoom.transform, zoomIdentity);
  }

  resetYAxis(id: string) {
    const domain = this.plotAreas[id].extent(
      this.xTransform().rescaleX(this.xScale).domain() as [Date, Date]
    );

    this.yScales[id].domain(domain);

    this.yElements[id].call(this.yZooms[id].transform, zoomIdentity);
  }

  update(
    panels: Panes<ChartPanel>,
    axis: { ref: React.MutableRefObject<HTMLDivElement>; data: any[] }
  ) {
    const oldIds = Object.keys(this.plotAreas);
    const newIds = Object.keys(panels);

    const enteringIds = difference(newIds, oldIds);
    const updatingIds = intersection(newIds, oldIds);

    for (const id of union(oldIds, newIds)) {
      if (updatingIds.includes(id)) {
        this.plotAreas[id]
          .data(panels[id].data)
          .renderableElements(panels[id].renderableElements)
          .yEncodingFields(panels[id].yEncodingFields);

        this.plotAreaAnnotations[id].labels(panels[id].labels);
      } else if (enteringIds.includes(id)) {
        this.yScales[id] = scaleLinear();

        this.yElements[id] = select(panels[id].ref.current)
          .select<Element>(".y-axis")
          .style("pointer-events", "none");

        this.yAxes[id] = new YAxis(
          this.xTransform().rescaleX(this.xScale),
          this.yScales[id],
          this._decimalPlaces
        );

        this.yAxisInteractions[id] = new YAxisInteraction()
          .on("drag", (e) => {
            handleYAxisDrag(
              this.yElements,
              this.yZooms,
              e,
              this.yScales,
              this.yTransforms,
              this.plotAreas,
              this.yAxes,
              id,
              (isFreePan: boolean) => {
                this.isFreePan = isFreePan;
              },
              () => this.listeners.call("redraw")
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
          panels[id].renderableElements,
          panels[id].data,
          panels[id].yEncodingFields,
          panels[id].labels
        );

        this.plotAreaInteractions[id] = new PlotAreaInteraction(
          this.xTransform().rescaleX(this.xScale),
          this.yScales[id]
        )
          .on("zoom", (e, t, point) => {
            this.zoomed(t, point, id);
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
              this.yAxes,
              id,
              () => this.listeners.call("redraw")
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
              () => this.listeners.call("redraw")
            );
          })
          .on("mouseout", () => {
            handleMouseout(
              this.plotAreas,
              this.xAxis,
              this.yAxes,
              () => this.listeners.call("mouseout", this),
              () => this.listeners.call("redraw")
            );
          });

        const domain = this.xTransform().rescaleX(this.xScale).domain() as [
          Date,
          Date
        ];

        const newExtent = this.plotAreas[id].extent(domain);

        this.yZooms[id] = d3Zoom<Element, unknown>();
        this.plotAreaElements[id] = select<Element, unknown>(
          panels[id].ref.current!
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
              }
            );
          })
          .on("draw", (event) => {
            drawXAxis(event, this.xAxis);
          });

        select<HTMLDivElement, unknown>(panels[id].ref.current!)
          .select(".y-axis")
          .on("measure", (event) => {
            measureYAxis(
              event,
              this.yScales[id],
              this.yTransforms[id],
              this.plotAreas[id],
              this.plotAreaAnnotations[id],
              this.yAxes[id],
              this.isFreePan,
              id,
              this.resetYAxis.bind(this)
            );
          })
          .on("draw", (event) => {
            drawYAxis(event, this.yAxes, id);
          });

        select<HTMLDivElement, unknown>(panels[id].ref.current!)
          .select(".y-axis-interaction")
          .on("draw", (event) => {
            this.yAxisInteractions[id].draw(
              select(event.currentTarget).select("svg")
            );
          });

        select<HTMLDivElement, unknown>(panels[id].ref.current!)
          .select(".plot-area")
          .on("draw", (event) => {
            drawPlotArea(event, this.plotAreas, id);

            this.plotAreaAnnotations[id].draw(
              select(panels[id].ref.current).select(".plot-area-annotations")
            );
          });

        select<HTMLDivElement, unknown>(panels[id].ref.current!)
          .select(".plot-area-interaction")
          .on("draw", (event) => {
            drawPlotAreaInteraction(event, this.plotAreaInteractions, id);
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
    const latestPrice =
      panels["main"].data[panels["main"].data.length - 1].close;

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

    this.xElement.call(this.xZoom.scaleBy, 2 ** delta, [
      this.isPinned
        ? this.xScale.range()[1] - WIDTH
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
          this.yTransforms
        );
      }
    });

    this.listeners.call("redraw");
    this.listeners.call("bounds_changed", this, xr.domain());
  }

  private zoomed(t: ZoomTransform, point: [number, number], id: string) {
    if (t.k === 1) {
      this.xElement.call(this.xZoom.translateBy, t.x / this.xTransform().k, 0);

      if (this.isFreePan) {
        this.yElements[id].call(
          this.yZooms[id].translateBy,
          0,
          t.y / this.yTransforms[id]().k
        );
      } else {
        Object.keys(this.plotAreas).forEach((id) => {
          recalculateScale(
            this.xTransform,
            this.xScale,
            this.yScales,
            id,
            this.plotAreas,
            this.yElements,
            this.yZooms,
            this.yTransforms
          );
        });
      }

      this.isPinned = false;
    } else {
      const k = this.xTransform().k * t.k;

      const offset =
        (this.xScale.range()[1] - (WIDTH + DEFAULT_INTERVAL_WIDTH * 3)) / k;

      this.xZoom.translateExtent([
        [this.xScale(this.dates[0]) - offset, -Infinity],
        [this.xScale(this.dates[this.dates.length - 1]) + offset, Infinity],
      ]);

      this.xElement.call(
        this.xZoom.scaleBy,
        t.k,
        this.isPinned
          ? [this.xScale.range()[1] - WIDTH - 3 * DEFAULT_INTERVAL_WIDTH, 0]
          : point
      );

      if (!this.isFreePan) {
        Object.keys(this.plotAreas).forEach((id) => {
          recalculateScale(
            this.xTransform,
            this.xScale,
            this.yScales,
            id,
            this.plotAreas,
            this.yElements,
            this.yZooms,
            this.yTransforms
          );
        });
      }
    }

    const xr = this.xTransform().rescaleX(this.xScale);
    const yr = this.yTransforms[id]().rescaleY(this.yScales[id]);

    this.xAxis.xScale(xr);
    Object.values(this.plotAreas).forEach((plotArea) => plotArea.xScale(xr));

    this.plotAreas[id].yScale(yr);
    this.yAxes[id].yScale(yr);

    const domain = xr.domain();
    const domainWidth = domain[1].getTime() - domain[0].getTime();

    if (this.dates[0].getTime() + domainWidth > domain[0].getTime()) {
      const to = this.dates[0];
      const from = new Date(this.dates[0].getTime() - domainWidth);

      this.listeners.call("fetch_data", this, from, to);
    }

    this.listeners.call("redraw");
    this.listeners.call("bounds_changed", this, xr.domain());
  }

  zoomIn(delta: number): void {
    this.zoom(delta);
  }

  zoomOut(delta: number): void {
    this.zoom(-delta);
  }
}
