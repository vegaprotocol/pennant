import { Circle } from "./circle";

describe("Circle", function () {
  test("should create a new circle", function () {
    const circ1 = new Circle();

    expect(circ1.x).toEqual(0);
    expect(circ1.y).toEqual(0);
    expect(circ1.radius).toEqual(0);

    const circ2 = new Circle(10, 10, 5);

    expect(circ2.x).toEqual(10);
    expect(circ2.y).toEqual(10);
    expect(circ2.radius).toEqual(5);
  });

  test("should clone a new circle", function () {
    const circ1 = new Circle(10, 10, 5);

    expect(circ1.x).toEqual(10);
    expect(circ1.y).toEqual(10);
    expect(circ1.radius).toEqual(5);

    const circ2 = circ1.clone();

    expect(circ2.x).toEqual(10);
    expect(circ2.y).toEqual(10);
    expect(circ2.radius).toEqual(5);
    expect(circ1).not.toBe(circ2);
  });

  test("should check if point is within circle", function () {
    const circ1 = new Circle(10, 10, 5);

    expect(circ1.contains(10, 10)).toBeTruthy();
    expect(circ1.contains(10, 15)).toBeTruthy();
    expect(circ1.contains(15, 10)).toBeTruthy();
    expect(circ1.contains(5, 10)).toBeTruthy();
    expect(circ1.contains(15, 10)).toBeTruthy();

    expect(circ1.contains(6, 7)).toBeTruthy();
    expect(circ1.contains(7, 6)).toBeTruthy();
    expect(circ1.contains(7, 7)).toBeTruthy();
    expect(circ1.contains(13, 14)).toBeTruthy();
    expect(circ1.contains(14, 13)).toBeTruthy();

    expect(circ1.contains(14, 14)).toBeFalsy();
    expect(circ1.contains(10, 16)).toBeFalsy();
    expect(circ1.contains(11, 15)).toBeFalsy();
    expect(circ1.contains(0, 0)).toBeFalsy();

    const circ2 = new Circle(10, 10, 0);

    expect(circ2.contains(10, 10)).toBeFalsy();
  });

  test("should return framing rectangle", function () {
    const circ1 = new Circle(10, 10, 5);
    const rect1 = circ1.getBounds();

    expect(rect1.left).toEqual(5);
    expect(rect1.top).toEqual(5);
    expect(rect1.right).toEqual(15);
    expect(rect1.bottom).toEqual(15);
  });
});
