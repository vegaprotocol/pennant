import { RenderableElement, ScaleLinear, ScaleTime } from "../../types";
import {
  ZoomTransform,
  zoom as d3Zoom,
  zoomIdentity,
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
} from "./helpers/chart-event-helpers";
import { scaleLinear, scaleTime } from "d3-scale";
import { xAxis as xAxisElement, xAxisInterface } from "./x-axis";
import {
  xAxisInteraction as xAxisInteractionElement,
  xAxisInteractionInterface,
} from "./x-axis-interaction";
import { yAxis, yAxisInterface } from "./y-axis";

import { WIDTH } from "../../constants";
import { dispatch } from "d3-dispatch";
import { plotArea } from "./plot-area";
import { plotAreaInteraction } from "./plot-area-interaction";
import { select } from "d3-selection";
import { yAxisInteraction } from "./y-axis-interaction";

export type ChartPanel = {
  id: string;
  ref: React.RefObject<HTMLDivElement>;
  data: any[];
  renderableElements: RenderableElement[];
  yEncodingFields?: string[];
};

export interface ChartInterface {
  on(
    typenames: string,
    callback?: (this: object, ...args: any[]) => void
  ): ChartInterface;
  plotAreas(areas: Record<string, ChartPanel>): ChartInterface;
  reset(): void;
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

  let yAxes: Record<string, any> = Object.fromEntries(
    Object.entries(yScales).map(([id, scale]) => [id, yAxis(xScale, scale)])
  );

  let yAxisInteractions: Record<string, any> = Object.fromEntries(
    Object.values(panels).map((value) => [
      value.id,
      yAxisInteraction(yScales[value.id]).on("drag", (e) => {
        yAxisDragged(e, value.id);
      }),
    ])
  );

  let plotAreas: Record<string, any> = Object.fromEntries(
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

  let plotAreaInteractions: Record<string, any> = Object.fromEntries(
    Object.values(panels).map((value) => [
      value.id,
      (plotAreaInteraction(xScale, yScales[value.id]).on(
        "zoom",
        (_e, t, point) => {
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

  function reset() {
    const xr = xTransform().rescaleX(xScale);

    xElement.call(
      xZoom.transform,
      zoomIdentity.translate(
        -WIDTH - (xScale(1000 * 60 * 5) - xScale(0)) * 5,
        0
      )
    ); // TODO: Subtract N candle widths

    xAxis.xScale(xr);
    Object.entries(plotAreas).forEach(([id, plotArea]) => {
      plotArea.xScale(xr);

      recalcuateScale(
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
        recalcuateScale(
          xTransform,
          xScale,
          yScales,
          id,
          plotAreas,
          plotAreaElements,
          yZooms
        );
      }

      isPinned = false;
    } else {
      xElement.call(
        xZoom.scaleBy,
        t.k,
        isPinned
          ? [
              xScale.range()[1] -
                WIDTH -
                (xScale(1000 * 60 * 5) - xScale(0)) * 5,
              0,
            ]
          : point
      );

      if (!isFreePan) {
        recalcuateScale(
          xTransform,
          xScale,
          yScales,
          id,
          plotAreas,
          plotAreaElements,
          yZooms
        );
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
    const newYAxisInteractions: Record<string, any> = {};
    const newPlotAreas: Record<string, any> = {};
    const newPlotAreaInteractions: Record<string, any> = {};
    const newZooms: Record<string, any> = {};
    const newGPlotAreas: Record<string, any> = {};
    const newTs: Record<string, any> = {};

    for (const id of newIds) {
      if (oldIds.includes(id)) {
        newYScales[id] = yScales[id];
        newYAxes[id] = yAxes[id];
        newYAxisInteractions[id] = yAxisInteractions[id];
        newPlotAreas[id] = plotAreas[id].renderableElements(
          areas[id].renderableElements
        );
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
        newTs[id] = () => zoomTransform(newGPlotAreas[id].node());

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

  chart.reset = () => {
    reset();
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

function recalcuateScale(
  xTransform: () => ZoomTransform,
  xScale: ScaleTime,
  yScales: Record<string, ScaleLinear>,
  id: string,
  plotAreas: Record<string, any>,
  plotAreaElements: any,
  yZooms: any
) {
  const xr = xTransform().rescaleX(xScale);
  const bounds = xr.domain();
  const originalExtent = yScales[id].range();
  const newExtent = plotAreas[id].extent(bounds);
  const originalHeight = Math.abs(originalExtent[0] - originalExtent[1]);

  const newHeight = Math.abs(
    yScales[id](newExtent[1]) - yScales[id](newExtent[0])
  );

  plotAreaElements[id].call(
    yZooms[id].transform,
    zoomIdentity
      .translate(0, originalHeight / 2)
      .scale(originalHeight / (1.3 * newHeight))
      .translate(
        0,
        -(
          yScales[id](newExtent[0]) -
          0.1 * newHeight +
          yScales[id](newExtent[1]) +
          0.2 * newHeight
        ) / 2
      )
  );
}
