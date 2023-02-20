import { Container } from "./container";
import { TemporaryDisplayObject } from "./display-object";

describe("DisplayObject", function () {
  describe("setParent", function () {
    test("should add itself to a Container", function () {
      const child = new TemporaryDisplayObject();
      const container = new Container();

      expect(container.children.length).toEqual(0);
      child.setParent(container);
      expect(container.children.length).toEqual(1);
      expect(child.parent).toEqual(container);
    });
  });
});
