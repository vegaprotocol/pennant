import "./element-label-annotation.css";

import { LABEL_ANNOTATION_HEIGHT } from "@util/constants";
import { calculateShiftedPositions } from "@util/misc";
import { LabelAnnotation, ScaleLinear, ScaleTime } from "@util/types";
import classNames from "classnames";
import { Selection } from "d3-selection";

const size = LABEL_ANNOTATION_HEIGHT - 8;
const strokeWidth = 16;
const R = 45;
const radius = R + strokeWidth / 2;
const viewBoxX = (50 - radius).toFixed(2);
const viewBoxWidth = (radius * 2).toFixed(2);

const SPINNER_TRACK = `M 50,50 m 0,-${R} a ${R},${R} 0 1 1 0,${
  R * 2
} a ${R},${R} 0 1 1 0,-${R * 2}`;

export interface RenderableHTMLElement {
  draw(
    selection: Selection<Element, any, any, any>,
    xScale: ScaleTime,
    yScale: ScaleLinear,
  ): void;
}

export class LabelAnnotationHtmlElement implements RenderableHTMLElement {
  readonly labels: LabelAnnotation[];

  constructor(cfg: { labels: LabelAnnotation[] }) {
    const { labels } = cfg;

    this.labels = [...labels].sort((a, b) => b.y - a.y);
  }

  draw(
    selection: Selection<Element, any, any, any>,
    _xScale: ScaleTime,
    yScale: ScaleLinear,
  ): void {
    const yPositions = this.labels.map((label) => yScale(label.y));
    const shiftedYPositions = calculateShiftedPositions(
      yPositions,
      LABEL_ANNOTATION_HEIGHT,
    );

    const data: LabelAnnotation[] = this.labels.map((label, labelIndex) => ({
      ...label,
      y: shiftedYPositions[labelIndex],
    }));

    const label = selection
      .selectAll<Element, LabelAnnotation>("div.annotation")
      .data(data, (d) => d.id)
      .join((enter) =>
        enter
          .append("div")
          .style("left", `0px`)
          .style("height", `22px`)
          .style("position", "absolute")
          .style("pointer-events", "auto"),
      )
      .attr("class", (d) => `annotation intent-${d.intent}`)
      .style("top", (d) => `${d.y - LABEL_ANNOTATION_HEIGHT / 2}px`);

    label
      .selectAll("span.cell")
      .data((d) => d.cells.filter((d) => !("onClick" in d)))
      .join("span")
      .attr("class", (d) =>
        classNames(
          "cell",
          { fill: d.fill },
          { stroke: d.stroke },
          { numeric: d.numeric },
          { [`cell-intent-${d.intent}`]: d.intent },
        ),
      )
      .text((d) => d.label);

    label
      .selectAll("div.cell")
      .data((d) => d.cells.filter((d) => "onClick" in d))
      .join(
        (enter) => {
          const div = enter.append("div").attr("class", "cell");

          div
            .append("button")
            .attr("class", "content action")
            .on("click", (_event, d) => {
              d.onClick?.();
            })
            .style("visibility", (d) => (d.spinner ? "hidden" : "visible"))
            .text((d) => d.label);

          div
            .append("div")
            .attr("class", (d) =>
              classNames("content", "spinner-animation", {
                "no-spin": !d.spinner,
              }),
            )
            .style("visibility", (d) => (d.spinner ? "visible" : "hidden"))
            .selectAll("svg")
            .data((d) => [d])
            .join("svg")
            .attr("width", size)
            .attr("height", size)
            .attr(
              "viewBox",
              `${viewBoxX} ${viewBoxX} ${viewBoxWidth} ${viewBoxWidth}`,
            )
            .selectAll("path")
            .data([null, null])
            .join("path")
            .attr("d", SPINNER_TRACK)
            .attr("class", (d, i) =>
              i === 1 ? "spinner-head" : "spinner-track",
            )
            .attr("stroke-width", strokeWidth)
            .attr("fill-opacity", 0)
            .attr("pathLength", (_d, i) => (i === 1 ? "280" : null))
            .attr("stroke-dasharray", (_d, i) => (i === 1 ? "280 280" : null))
            .attr("stroke-dashoffset", (_d, i) => (i === 1 ? "210" : null));

          return div;
        },
        (update) => {
          update
            .select("button")
            .style("visibility", (d) => (d.spinner ? "hidden" : "visible"));

          update
            .select("div")
            .attr("class", (d) =>
              classNames("content", "spinner-animation", {
                "no-spin": !d.spinner,
              }),
            )
            .style("visibility", (d) => (d.spinner ? "visible" : "hidden"));

          return update;
        },
      );
  }
}
