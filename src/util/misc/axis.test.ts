import { getNumXTicks, getNumYTicks } from "./axis";

describe("getNumXTicks", () => {
  test("Expect minimum value", () => {
    expect(getNumXTicks(1)).toEqual(3);
  });

  test("Treat negative input as if positive", () => {
    expect(getNumXTicks(-600)).toEqual(6);
  });
});

describe("getNumYTicks", () => {
  test("Expect minimum value", () => {
    expect(getNumYTicks(1)).toEqual(3);
  });

  test("Treat negative input as if positive", () => {
    expect(getNumYTicks(-600)).toEqual(12);
  });
});
