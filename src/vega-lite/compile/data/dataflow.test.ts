import { OutputNode } from "./dataflow";

describe("OutputNode", () => {
  describe("dependentFields", () => {
    test("should return empty set", () => {
      const flatten = new OutputNode(null);
      expect(flatten.dependentFields()).toEqual(new Set());
    });
  });

  describe("producedFields", () => {
    test("should return empty set", () => {
      const flatten = new OutputNode(null);
      expect(flatten.producedFields()).toEqual(new Set());
    });
  });
});
