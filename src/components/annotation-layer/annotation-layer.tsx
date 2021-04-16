import "./annotation-layer.scss";

import * as React from "react";

import { Label } from "../label";
import { Annotation } from "../../types";
import { Colors } from "../../helpers";

export type AnnotationLayerProps = {
  annotations: Annotation[];
};

export const AnnotationLayer = ({ annotations }: AnnotationLayerProps) => {
  const [widths, setWidths] = React.useState<{
    [index: string]: number;
  } | null>(null);

  const refs: {
    [index: string]: React.RefObject<HTMLDivElement>;
  } = React.useMemo(
    () =>
      annotations.reduce((acc, value) => {
        acc[value.id] = React.createRef<HTMLDivElement>();
        return acc;
      }, {} as { [index: string]: React.RefObject<HTMLDivElement> }),
    [annotations]
  );

  React.useLayoutEffect(() => {
    setWidths(
      Object.fromEntries(
        Object.entries(refs).map(([key, value]) => [
          key,
          value.current ? value.current.getBoundingClientRect().width : 0,
        ])
      )
    );
  }, [refs]);

  let previousY = -12;

  const sortedAnnotations = [...annotations].sort((a, b) => a.y - b.y);

  const shiftedAnnotations = sortedAnnotations.reduce<number[]>((p, c) => {
    const ypx = c.y;

    let ny = ypx;

    if (ypx - previousY < 24) {
      ny = previousY + 24;
    }

    p.push(ny);

    previousY = ny || ypx;

    return p;
  }, []);

  return (
    <div className="annotation-layer-wrapper">
      <svg className="annotation-layer-lines">
        {sortedAnnotations.map((annotation, i) => (
          <line
            key={annotation.id}
            x1={widths?.[annotation.id] ?? 0}
            y1={shiftedAnnotations[i]}
            x2="100%"
            y2={annotation.y}
            stroke={
              annotation.intent === "success"
                ? Colors.VEGA_GREEN
                : Colors.VEGA_RED
            }
            strokeWidth={2}
            strokeDasharray="2 6"
          />
        ))}
      </svg>
      {sortedAnnotations.map((annotation, i) => (
        <div
          key={annotation.id}
          className="annotation-layer__label_wrapper"
          style={{
            top: `${shiftedAnnotations[i] - 12}px`,
          }}
        >
          <Label
            ref={refs[annotation.id]}
            cells={annotation.cells}
            intent={annotation.intent}
          />
        </div>
      ))}
    </div>
  );
};
