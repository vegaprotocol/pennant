import { Container } from "./";

describe("Container", () => {
  describe("parent", () => {
    test("should be present when adding children to Container", () => {
      const container = new Container();
      const child = new Container();

      expect(container.children.length).toBe(0);
      container.addChild(child);
      expect(container.children.length).toBe(1);
      expect(child.parent).toEqual(container);
    });
  });
});
