import { endsWith, string2num } from "./string";

describe("endsWith", () => {
  test("simple cases", () => {
    expect(endsWith("Two words", "ords")).toBeTruthy();
    expect(endsWith("Two words", "Two")).toBeFalsy();
  });
});

describe("string2num", () => {
  test("simple cases", () => {
    expect(string2num(" 44px")).toEqual(44);
    expect(string2num("44 ")).toEqual(44);
  });
});
