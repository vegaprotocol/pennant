import { PlotAreaInterface, plotArea } from "./plot-area";
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
  handleZoomend,
  handleZoomstart,
  measureXAxis,
  measureYAxis,
  recalculateScale,
} from "./helpers";
import {
  plotAreaInteraction,
  plotAreaInteractionInterface,
} from "./plot-area-interaction";
import { scaleLinear, scaleTime } from "d3-scale";
import { xAxis as xAxisElement, xAxisInterface } from "./x-axis";
import {
  xAxisInteraction as xAxisInteractionElement,
  xAxisInteractionInterface,
} from "./x-axis-interaction";
import { yAxis, yAxisInterface } from "./y-axis";
import {
  yAxisInteraction,
  yAxisInteractionInterface,
} from "./y-axis-interaction";

import { WIDTH } from "../constants";
import { dispatch } from "d3-dispatch";

export type ChartPanel = {
  id: string;
  ref: React.RefObject<HTMLDivElement>;
  data: any[];
  renderableElements: RenderableElement[];
  yEncodingFields: string[];
};

export interface ChartInterface {
  on(
    typenames: string,
    callback?: (this: object, ...args: any[]) => void
  ): ChartInterface;
  panBy(n: number): void;
  plotAreas(areas: Record<string, ChartPanel>): ChartInterface;
  reset(): void;
  zoomIn(delta: number): void;
  zoomOut(delta: number): void;
}

/**
 * The chart component renders multiple plot areas which share a common x-axis.
 *
 * Zooming and panning of plot areas is supported. Dragging the axes will zoom the apprpriate dimension.
 * @param panels
 * @param axis
 * @param initialBounds
 * @returns
 */
export const chart = (
  panels: Record<string, ChartPanel>,
  axis: { ref: React.MutableRefObject<HTMLDivElement>; data: any[] },
  initialBounds: [Date, Date]
): ChartInterface => {
  let listeners = dispatch(
    "bounds_changed",
    "click",
    "contextmenu",
    "dblclick",
    "drag",
    "dragend",
    "dragstart",
    "mousemove",
    "mouseout",
    "mouseover",
    "redraw",
    "rightclick"
  );

  let isPinned = true;
  let isFreePan = false;

  let xScale: ScaleTime = scaleTime<number, number, number>().domain(
    initialBounds
  );

  let yScales: Record<string, ScaleLinear> = Object.fromEntries(
    Object.values(panels).map((panel) => [
      panel.id,
      scaleLinear().domain([0, 1]), //FIXME: Initialize domain
    ])
  );

  let xZoom = d3Zoom<Element, unknown>();
  let xElement = select<Element, unknown>(axis.ref.current)
    .select<Element>(".x-axis")
    .style("pointer-events", "none");

  let xAxis: xAxisInterface = xAxisElement(xScale);

  let xAxisInteraction: xAxisInteractionInterface = xAxisInteractionElement(
    xScale
  ).on("drag", (e) => {
    handleXAxisDrag(
      xElement,
      xZoom,
      e,
      xScale,
      isPinned,
      xTransform,
      xAxis,
      plotAreas,
      yAxes,
      listeners,
      chart
    );
  }) as xAxisInteractionInterface;

  let yAxes: Record<string, yAxisInterface> = Object.fromEntries(
    Object.entries(yScales).map(([id, scale]) => [id, yAxis(xScale, scale)])
  );

  let yAxisInteractions: Record<
    string,
    yAxisInteractionInterface
  > = Object.fromEntries(
    Object.values(panels).map((value) => [
      value.id,
      yAxisInteraction(yScales[value.id]).on("drag", (e) => {
        yAxisDragged(e, value.id);
      }),
    ])
  );

  let plotAreas: Record<string, PlotAreaInterface> = Object.fromEntries(
    Object.values(panels).map((panel) => [
      panel.id,
      plotArea(
        xScale,
        yScales[panel.id],
        panel.renderableElements.flat(1),
        panel.data,
        panel.yEncodingFields
      ),
    ])
  );

  let plotAreaInteractions: Record<
    string,
    plotAreaInteractionInterface
  > = Object.fromEntries(
    Object.values(panels).map((value) => [
      value.id,
      (plotAreaInteraction(xScale, yScales[value.id]).on(
        "zoom",
        (_e: any, t: any, point: [number, number]) => {
          zoomed(t, point, value.id);
        }
      ) as any)
        .on("zoomstart", () => {
          handleZoomstart(plotAreas, yAxes, xAxis);
        })
        .on("zoomend", (offset: [number, number]) => {
          handleZoomend(
            plotAreas,
            offset,
            xAxis,
            yAxes,
            value.id,
            listeners,
            chart
          );
        })
        .on("dblclick", () => {
          reset();
          listeners.call("dblclick", chart);
        })
        .on("mousemove", (offset: [number, number]) => {
          handleMousemove(
            plotAreas,
            offset,
            yAxes,
            xAxis,
            value.id,
            listeners,
            chart
          );
        })
        .on("mouseout", () => {
          handleMouseout(plotAreas, xAxis, yAxes, listeners, chart);
        }),
    ])
  );

  let yZooms = Object.fromEntries(
    Object.values(panels).map((value) => [value.id, d3Zoom<Element, unknown>()])
  );

  let plotAreaElements = Object.fromEntries(
    Object.entries(panels).map(([id, area]) => [
      id,
      select<Element, any>(area.ref.current!)
        .select<Element>(".plot-area")
        .style("pointer-events", "none"),
    ])
  );

  const xTransform = () => zoomTransform(xElement.node()!);

  let yTransforms = Object.fromEntries(
    Object.entries(plotAreaElements).map(([id, plotAreaElement]) => [
      id,
      () => zoomTransform(plotAreaElement.node()!),
    ])
  );

  xElement.call(xZoom);

  Object.entries(plotAreaElements).forEach(([id, plotAreaElement]) =>
    plotAreaElement.call(yZooms[id])
  );

  function panBy(n: number) {
    const xr = xTransform().rescaleX(xScale);

    xElement.call(xZoom.translateBy, -(xScale(n * 1000 * 60) - xScale(0)), 0);

    xAxis.xScale(xr);

    Object.entries(plotAreas).forEach(([id, plotArea]) => {
      plotArea.xScale(xr);

      if (!isFreePan) {
        recalculateScale(
          xTransform,
          xScale,
          yScales,
          id,
          plotAreas,
          plotAreaElements,
          yZooms
        );
      }
    });

    isPinned = false;

    listeners.call("redraw", chart);
    listeners.call("bounds_changed", chart, xr.domain());
  }

  function reset() {
    xElement.call(xZoom.translateTo, xScale.range()[1], 0, [
      xScale.range()[1] - WIDTH,
      0,
    ]);

    const xr = xTransform().rescaleX(xScale);

    xAxis.xScale(xr);

    Object.entries(plotAreas).forEach(([id, plotArea]) => {
      plotArea.xScale(xr);

      recalculateScale(
        xTransform,
        xScale,
        yScales,
        id,
        plotAreas,
        plotAreaElements,
        yZooms
      );
    });

    isPinned = true;
    isFreePan = false;

    listeners.call("redraw", chart);
    listeners.call("bounds_changed", chart, xr.domain());
  }

  function zoom(n: number) {
    const xr = xTransform().rescaleX(xScale);

    xElement.call(xZoom.scaleBy, 2 ** n, [
      isPinned
        ? xScale.range()[1] - WIDTH
        : (xScale.range()[0] + xScale.range()[1]) / 2,
      0,
    ]);

    xAxis.xScale(xr);

    Object.entries(plotAreas).forEach(([id, plotArea]) => {
      plotArea.xScale(xr);

      if (!isFreePan) {
        recalculateScale(
          xTransform,
          xScale,
          yScales,
          id,
          plotAreas,
          plotAreaElements,
          yZooms
        );
      }
    });

    listeners.call("redraw", chart);
    listeners.call("bounds_changed", chart, xr.domain());
  }

  function zoomed(t: ZoomTransform, point: [number, number], id: string) {
    if (t.k === 1) {
      xElement.call(xZoom.translateBy, t.x / xTransform().k, 0);

      if (isFreePan) {
        plotAreaElements[id].call(
          yZooms[id].translateBy,
          0,
          t.y / yTransforms[id]().k
        );
      } else {
        Object.keys(plotAreas).forEach((id) => {
          recalculateScale(
            xTransform,
            xScale,
            yScales,
            id,
            plotAreas,
            plotAreaElements,
            yZooms
          );
        });
      }

      isPinned = false;
    } else {
      xElement.call(
        xZoom.scaleBy,
        t.k,
        isPinned ? [xScale.range()[1] - WIDTH, 0] : point
      );

      if (!isFreePan) {
        Object.keys(plotAreas).forEach((id) => {
          recalculateScale(
            xTransform,
            xScale,
            yScales,
            id,
            plotAreas,
            plotAreaElements,
            yZooms
          );
        });
      }
    }

    const xr = xTransform().rescaleX(xScale);
    const yr = yTransforms[id]().rescaleY(yScales[id]);

    xAxis.xScale(xr);
    Object.values(plotAreas).forEach((plotArea) => plotArea.xScale(xr));

    plotAreas[id].yScale(yr);
    yAxes[id].yScale(yr);

    listeners.call("redraw", chart);
    listeners.call("bounds_changed", chart, xr.domain());
  }

  function yAxisDragged(e: any, id: string) {
    plotAreaElements[id].call(
      yZooms[id].scaleBy,
      1 - e.dy / (yScales[id].range()[0] - yScales[id].range()[1]),
      [0, (yScales[id].range()[0] - yScales[id].range()[1]) / 2]
    );

    const yr = yTransforms[id]().rescaleY(yScales[id]);

    plotAreas[id].yScale(yr);
    yAxes[id].yScale(yr);

    isFreePan = true;

    listeners.call("redraw", chart);
  }

  // x-axis
  select<HTMLDivElement, unknown>(axis.ref.current)
    .select(".x-axis")
    .on("measure", (event) => {
      measureXAxis(event, xScale, xTransform, xAxis, yAxes, plotAreas);
    })
    .on("draw", (event) => {
      drawXAxis(event, xAxis);
    });

  select<HTMLDivElement, unknown>(axis.ref.current)
    .select(".x-axis-interaction")
    .on("draw", (event) => {
      select(event.currentTarget)
        .select<SVGSVGElement>("svg")
        .call(xAxisInteraction);
    });

  Object.entries(yScales).map(([id, scale]) =>
    select<HTMLDivElement, unknown>(panels[id].ref.current!)
      .select(".y-axis")
      .on("measure", (event) => {
        measureYAxis(event, scale, yTransforms[id], plotAreas[id], yAxes[id]);
      })
      .on("draw", (event) => {
        drawYAxis(event, yAxes, id);
      })
  );

  Object.entries(panels).forEach(([id, area]) =>
    select<HTMLDivElement, unknown>(area.ref.current!)
      .select(".y-axis-interaction")
      .on("draw", (event) => {
        select(event.currentTarget)
          .select<SVGSVGElement>("svg")
          .call(yAxisInteractions[id]);
      })
  );

  Object.entries(panels).forEach(([id, area]) => {
    select<HTMLDivElement, unknown>(area.ref.current!)
      .select(".plot-area")
      .on("draw", (event) => {
        drawPlotArea(event, plotAreas, id);
      });
  });

  Object.entries(panels).forEach(([id, area]) => {
    select<HTMLDivElement, unknown>(area.ref.current!)
      .select(".plot-area-interaction")
      .on("draw", (event) => {
        drawPlotAreaInteraction(event, plotAreaInteractions, id);
      });
  });

  const chart: ChartInterface = () => {
    listeners.call("redraw", chart);
  };

  chart.plotAreas = (areas: Record<string, ChartPanel>) => {
    const oldIds = Object.keys(plotAreas);
    const newIds = Object.keys(areas);

    const newYScales: Record<string, ScaleLinear> = {};
    const newYAxes: Record<string, yAxisInterface> = {};
    const newYAxisInteractions: Record<string, yAxisInteractionInterface> = {};
    const newPlotAreas: Record<string, PlotAreaInterface> = {};
    const newPlotAreaInteractions: Record<
      string,
      plotAreaInteractionInterface
    > = {};
    const newZooms: Record<string, ZoomBehavior<Element, unknown>> = {};
    const newGPlotAreas: Record<
      string,
      Selection<Element, any, null, undefined>
    > = {};
    const newTs: Record<string, () => ZoomTransform> = {};

    for (const id of newIds) {
      if (oldIds.includes(id)) {
        newYScales[id] = yScales[id];
        newYAxes[id] = yAxes[id];
        newYAxisInteractions[id] = yAxisInteractions[id];
        newPlotAreas[id] = plotAreas[id]
          .data(areas[id].data)
          .renderableElements(areas[id].renderableElements)
          .yEncodingFields(areas[id].yEncodingFields);
        newPlotAreaInteractions[id] = plotAreaInteractions[id];
        newZooms[id] = yZooms[id];
        newGPlotAreas[id] = plotAreaElements[id];
        newTs[id] = yTransforms[id];
      } else {
        newYScales[id] = scaleLinear().domain([0, 1]); //FIXME: Initialize domain
        newYAxes[id] = yAxis(xTransform().rescaleX(xScale), newYScales[id]);
        newYAxisInteractions[id] = yAxisInteraction(newYScales[id]).on(
          "drag",
          (e) => {
            yAxisDragged(e, id);
          }
        );
        newPlotAreas[id] = plotArea(
          xTransform().rescaleX(xScale),
          newYScales[id],
          areas[id].renderableElements,
          areas[id].data,
          areas[id].yEncodingFields
        );
        newPlotAreaInteractions[id] = (plotAreaInteraction(
          xTransform().rescaleX(xScale),
          newYScales[id]
        ).on("zoom", (e, t, point) => {
          zoomed(t, point, id);
        }) as any)
          .on("zoomstart", () => {
            handleZoomstart(newPlotAreas, newYAxes, xAxis);
          })
          .on("zoomend", (offset: [number, number]) => {
            handleZoomend(
              newPlotAreas,
              offset,
              xAxis,
              newYAxes,
              id,
              listeners,
              chart
            );
          })
          .on("dblclick", () => {
            reset();
            listeners.call("dblclick", chart);
          })
          .on("mousemove", (offset: [number, number]) => {
            handleMousemove(
              newPlotAreas,
              offset,
              newYAxes,
              xAxis,
              id,
              listeners,
              chart
            );
          })
          .on("mouseout", () => {
            handleMouseout(newPlotAreas, xAxis, newYAxes, listeners, chart);
          });
        newZooms[id] = d3Zoom<Element, unknown>();
        newGPlotAreas[id] = select<Element, unknown>(areas[id].ref.current!);
        newTs[id] = () => zoomTransform(newGPlotAreas[id].node()!);

        select<HTMLDivElement, unknown>(axis.ref.current)
          .select(".x-axis")
          .on("measure", (event) => {
            measureXAxis(
              event,
              xScale,
              xTransform,
              xAxis,
              newYAxes,
              newPlotAreas
            );
          })
          .on("draw", (event) => {
            drawXAxis(event, xAxis);
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
            select(event.currentTarget)
              .select<SVGSVGElement>("svg")
              .call(newYAxisInteractions[id]);
          });

        select<HTMLDivElement, unknown>(areas[id].ref.current!)
          .select(".plot-area")
          .on("draw", (event) => {
            drawPlotArea(event, plotAreas, id);
          });

        select<HTMLDivElement, unknown>(areas[id].ref.current!)
          .select(".plot-area-interaction")
          .on("draw", (event) => {
            drawPlotAreaInteraction(event, newPlotAreaInteractions, id);
          });
      }
    }

    yScales = newYScales;
    yAxes = newYAxes;
    yAxisInteractions = newYAxisInteractions;
    plotAreas = newPlotAreas;
    plotAreaInteractions = newPlotAreaInteractions;
    yZooms = newZooms;
    plotAreaElements = newGPlotAreas;
    yTransforms = newTs;

    return chart;
  };

  chart.panBy = (n: number) => {
    panBy(n);
  };

  chart.reset = () => {
    reset();
  };

  chart.zoomIn = (delta: number) => {
    zoom(delta);
  };

  chart.zoomOut = (delta: number) => {
    zoom(-delta);
  };

  chart.on = (
    typenames: string,
    callback: (this: object, ...args: any[]) => void
  ): ChartInterface => {
    listeners.on(typenames, callback);
    return chart;
  };

  return chart;
};
