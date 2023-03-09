import { INVALID_COLOR, string2hex } from "./hex";

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

  test("Valid rgb strings", () => {
    expect(string2hex("rgb(30,40,60)")).toEqual(0x001e283c);
  });

  test("Valid css color name strings", () => {
    expect(string2hex("lightgoldenrodyellow")).toEqual(0x00fafad2);
  });

  test("Invalid string", () => {
    expect(string2hex("invalid")).toEqual(INVALID_COLOR);
  });
});
