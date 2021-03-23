import { macd } from "./helpers-technical-indicators";

const input = [1, 2];
const expected = [1, 2];

describe("macd", () => {
  it("Should match expected output", () => {
    const output = macd(input);

    for (let index = 0; index < output.length; index++) {
      expect(output[index]).toBeCloseTo(expected[index]);
    }
  });
});
