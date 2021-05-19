import "./element-label-annotation.scss";
import classNames from "classnames";
import { Selection } from "d3-selection";
import { LabelAnnotation, ScaleLinear, ScaleTime } from "../../types";

const HEIGHT = 22;

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

    const line = selection
      .selectAll<Element, LabelAnnotation>("div")
      .data<LabelAnnotation>(data, (d: LabelAnnotation) => d.id);

    const label = selection
      .selectAll<Element, LabelAnnotation>("div")
      .data<LabelAnnotation>(data, (d: LabelAnnotation) => d.id)
      .join("div")
      .attr("class", (d) => `annotation intent-${d.intent}`)
      .style("left", `0px`)
      .style("top", (d) => `${d.y - HEIGHT / 2}px`)
      .style("height", `22px`)
      .style("position", "absolute")
      .style("pointer-events", "auto");

    const cell = label
      .selectAll<Element, Cell>("div")
      .data<Cell>(
        (d) => d.cells,
        (d: Cell, i) => i
      )
      .join("div")
      .attr("class", (d) =>
        classNames("cell", { fill: d.fill }, { stroke: d.stroke })
      );

    cell
      .selectAll("span")
      .data((d) => [d])
      .join("span")
      .filter((d) => !("onClick" in d))
      .text((d) => d.label);

    cell
      .selectAll("button")
      .data((d) => [d])
      .join("button")
      .filter((d) => "onClick" in d)
      .attr("class", "action")
      .on("click", (_event, d) => {
        d.onClick?.();
      })
      .text((d) => d.label);
  }
}
