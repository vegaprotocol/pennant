import { indetity } from "./helpers-technical-indicators";

const input = [1, 2];
const expected = [1, 2];

describe("indetity", () => {
  it("Should match expected output", () => {
    const output = indetity(input);

    for (let index = 0; index < output.length; index++) {
      expect(output[index]).toBeCloseTo(expected[index]);
    }
  });
});
