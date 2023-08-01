import { calculatePreferredSize } from "./calculate-preferred-size";

describe("calculatePreferredSize", () => {
  test("percentage units", () => {
    expect(
      Number((calculatePreferredSize("100%", 2, true) as string).slice(0, -1)),
    ).toBeCloseTo(50);
    expect(
      Number((calculatePreferredSize("100%", 2, false) as string).slice(0, -1)),
    ).toBeCloseTo(50);

    expect(
      Number((calculatePreferredSize("100%", 3, true) as string).slice(0, -1)),
    ).toBeCloseTo(33.3333);
    expect(
      Number((calculatePreferredSize("100%", 3, false) as string).slice(0, -1)),
    ).toBeCloseTo(33.3333);

    expect(
      Number((calculatePreferredSize("100%", 4, true) as string).slice(0, -1)),
    ).toBeCloseTo(25);
    expect(
      Number((calculatePreferredSize("100%", 4, false) as string).slice(0, -1)),
    ).toBeCloseTo(25);

    expect(
      Number((calculatePreferredSize("50%", 2, true) as string).slice(0, -1)),
    ).toBeCloseTo(66.6666);
    expect(
      Number((calculatePreferredSize("50%", 2, false) as string).slice(0, -1)),
    ).toBeCloseTo(33.3333);

    expect(
      Number((calculatePreferredSize("50%", 3, true) as string).slice(0, -1)),
    ).toBeCloseTo(50);
    expect(
      Number((calculatePreferredSize("50%", 3, false) as string).slice(0, -1)),
    ).toBeCloseTo(25);

    expect(
      Number((calculatePreferredSize("50%", 4, true) as string).slice(0, -1)),
    ).toBeCloseTo(40);
    expect(
      Number((calculatePreferredSize("50%", 4, false) as string).slice(0, -1)),
    ).toBeCloseTo(20);
  });

  test("pixel units", () => {
    expect(calculatePreferredSize("100px", 2, true)).toBeUndefined();
    expect(calculatePreferredSize("100px", 2, false)).toEqual(100);
  });

  test("number", () => {
    expect(calculatePreferredSize(120, 2, true)).toBeUndefined();
    expect(calculatePreferredSize(120, 2, false)).toEqual(120);
  });
});
