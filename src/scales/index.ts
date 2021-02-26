import { CandleDetailsExtended } from "../types/element";
import { ScaleLinear } from "d3-scale";
import { View } from "../types/vega-spec-types";
import { extent } from "d3-array";

export function recalculateScales(
  view: View[],
  filteredData: CandleDetailsExtended[],
  scalesRef: React.MutableRefObject<ScaleLinear<number, number, never>[]>
) {
  view.forEach((panel, i) => {
    const yEncodingFields = [];

    if (panel.layer) {
      panel.layer.forEach((layer) => {
        yEncodingFields.push(layer.encoding.y);

        if (layer.encoding.y2) {
          yEncodingFields.push(layer.encoding.y2.field);
        }
      });
    } else {
      yEncodingFields.push(panel.encoding.y.field);

      if (panel.encoding.y2) {
        yEncodingFields.push(panel.encoding.y2.field);
      }
    }

    const mappedData = yEncodingFields.flatMap(
      (field) =>
        (filteredData.map(
          (d) => d[field as keyof CandleDetailsExtended]
        ) as unknown) as number
    );

    const domain = extent(mappedData) as [number, number];
    const domainSize = Math.abs(domain[1] - domain[0]);

    scalesRef.current![i].domain([
      panel.encoding.y?.scale?.zero ? 0 : domain[0] - domainSize * 0.1,
      domain[1] + domainSize * 0.1,
    ]);
  });
}
