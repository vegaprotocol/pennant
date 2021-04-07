import {
  DEFAULT_CANDLES,
  GQLInterval,
  createIntervalOptions,
  getCandlesCount,
  getInitialExtents,
  getSubMinutes,
  getTimeFormat,
  parseInterval,
} from "./helpers-interval";
import { subHours, subMinutes } from "date-fns";

import { Interval } from "../stories/api/vega-graphql";

const intervals: GQLInterval[] = ["I15M", "I1D", "I1H", "I1M", "I5M", "I6H"];

describe("interval", () => {
  describe("parseInterval", () => {
    it("Throws an error if an invalid interval is used", () => {
      expect(() => {
        parseInterval("fooo" as Interval);
      }).toThrowError("Invalid interval");
    });

    it("Returns a tuple containing the value and unit", () => {
      expect(parseInterval(Interval.I15M)).toEqual([15, "M"]);
      expect(parseInterval(Interval.I6H)).toEqual([6, "H"]);
    });
  });

  describe("createIntervalOptions", () => {
    it("Sorts the result by interval length", () => {
      const res = createIntervalOptions(intervals);
      const intervalOptionsSortedByTime = [
        { label: "1m", interval: "I1M" },
        { label: "5m", interval: "I5M" },
        { label: "15m", interval: "I15M" },
        { label: "1h", interval: "I1H" },
        { label: "6h", interval: "I6H" },
        { label: "1d", interval: "I1D" },
      ];

      expect(res).toEqual(intervalOptionsSortedByTime);
    });
  });

  describe("getInitialExtents", () => {
    it("returns the correct initial date to display 10 candles", () => {
      const endDate = new Date();
      const resultI1M = getInitialExtents(Interval.I1M, endDate);

      expect(resultI1M).toEqual([
        subMinutes(endDate, DEFAULT_CANDLES),
        endDate,
      ]);

      const resultI15M = getInitialExtents(Interval.I15M, endDate);
      expect(resultI15M).toEqual([
        subMinutes(endDate, DEFAULT_CANDLES * 15),
        endDate,
      ]);

      const resultI6H = getInitialExtents(Interval.I6H, endDate);
      expect(resultI6H).toEqual([
        subHours(endDate, DEFAULT_CANDLES * 6),
        endDate,
      ]);
    });
  });

  describe("getTimeFormatForInterval", () => {
    const date = new Date("2018-08-15T19:24:00");
    it("Formats correctly for minute intervals", () => {
      const format = getTimeFormat(Interval.I5M);
      expect(format(date)).toEqual("HH:mm");
    });

    it("Formats correctly for hour intervals", () => {
      const format = getTimeFormat(Interval.I6H);
      expect(format(date)).toEqual("HH:mm");
    });

    it("Formats correctly for day intervals", () => {
      const format = getTimeFormat(Interval.I1D);
      expect(format(date)).toEqual("MMM d");
    });
  });

  describe("getCandlesCount", () => {
    it("Works", () => {
      expect(
        getCandlesCount(Interval.I1M, [
          new Date("2020-01-01T01:00"),
          new Date("2020-01-01T01:30"),
        ])
      ).toEqual(30);
      expect(
        getCandlesCount(Interval.I5M, [
          new Date("2020-01-01T01:00"),
          new Date("2020-01-01T01:30"),
        ])
      ).toEqual(6);
      expect(
        getCandlesCount(Interval.I15M, [
          new Date("2020-01-01T01:00"),
          new Date("2020-01-01T01:30"),
        ])
      ).toEqual(2);
      expect(
        getCandlesCount(Interval.I1H, [
          new Date("2020-01-01T01:00"),
          new Date("2020-01-02T01:00"),
        ])
      ).toEqual(24);
      expect(
        getCandlesCount(Interval.I6H, [
          new Date("2020-01-01T01:00"),
          new Date("2020-01-02T01:00"),
        ])
      ).toEqual(4);
      expect(
        getCandlesCount(Interval.I1D, [
          new Date("2020-01-01T01:00"),
          new Date("2020-01-11T01:00"),
        ])
      ).toEqual(10);
    });
  });

  describe("getSubMinutes", () => {
    expect(getSubMinutes(Interval.I1M, 10)).toEqual(10);
    expect(getSubMinutes(Interval.I5M, 10)).toEqual(50);
    expect(getSubMinutes(Interval.I15M, 10)).toEqual(150);
    expect(getSubMinutes(Interval.I1H, 10)).toEqual(600);
    expect(getSubMinutes(Interval.I6H, 10)).toEqual(3600);
    expect(getSubMinutes(Interval.I1D, 10)).toEqual(14400);
  });
});
