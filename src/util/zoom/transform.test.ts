import { zoomIdentity, ZoomTransform } from "./transform";

describe("ZoomTransform", () => {
  test("zoomIdentity transform contains k = 1, x = y = 0", () => {
    expect(zoomIdentity).toEqual(new ZoomTransform(1, 0, 0));
  });

  test("transform.scale(k) returns a new transform scaled with k", () => {
    const transform = zoomIdentity.scale(2.5);
    expect(transform.scale(2)).toEqual(new ZoomTransform(5, 0, 0));
  });

  test("transform.translate(x, y) returns a new transform translated with x and y", () => {
    const transform = zoomIdentity.translate(2, 3);
    expect(transform.translate(-4, 4)).toEqual(new ZoomTransform(1, -2, 7));
    expect(transform.scale(2).translate(-4, 4)).toEqual(
      new ZoomTransform(2, -6, 11),
    );
  });

  test("transform.apply([x, y]) returns the transformation of the specified point", () => {
    expect(zoomIdentity.translate(2, 3).scale(2).apply([4, 5])).toEqual([
      10, 13,
    ]);
  });

  test("transform.applyX(x) returns the transformation of the specified x-coordinate", () => {
    expect(zoomIdentity.translate(2, 0).scale(2).applyX(4)).toEqual(10);
  });

  test("transform.applyY(y) returns the transformation of the specified y-coordinate", () => {
    expect(zoomIdentity.translate(0, 3).scale(2).applyY(5)).toEqual(13);
  });

  test("transform.invert([x, y]) returns the inverse transformation of the specified point", () => {
    expect(zoomIdentity.translate(2, 3).scale(2).invert([4, 5])).toEqual([
      1, 1,
    ]);
  });

  test("transform.invertX(x) returns the inverse transformation of the specified x-coordinate", () => {
    expect(zoomIdentity.translate(2, 0).scale(2).invertX(4)).toEqual(1);
  });

  test("transform.invertY(y) returns the inverse transformation of the specified y-coordinate", () => {
    expect(zoomIdentity.translate(0, 3).scale(2).invertY(5)).toEqual(1);
  });

  test("transform.toString() returns a string representing the SVG transform", () => {
    expect(zoomIdentity.toString()).toEqual("translate(0,0) scale(1)");
  });
});
