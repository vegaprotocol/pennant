import { BaseSpec } from "@util/vega-lite";
import { extent } from "d3-array";

export function calculateScales(
  pane: BaseSpec,
  data: any[],
  yEncodingFields: string[],
): [number, number] {
  if (!pane) {
    return [0, 1];
  }

  if (yEncodingFields) {
    const mappedData = yEncodingFields.flatMap(
      (field: any) => data.map((d: any) => d[field]) as unknown as number,
    );

    const domain = extent(mappedData) as [number, number];
    const domainSize = Math.abs(domain[1] - domain[0]);

    return [domain[0] - domainSize * 0.1, domain[1] + domainSize * 0.2];
  } else {
    return [0, 1];
  }
}
