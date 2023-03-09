import { identity, indicatorAbsoluteChange } from "./technical-indicators";

const input = [1, 2, 1, 4];

describe("identity", () => {
  it("Should match expected output", () => {
    const output = identity(input);
    const expected = input;

    for (let index = 0; index < output.length; index++) {
      expect(output[index]).toBeCloseTo(expected[index]);
    }
  });
});

describe("indicatorAbsoluteChange", () => {
  it("Should match expected output", () => {
    const output = indicatorAbsoluteChange()(input);
    const expected = [NaN, 1, -1, 3];

    for (let index = 0; index < output.length; index++) {
      if (typeof expected === "number") {
        expect(output[index]).toBeCloseTo(expected[index]);
      } else {
        expect(output[index]).toEqual(expected[index]);
      }
    }
  });
});
