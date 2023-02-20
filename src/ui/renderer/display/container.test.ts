import { Container } from "./container";
import { TemporaryDisplayObject } from "./display-object";

describe("Container", function () {
  describe("parent", function () {
    test("should be present when adding children to Container", function () {
      const container = new Container();
      const child = new TemporaryDisplayObject();

      expect(container.children.length).toEqual(0);
      container.addChild(child);
      expect(container.children.length).toEqual(1);
      expect(child.parent).toEqual(container);
    });
  });

  describe("addChild", function () {
    test("should remove from current parent", function () {
      const parent = new Container();
      const container = new Container();
      const child = new TemporaryDisplayObject();

      parent.addChild(child);

      expect(parent.children.length).toEqual(1);
      expect(child.parent).toEqual(parent);

      container.addChild(child);

      expect(parent.children.length).toEqual(0);
      expect(child.parent).toEqual(container);
    });
  });
});
