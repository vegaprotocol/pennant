import { Interval } from "@util/types";

import { dateFormat, tickFormat } from "./format";

describe("dateFormat", () => {
  test("I1H", () => {
    expect(
      tickFormat(
        [
          new Date(2021, 5, 21, 18),
          new Date(2021, 5, 22, 0),
          new Date(2021, 5, 22, 6),
          new Date(2021, 5, 22, 12),
        ],
        Interval.I1H,
      ),
    ).toEqual(["18:00", "22", "06:00", "12:00"]);

    expect(
      tickFormat(
        [
          new Date(2021, 5, 21, 0),
          new Date(2021, 5, 21, 6),
          new Date(2021, 5, 21, 12),
          new Date(2021, 5, 21, 18),
          new Date(2021, 5, 22, 0),
          new Date(2021, 5, 22, 6),
          new Date(2021, 5, 22, 12),
        ],
        Interval.I1H,
      ),
    ).toEqual(["21", "06:00", "12:00", "18:00", "22", "06:00", "12:00"]);
  });

  test("I1D", () => {
    expect(
      tickFormat(
        [
          new Date(2021, 4, 21),
          new Date(2021, 4, 28),
          new Date(2021, 5, 5),
          new Date(2021, 5, 12),
        ],
        Interval.I1D,
      ),
    ).toEqual(["21", "28", "5 Jun", "12"]);

    expect(
      tickFormat(
        [
          new Date(2021, 5, 1),
          new Date(2021, 6, 1),
          new Date(2021, 7, 1),
          new Date(2021, 8, 1),
        ],
        Interval.I1D,
      ),
    ).toEqual(["1 Jun", "1 Jul", "1 Aug", "1 Sep"]);
  });
});

describe("dateFormat", () => {
  test("I1D", () => {
    expect(dateFormat(new Date(2021, 4, 8, 1, 0, 0), Interval.I1D)).toEqual(
      "May 08",
    );
  });
});
