import { PlotArea } from "./plot-area";
import { RenderableElement, ScaleLinear, ScaleTime } from "../types";
import { Selection, select } from "d3-selection";
import {
  ZoomBehavior,
  ZoomTransform,
  zoom as d3Zoom,
  zoomTransform,
} from "d3-zoom";
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
import { PlotAreaInteraction } from "./plot-area-interaction";
import { scaleLinear, scaleTime } from "d3-scale";
import { XAxis } from "./x-axis";
import { XAxisInteraction } from "./x-axis-interaction";
import { YAxis } from "./y-axis";
import { YAxisInteraction } from "./y-axis-interaction";

import { WIDTH } from "../constants";
import { dispatch } from "d3-dispatch";
import { MutableRefObject } from "react";

export type Panes<T> = { [id: string]: T };

export type ChartPanel = {
  id: string;
  ref: React.RefObject<HTMLDivElement>;
  data: any[];
  renderableElements: RenderableElement[];
  yEncodingFields: string[];
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
    "rightclick"
  );

  private _interval = 1000 * 60;

  // Modes
  private isPinned = true;
  private isFreePan = false;

  // x-axis
  private xDates: Date[];
  private xScale: ScaleTime;
  private xZoom: ZoomBehavior<Element, unknown>;
  private xAxis: XAxis;
  private xAxisInteraction: XAxisInteraction;
  private xElement: Selection<Element, unknown, null, undefined>;
  private xTransform: () => ZoomTransform;

  // y-axis
  private yScales: Panes<ScaleLinear>;
  private yZooms: Panes<ZoomBehavior<Element, unknown>>;
  private yAxes: Panes<YAxis>;
  private yAxisInteractions: Panes<YAxisInteraction>;
  private yTransforms: Panes<() => ZoomTransform>;

  // plot-area
  private plotAreas: Panes<PlotArea>;
  private plotAreaInteractions: Panes<PlotAreaInteraction>;
  private plotAreaElements: Panes<Selection<Element, any, null, undefined>>;

  constructor(
    panels: Panes<ChartPanel>,
    axis: { ref: MutableRefObject<HTMLDivElement>; data: any[] },
    initialBounds: [Date, Date]
  ) {
    // x-axis
    this.xDates = axis.data;
    this.xScale = scaleTime();
    this.xZoom = d3Zoom();
    this.xElement = select(axis.ref.current)
      .select<Element>(".x-axis")
      .style("pointer-events", "none");

    this.xAxis = new XAxis(this.xScale);
    this.xAxisInteraction = new XAxisInteraction().on("drag", (e) => {
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
        () => this.listeners.call("redraw", this)
      );
    });

    this.xTransform = () => zoomTransform(this.xElement.node()!);

    // y-axis
    this.yScales = Object.fromEntries(
      Object.keys(panels).map((id) => [id, scaleLinear()])
    );

    this.yAxes = Object.fromEntries(
      Object.entries(this.yScales).map(([id, scale]) => [
        id,
        new YAxis(this.xScale, scale),
      ])
    );

    this.yAxisInteractions = Object.fromEntries(
      Object.entries(panels).map(([id, panel]) => [
        id,
        new YAxisInteraction().on("drag", (e) => {
          handleYAxisDrag(
            this.plotAreaElements,
            this.yZooms,
            e,
            this.yScales,
            this.yTransforms,
            this.plotAreas,
            this.yAxes,
            this.isFreePan,
            id,
            () => this.listeners.call("redraw", this)
          );
        }),
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
          panel.yEncodingFields
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
              this.xAxis,
              this.yAxes,
              value.id,
              () => this.listeners.call("redraw", this)
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
              this.yAxes,
              this.xAxis,
              value.id,
              (index, id) => this.listeners.call("mousemove", this, index, id),
              () => this.listeners.call("redraw", this)
            );
          })
          .on("mouseout", () => {
            handleMouseout(
              this.plotAreas,
              this.xAxis,
              this.yAxes,
              () => this.listeners.call("redraw", this),
              () => this.listeners.call("mouseout", this)
            );
          }),
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
      Object.entries(this.plotAreaElements).map(([id, plotAreaElement]) => [
        id,
        () => zoomTransform(plotAreaElement.node()!),
      ])
    ); // TODO: Why are the transforms put on the plot area and not the y-axis

    // Configure
    this.xScale.domain(initialBounds);

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
          this.xTransform,
          this.xAxis,
          this.yAxes,
          this.plotAreas
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
            this.yAxes[id]
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
      select<HTMLDivElement, unknown>(area.ref.current!)
        .select(".plot-area")
        .on("draw", (event) => {
          drawPlotArea(event, this.plotAreas, id);
        });
    });

    Object.entries(panels).forEach(([id, area]) => {
      select<HTMLDivElement, unknown>(area.ref.current!)
        .select(".plot-area-interaction")
        .on("draw", (event) => {
          drawPlotAreaInteraction(event, this.plotAreaInteractions, id);
        });
    });
  }

  draw() {
    this.listeners.call("redraw", this);
  }

  interval(interval: number): this {
    this._interval = interval;
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
      -(this.xScale(n * this._interval) - this.xScale(0)),
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
          this.plotAreaElements,
          this.yZooms
        );
      }
    });

    this.isPinned = false;

    this.listeners.call("redraw", this);
    this.listeners.call("bounds_changed", this, xr.domain());
  }

  reset(): void {
    this.xElement.call(this.xZoom.translateTo, this.xScale.range()[1], 0, [
      this.xScale.range()[1] - WIDTH,
      0,
    ]);

    const xr = this.xTransform().rescaleX(this.xScale);

    this.xAxis.xScale(xr);

    Object.entries(this.plotAreas).forEach(([id, plotArea]) => {
      plotArea.xScale(xr);

      recalculateScale(
        this.xTransform,
        this.xScale,
        this.yScales,
        id,
        this.plotAreas,
        this.plotAreaElements,
        this.yZooms
      );
    });

    this.isPinned = true;
    this.isFreePan = false;

    this.listeners.call("redraw", this);
    this.listeners.call("bounds_changed", this, xr.domain());
  }

  update(
    areas: Panes<ChartPanel>,
    axis: { ref: React.MutableRefObject<HTMLDivElement>; data: any[] }
  ) {
    const oldIds = Object.keys(this.plotAreas);
    const newIds = Object.keys(areas);

    const newYScales: Panes<ScaleLinear> = {};
    const newYAxes: Panes<YAxis> = {};
    const newYAxisInteractions: Panes<YAxisInteraction> = {};
    const newPlotAreas: Panes<PlotArea> = {};
    const newPlotAreaInteractions: Panes<PlotAreaInteraction> = {};
    const newZooms: Panes<ZoomBehavior<Element, unknown>> = {};
    const newGPlotAreas: Panes<Selection<Element, any, null, undefined>> = {};
    const newTs: Panes<() => ZoomTransform> = {};

    for (const id of newIds) {
      if (oldIds.includes(id)) {
        newYScales[id] = this.yScales[id];
        newYAxes[id] = this.yAxes[id];
        newYAxisInteractions[id] = this.yAxisInteractions[id];

        newPlotAreas[id] = this.plotAreas[id]
          .data(areas[id].data)
          .renderableElements(areas[id].renderableElements)
          .yEncodingFields(areas[id].yEncodingFields);

        newPlotAreaInteractions[id] = this.plotAreaInteractions[id];
        newZooms[id] = this.yZooms[id];
        newGPlotAreas[id] = this.plotAreaElements[id];
        newTs[id] = this.yTransforms[id];
      } else {
        newYScales[id] = scaleLinear().domain([0, 1]); //FIXME: Initialize domain

        newYAxes[id] = new YAxis(
          this.xTransform().rescaleX(this.xScale),
          newYScales[id]
        );

        newYAxisInteractions[id] = new YAxisInteraction().on("drag", (e) => {
          handleYAxisDrag(
            newGPlotAreas,
            newZooms,
            e,
            newYScales,
            newTs,
            newPlotAreas,
            newYAxes,
            this.isFreePan,
            id,
            () => this.listeners.call("redraw", this)
          );
        });

        newPlotAreas[id] = new PlotArea(
          this.xTransform().rescaleX(this.xScale),
          newYScales[id],
          areas[id].renderableElements,
          areas[id].data,
          areas[id].yEncodingFields
        );

        newPlotAreaInteractions[id] = new PlotAreaInteraction(
          this.xTransform().rescaleX(this.xScale),
          newYScales[id]
        )
          .on("zoom", (e, t, point) => {
            this.zoomed(t, point, id);
          })
          .on("zoomstart", () => {
            handleZoomstart(newPlotAreas, newYAxes, this.xAxis);
          })
          .on("zoomend", (offset: [number, number]) => {
            handleZoomend(newPlotAreas, offset, this.xAxis, newYAxes, id, () =>
              this.listeners.call("redraw", this)
            );
          })
          .on("dblclick", () => {
            this.reset();
            this.listeners.call("dblclick", this);
          })
          .on("mousemove", (offset: [number, number]) => {
            handleMousemove(
              newPlotAreas,
              offset,
              newYAxes,
              this.xAxis,
              id,
              (index, id) => this.listeners.call("mousemove", this, index, id),
              () => this.listeners.call("redraw", this)
            );
          })
          .on("mouseout", () => {
            handleMouseout(
              newPlotAreas,
              this.xAxis,
              newYAxes,
              () => this.listeners.call("mouseout", this),
              () => this.listeners.call("redraw", this)
            );
          });

        newZooms[id] = d3Zoom<Element, unknown>();
        newGPlotAreas[id] = select<Element, unknown>(areas[id].ref.current!);
        newTs[id] = () => zoomTransform(newGPlotAreas[id].node()!);
        newYScales[id].domain(newPlotAreas[id].extent());
        newPlotAreas[id].yScale(newTs[id]().rescaleY(newYScales[id]));

        select<HTMLDivElement, unknown>(axis.ref.current)
          .select(".x-axis")
          .on("measure", (event) => {
            measureXAxis(
              event,
              this.xScale,
              this.xTransform,
              this.xAxis,
              newYAxes,
              newPlotAreas
            );
          })
          .on("draw", (event) => {
            drawXAxis(event, this.xAxis);
          });

        select<HTMLDivElement, unknown>(areas[id].ref.current!)
          .select(".y-axis")
          .on("measure", (event) => {
            measureYAxis(
              event,
              newYScales[id],
              newTs[id],
              newPlotAreas[id],
              newYAxes[id]
            );
          })
          .on("draw", (event) => {
            drawYAxis(event, newYAxes, id);
          });

        select<HTMLDivElement, unknown>(areas[id].ref.current!)
          .select(".y-axis-interaction")
          .on("draw", (event) => {
            newYAxisInteractions[id].draw(
              select(event.currentTarget).select("svg")
            );
          });

        select<HTMLDivElement, unknown>(areas[id].ref.current!)
          .select(".plot-area")
          .on("draw", (event) => {
            drawPlotArea(event, this.plotAreas, id);
          });

        select<HTMLDivElement, unknown>(areas[id].ref.current!)
          .select(".plot-area-interaction")
          .on("draw", (event) => {
            drawPlotAreaInteraction(event, newPlotAreaInteractions, id);
          });
      }
    }

    this.xDates = axis.data;
    this.yScales = newYScales;
    this.yAxes = newYAxes;
    this.yAxisInteractions = newYAxisInteractions;
    this.plotAreas = newPlotAreas;
    this.plotAreaInteractions = newPlotAreaInteractions;
    this.yZooms = newZooms;
    this.plotAreaElements = newGPlotAreas;
    this.yTransforms = newTs;

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
          this.plotAreaElements,
          this.yZooms
        );
      }
    });

    this.listeners.call("redraw", this);
    this.listeners.call("bounds_changed", this, xr.domain());
  }

  private zoomed(t: ZoomTransform, point: [number, number], id: string) {
    if (t.k === 1) {
      this.xElement.call(this.xZoom.translateBy, t.x / this.xTransform().k, 0);

      if (this.isFreePan) {
        this.plotAreaElements[id].call(
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
            this.plotAreaElements,
            this.yZooms
          );
        });
      }

      this.isPinned = false;
    } else {
      this.xElement.call(
        this.xZoom.scaleBy,
        t.k,
        this.isPinned ? [this.xScale.range()[1] - WIDTH, 0] : point
      );

      if (!this.isFreePan) {
        Object.keys(this.plotAreas).forEach((id) => {
          recalculateScale(
            this.xTransform,
            this.xScale,
            this.yScales,
            id,
            this.plotAreas,
            this.plotAreaElements,
            this.yZooms
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

    if (this.xDates[0].getTime() + domainWidth > domain[0].getTime()) {
      const to = this.xDates[0];
      const from = new Date(this.xDates[0].getTime() - domainWidth);

      this.listeners.call("fetch_data", this, from, to);
    }

    this.listeners.call("redraw", this);
    this.listeners.call("bounds_changed", this, xr.domain());
  }

  zoomIn(delta: number): void {
    this.zoom(delta);
  }

  zoomOut(delta: number): void {
    this.zoom(-delta);
  }
}
