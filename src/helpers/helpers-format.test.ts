import { Interval } from "../types";
import { dateFormat } from "./helpers-format";

describe("dateFormat", () => {
  test("I1D", () => {
    expect(dateFormat(new Date(2021, 4, 8, 1, 0, 0), Interval.I1D)).toEqual(
      "May 08"
    );
  });
});
