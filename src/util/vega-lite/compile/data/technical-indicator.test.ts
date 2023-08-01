import { Transform } from "../../transform";
import { TechnicalIndicatorTransformNode } from "./technical-indicator";

describe("compile/data/technical-indicator", () => {
  describe("assemble", () => {
    test("should return a proper transform", () => {
      const transform: Transform = {
        indicator: "macd",
        on: ["close"],
        as: ["macd", "signal", "divergence"],
      };

      const technicalIndicator = new TechnicalIndicatorTransformNode(
        null,
        transform,
      );

      expect(technicalIndicator.assemble()).toEqual({
        method: "macd",
        on: ["close"],
        as: ["macd", "signal", "divergence"],
        type: "technical-indicator",
      });
    });
  });
});
