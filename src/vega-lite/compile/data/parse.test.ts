import { Model } from "../model";
import { PlaceholderDataFlowNode } from "./util";
import { TechnicalIndicatorTransformNode } from "./technical-indicator";
import { Transform } from "../../transform";
import { parseTransformArray } from "./parse";

describe("compile/data/parse", () => {
  describe("parseTransformArray()", () => {
    it("should return a FoldTransformNode", () => {
      const transform: Transform = {
        indicator: "bollinger",
        on: "A",
      };
      const model = new Model(
        {
          data: { values: [] },
          mark: "line",
          transform: [transform],
          encoding: {
            x: { field: "A", type: "temporal" },
            y: { field: "B", type: "quantitative" },
          },
        },
        null
      );
      const root = new PlaceholderDataFlowNode(null);
      const result = parseTransformArray(root, model);
      expect(root.children[0]).toBeInstanceOf(TechnicalIndicatorTransformNode);
      expect(result).toBeInstanceOf(TechnicalIndicatorTransformNode);
    });
  });
});
