import { getStudyInfoFieldValue } from "./helpers-study-info";

describe("getStudyInfoFieldValue", () => {
  test("returns NaN for empty data array", () => {
    expect(getStudyInfoFieldValue([], null, "open")).toBe(NaN);
  });

  test("returns latest value for index out of bounds", () => {
    expect(getStudyInfoFieldValue([{ open: 1 }, { open: 2 }], 2, "open")).toBe(
      2,
    );

    expect(getStudyInfoFieldValue([{ open: 1 }, { open: 2 }], -1, "open")).toBe(
      2,
    );
  });

  test("returns latest value for index equal to null", () => {
    expect(
      getStudyInfoFieldValue([{ open: 1 }, { open: 2 }], null, "open"),
    ).toBe(2);
  });
});
