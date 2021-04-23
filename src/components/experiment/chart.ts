import { ScaleLinear, ScaleTime, scaleLinear, scaleTime } from "d3-scale";
import { Selection, select } from "d3-selection";
import {
  ZoomTransform,
  zoom as d3Zoom,
  zoomIdentity,
  zoomTransform,
} from "d3-zoom";

import { FcElement } from "../../types";
import { WIDTH } from "../../constants";
import { dispatch } from "d3-dispatch";
import { plotArea } from "./plot-area";
import { plotAreaInteraction } from "./plot-area-interaction";
import { xAxis as xAxisElement } from "./x-axis";
import { xAxisInteraction as xAxisInteractionElement } from "./x-axis-interaction";
import { yAxis } from "./y-axis";
import { yAxisInteraction } from "./y-axis-interaction";

/**
 * The chart component renders multiple plot areas which share a common x-axis.
 *
 * Zooming and panning over plot areas is supported. Dragging the axes will zoom.
 * @param areas
 * @param axis
 * @param initialBounds
 * @returns
 */
export const chart = (
  areas: Record<
    string,
    { id: string; ref: React.RefObject<HTMLDivElement>; data: any }
  >,
  axis: { ref: React.MutableRefObject<HTMLDivElement>; data: any },
  initialBounds: [Date, Date]
) => {
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

  let xScale: ScaleTime<number, number, number | undefined> = scaleTime<
    number,
    number,
    number | undefined
  >().domain(initialBounds);

  let yScales: Record<
    string,
    ScaleLinear<number, number, number>
  > = Object.fromEntries(
    Object.values(areas).map((value) => [
      value.id,
      scaleLinear().domain([0, 140]),
    ])
  );

  let xZoom = d3Zoom<Element, unknown>();
  let xElement = select<Element, unknown>(axis.ref.current)
    .select<Element>(".x-axis")
    .style("pointer-events", "none");

  let xAxis: any = xAxisElement(xScale);

  let xAxisInteraction: any = xAxisInteractionElement(xScale).on(
    "drag",
    (e) => {
      xDragged(e);
    }
  );

  let yAxes: Record<string, any> = Object.fromEntries(
    Object.values(areas).map((value) => [
      value.id,
      yAxis(xScale, yScales[value.id]),
    ])
  );

  let yAxisInteractions: Record<string, any> = Object.fromEntries(
    Object.values(areas).map((value) => [
      value.id,
      yAxisInteraction(yScales[value.id]).on("drag", (e) => {
        dragged(e, value.id);
      }),
    ])
  );

  let plotAreas: Record<string, any> = Object.fromEntries(
    Object.values(areas).map((value) => [
      value.id,
      plotArea(xScale, yScales[value.id]),
    ])
  );

  let plotAreaInteractions: Record<string, any> = Object.fromEntries(
    Object.values(areas).map((value) => [
      value.id,
      (plotAreaInteraction(xScale, yScales[value.id]).on(
        "zoom",
        (e, t, point) => {
          zoomed(e, t, point, value.id);
        }
      ) as any).on("dblclick", () => {
        reset();
        listeners.call("dblclick", chart);
      }),
    ])
  );

  let yZooms = Object.fromEntries(
    Object.values(areas).map((value) => [value.id, d3Zoom<Element, unknown>()])
  );

  let plotAreaElements = Object.fromEntries(
    Object.values(areas).map((value) => [
      value.id,
      select<Element, any>(areas[value.id].ref.current!)
        .select<Element>(".plot-area")
        .style("pointer-events", "none"),
    ])
  );

  const xTransform = () => zoomTransform(xElement.node()!);

  const yTransforms = Object.fromEntries(
    Object.entries(plotAreaElements).map(([id, plotAreaElement]) => [
      id,
      () => zoomTransform(plotAreaElement.node()!),
    ])
  );

  xElement.call(xZoom);
  Object.entries(plotAreaElements).map(([id, plotAreaElement]) =>
    plotAreaElement.call(yZooms[id])
  );

  function reset() {
    xElement.call(xZoom.transform, zoomIdentity);

    const xr = xTransform().rescaleX(xScale);

    xAxis.xScale(xr);
    Object.entries(plotAreas).forEach(([id, plotArea]) => plotArea.xScale(xr));

    isPinned = true;
    isFreePan = false;

    listeners.call("redraw", chart);
    listeners.call("bounds_changed", chart, xr.domain());
  }

  function zoomed(
    e: any,
    t: ZoomTransform,
    point: [number, number],
    id: string
  ) {
    if (t.k === 1) {
      xElement.call(xZoom.translateBy, t.x / xTransform().k, 0);

      isFreePan &&
        plotAreaElements[id].call(
          yZooms[id].translateBy,
          0,
          t.y / yTransforms[id]().k
        );

      isPinned = false;
    } else {
      xElement.call(
        xZoom.scaleBy,
        t.k,
        isPinned ? [xScale.range()[1], 0] : point
      );
    }

    const xr = xTransform().rescaleX(xScale);
    const yr = yTransforms[id]().rescaleY(yScales[id]);

    xAxis.xScale(xr);
    Object.entries(plotAreas).forEach(([id, plotArea]) => plotArea.xScale(xr));

    plotAreas[id].yScale(yr);
    yAxes[id].yScale(yr);

    listeners.call("redraw", chart);
    listeners.call("bounds_changed", chart, xr.domain());
  }

  function dragged(e: any, id: string) {
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

  function xDragged(e: any) {
    xElement.call(
      xZoom.scaleBy,
      1 - e.dx / (xScale.range()[1] - xScale.range()[0]),
      [
        isPinned
          ? xScale.range()[1] - WIDTH
          : (xScale.range()[1] - xScale.range()[0]) / 2,
        0,
      ]
    );

    const xr = xTransform().rescaleX(xScale);
    xAxis.xScale(xr);
    Object.entries(plotAreas).forEach(([id, plotArea]) => plotArea.xScale(xr));
    Object.entries(yAxes).forEach(([id, axis]) => axis.xScale(xr));

    listeners.call("redraw", chart);
    listeners.call("bounds_changed", chart, xr.domain());
  }

  // x-axis
  select<HTMLDivElement, unknown>(axis.ref.current)
    .select(".x-axis")
    .on("measure", (event) => {
      const { width } = event.detail;
      xScale.range([0, width]);

      const xr = xTransform().rescaleX(xScale);
      xAxis.xScale(xr);
      Object.entries(yAxes).forEach(([id, axis]) => axis.xScale(xr));
      Object.entries(plotAreas).forEach(([id, plotArea]) =>
        plotArea.xScale(xr)
      );
    })
    .on("draw", (event) => {
      const ctx = select(event.currentTarget)
        .select<HTMLCanvasElement>("canvas")
        .node()
        ?.getContext("2d");

      const pixelRatio = event.detail.pixelRatio;

      ctx?.scale(pixelRatio, pixelRatio);

      xAxis.context(ctx).pixelRatio(pixelRatio)();
    });

  select<HTMLDivElement, unknown>(axis.ref.current)
    .select(".x-axis-interaction")
    .on("draw", (event) => {
      select(event.currentTarget)
        .select<SVGSVGElement>("svg")
        .call(xAxisInteraction);
    });

  Object.entries(yScales).map(([key, scale]) =>
    select<HTMLDivElement, unknown>(areas[key].ref.current!)
      .select(".y-axis")
      .on("measure", (event) => {
        const { height } = event.detail;
        yScales[key].range([height, 0]);

        const yr = yTransforms[key]().rescaleY(yScales[key]);

        plotAreas[key].yScale(yr);
        yAxes[key].yScale(yr);
      })
      .on("draw", (event) => {
        const ctx = select(event.currentTarget)
          .select<HTMLCanvasElement>("canvas")
          .node()
          ?.getContext("2d");

        const pixelRatio = event.detail.pixelRatio;

        ctx?.scale(pixelRatio, pixelRatio);

        yAxes[key].context(ctx).pixelRatio(pixelRatio)();
      })
  );

  Object.entries(yScales).map(([key, scale]) =>
    select<HTMLDivElement, unknown>(areas[key].ref.current!)
      .select(".y-axis-interaction")
      .on("draw", (event) => {
        select(event.currentTarget)
          .select<SVGSVGElement>("svg")
          .call(yAxisInteractions[key]);
      })
  );

  Object.entries(yScales).map(([key, scale]) => {
    select<HTMLDivElement, unknown>(areas[key].ref.current!)
      .select(".plot-area")
      .on("draw", (event) => {
        const ctx = select(event.currentTarget)
          .select<HTMLCanvasElement>("canvas")
          .node()
          ?.getContext("2d");

        const pixelRatio = event.detail.pixelRatio;

        ctx?.scale(pixelRatio, pixelRatio);

        plotAreas[key].context(ctx).pixelRatio(pixelRatio)(areas[key].data);
      });
  });

  Object.entries(yScales).map(([key, scale]) => {
    select<HTMLDivElement, unknown>(areas[key].ref.current!)
      .select(".plot-area-interaction")
      .on("draw", (event) => {
        select(event.currentTarget)
          .select<SVGSVGElement>("svg")
          .call(plotAreaInteractions[key]);
      });
  });

  const chart = () => {
    listeners.call("redraw", chart);
  };

  chart.plotAreas = (
    areas: Record<
      string,
      { id: string; ref: React.RefObject<HTMLDivElement>; data: any }
    >
  ) => {
    const oldIds = Object.keys(yScales);
    const newIds = Object.keys(areas);

    const newYScales: Record<string, ScaleLinear<number, number, number>> = {};
    const newYAxes: Record<string, any> = {};
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
        newPlotAreas[id] = plotAreas[id];
        newPlotAreaInteractions[id] = plotAreaInteractions[id];
        newZooms[id] = yZooms[id];
        newGPlotAreas[id] = plotAreaElements[id];
        newTs[id] = yTransforms[id];
      } else {
        newYScales[id] = scaleLinear().domain([
          0,
          Math.ceil(10 * Math.random() + 5),
        ]);
        newYAxes[id] = yAxis(xTransform().rescaleX(xScale), newYScales[id]);
        newYAxisInteractions[id] = yAxisInteraction(newYScales[id]).on(
          "drag",
          (e) => {
            dragged(e, id);
          }
        );
        newPlotAreas[id] = plotArea(
          xTransform().rescaleX(xScale),
          newYScales[id]
        );
        newPlotAreaInteractions[id] = (plotAreaInteraction(
          xTransform().rescaleX(xScale),
          newYScales[id]
        ).on("zoom", (e, t, point) => {
          zoomed(e, t, point, id);
        }) as any).on("dblclick", () => {
          reset();
          listeners.call("dblclick", chart);
        });
        newZooms[id] = d3Zoom<Element, unknown>();
        newGPlotAreas[id] = select<Element, unknown>(areas[id].ref.current!);
        yTransforms[id] = () => zoomTransform(newGPlotAreas[id].node());

        select<HTMLDivElement, unknown>(areas[id].ref.current!)
          .select(".y-axis")
          .on("measure", (event) => {
            const { height } = event.detail;
            yScales[id].range([height, 0]);

            const yr = yTransforms[id]().rescaleY(yScales[id]);
            plotAreas[id].yScale(yr);
            yAxes[id].yScale(yr);
          })
          .on("draw", (event) => {
            select(event.currentTarget)
              .select<SVGSVGElement>("svg")
              .call(yAxes[id]);
          });

        select<HTMLDivElement, unknown>(areas[id].ref.current!)
          .select(".plot-area")
          .on("draw", (event) => {
            const ctx = select(event.currentTarget)
              .select<HTMLCanvasElement>("canvas")
              .node()
              ?.getContext("2d");

            plotAreas[id].context(ctx)();
          });

        select<HTMLDivElement, unknown>(areas[id].ref.current!)
          .select(".plot-area-interaction")
          .on("draw", (event) => {
            select(event.currentTarget)
              .select<SVGSVGElement>("svg")
              .call(plotAreaInteractions[id]);
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

    return chart;
  };

  chart.on = (
    typenames: string,
    callback?: (this: object, ...args: any[]) => void
  ) => {
    if (callback) {
      listeners.on(typenames, callback);
      return chart;
    } else {
      return listeners.on(typenames);
    }
  };

  return chart;
};
