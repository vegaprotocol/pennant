import { calculateShiftedPositions } from "./math";

describe("calculateShiftedPositions", () => {
  test("simple examples", () => {
    expect(calculateShiftedPositions([0, 5, 10, 40], 10)).toEqual([
      0, 10, 20, 40,
    ]);

    expect(calculateShiftedPositions([-10, 5, 10, 40], 10)).toEqual([
      -10, 5, 15, 40,
    ]);

    expect(calculateShiftedPositions([0, 0, 0], 10)).toEqual([0, 10, 20]);
  });
});
