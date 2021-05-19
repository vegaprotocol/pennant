import "./element-label-annotation.scss";

import classNames from "classnames";
import { select, Selection } from "d3-selection";

import { LabelAnnotation, ScaleLinear, ScaleTime } from "../../types";

const HEIGHT = 22;

const size = HEIGHT - 8;
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
    yScale: ScaleLinear
  ): void;
}

type Cell = {
  label: string;
  stroke?: boolean;
  fill?: boolean;
  onClick?: () => void;
  spinner?: boolean;
};

export class LabelAnnotationHtmlElement implements RenderableHTMLElement {
  readonly labels: LabelAnnotation[];

  constructor(cfg: { labels: LabelAnnotation[] }) {
    const { labels } = cfg;

    this.labels = [...labels].sort((a, b) => b.y - a.y);
  }

  draw(
    selection: Selection<Element, any, any, any>,
    xScale: ScaleTime,
    yScale: ScaleLinear
  ): void {
    let previousY = -Infinity;

    const yPositions = this.labels.map((label) => yScale(label.y));

    const sortedYPositions = [...yPositions].sort((a, b) => a - b);
    const shiftedYPositions = sortedYPositions.reduce<number[]>((p, y) => {
      const ypx = y;

      let ny = ypx;

      if (ypx - previousY < HEIGHT) {
        ny = previousY + HEIGHT;
      }

      p.push(ny);

      previousY = ny || ypx;

      return p;
    }, []);

    const data: LabelAnnotation[] = this.labels.map((label, labelIndex) => ({
      ...label,
      y: shiftedYPositions[labelIndex],
    }));

    const label = selection
      .selectAll<Element, LabelAnnotation>("div.annotation")
      .data(data, (d) => d.id)
      .join(
        (enter) => {
          return enter
            .append("div")
            .attr("class", (d) => `annotation intent-${d.intent}`)
            .style("left", `0px`)
            .style("height", `22px`)
            .style("position", "absolute")
            .style("pointer-events", "auto");
        },
        (update) => {
          return update.style("top", (d) => `${d.y - HEIGHT / 2}px`);
        },
        (exit) => {
          return exit.remove();
        }
      );

    const cell = label
      .selectAll<Element, Cell>("div.cell")
      .data<Cell>((d) => d.cells)

      .join(
        (enter) =>
          enter
            .append("div")
            .attr("class", (d) =>
              classNames("cell", { fill: d.fill }, { stroke: d.stroke })
            ),
        (update) =>
          update.attr("class", (d) =>
            classNames("cell", { fill: d.fill }, { stroke: d.stroke })
          ),
        (exit) => {
          return exit.remove();
        }
      );

    cell
      .selectAll(".content")
      .data((d) => [d])
      .join(
        (enter) => {
          enter.append((d: Cell) => {
            if (d.spinner) {
              const div = document.createElement("div");

              select(div)
                .append("span")
                .style("visibility", "hidden")
                .text(d.label);

              select(div)
                .append("div")
                .attr("class", "content spinner-animation")
                .selectAll("svg")
                .data((d) => [d])
                .join("svg")
                .attr("width", size)
                .attr("height", size)
                .attr(
                  "viewBox",
                  `${viewBoxX} ${viewBoxX} ${viewBoxWidth} ${viewBoxWidth}`
                )
                .selectAll("path")
                .data([null, null])
                .join("path")
                .attr("d", SPINNER_TRACK)
                .attr("class", (d, i) =>
                  i === 1 ? "spinner-head" : "spinner-track"
                )
                .attr("stroke-width", strokeWidth)
                .attr("fill-pacity", 0)
                .attr("pathLength", (d, i) => (i === 1 ? "280" : null))
                .attr("stroke-dasharray", (d, i) =>
                  i === 1 ? "280 280" : null
                )
                .attr("stroke-dashoffset", (d, i) => (i === 1 ? "210" : null));

              return div;
            } else if (d.onClick) {
              const button = document.createElement("button");

              select(button)
                .attr("class", "content action")
                .on("click", () => {
                  d.onClick?.();
                })
                .text(d.label);

              return button;
            } else {
              const span = document.createElement("span");

              select(span).attr("class", "content").text(d.label);

              return span;
            }
          });

          return enter;
        },
        (update) => {
          update.each(function (p, j) {
            console.log(p, j, this);
          });

          return update;
        }
      );
  }
}
