import { string2hex } from "./hex";

describe("string2hex", () => {
  test("Valid six character strings", () => {
    expect(string2hex("#ffffff")).toEqual(0xffffff);
    expect(string2hex("#000000")).toEqual(0x000000);
    expect(string2hex("#00ff00")).toEqual(0x00ff00);
  });

  test("Valid three character strings", () => {
    expect(string2hex("#fff")).toEqual(0xffffff);
    expect(string2hex("#000")).toEqual(0x000000);
    expect(string2hex("#0f0")).toEqual(0x00ff00);
  });
});
