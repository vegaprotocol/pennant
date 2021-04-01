import { ScaleLinear } from "d3-scale";
import { Scenegraph } from "../types";
import { extent } from "d3-array";

export function recalculateScales(
  scenegraph: Scenegraph,
  data: any[][],
  scalesRef: React.MutableRefObject<ScaleLinear<number, number, never>[]>
) {
  scenegraph.panels.forEach((panel, i) => {
    const yEncodingFields = panel.yEncodingFields;

    if (yEncodingFields) {
      const mappedData = yEncodingFields.flatMap(
        (field: any) => (data[i].map((d: any) => d[field]) as unknown) as number
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
