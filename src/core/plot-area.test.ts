import { scaleLinear, scaleTime } from "d3-scale";

import { PlotArea } from "./plot-area";

describe("getIndex", () => {
  test("returns corect value if inside range", () => {
    const xScale = scaleTime()
      .domain([new Date(2021, 6, 1), new Date(2021, 6, 11)])
      .range([0, 100]);

    const yScale = scaleLinear();

    const fields = ["date"];

    const plotArea = new PlotArea(
      xScale,
      yScale,
      [],
      [
        { date: new Date(2021, 6, 1) },
        { date: new Date(2021, 6, 6) },
        { date: new Date(2021, 6, 11) },
      ],
      fields,
      [],
      false
    );

    expect(plotArea.getIndex(200)).toEqual([2, new Date(2021, 6, 11)]);
  });

  test("returns null if no data present", () => {
    const xScale = scaleTime()
      .domain([new Date(2021, 6, 1), new Date(2021, 6, 10)])
      .range([0, 100]);

    const yScale = scaleLinear();

    const fields = ["date"];

    const plotArea = new PlotArea(xScale, yScale, [], [], fields, [], false);

    expect(plotArea.getIndex(100)).toEqual(null);
  });

  test("returns null if outside range", () => {
    const xScale = scaleTime()
      .domain([new Date(2021, 6, 1), new Date(2021, 6, 10)])
      .range([0, 100]);

    const yScale = scaleLinear();

    const fields = ["date"];

    const plotArea = new PlotArea(
      xScale,
      yScale,
      [],
      [
        { date: new Date(2021, 6, 1) },
        { date: new Date(2021, 6, 6) },
        { date: new Date(2021, 6, 11) },
      ],
      fields,
      [],
      false
    );

    expect(plotArea.getIndex(200)).toEqual(null);
  });
});
