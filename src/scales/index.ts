import { CandleDetailsExtended, Scenegraph } from "../types";

import { ScaleLinear } from "d3-scale";
import { extent } from "d3-array";

export function recalculateScales(
  scenegraph: Scenegraph,
  data: CandleDetailsExtended[],
  scalesRef: React.MutableRefObject<ScaleLinear<number, number, never>[]>
) {
  scenegraph.panels.forEach((panel, i) => {
    const yEncodingFields = panel.yEncodingFields;

    if (yEncodingFields) {
      const mappedData = yEncodingFields.flatMap(
        (field: any) =>
          (data.map(
            (d) => d[field as keyof CandleDetailsExtended]
          ) as unknown) as number
      );

      const domain = extent(mappedData) as [number, number];
      const domainSize = Math.abs(domain[1] - domain[0]);

      // TO DO: Include zero if specified in specification
      scalesRef.current![i].domain([
        domain[0] - domainSize * 0.1,
        domain[1] + domainSize * 0.2,
      ]);
    }
  });
}
