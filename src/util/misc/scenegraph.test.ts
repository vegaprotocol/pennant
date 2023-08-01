import { getConditionalColor } from "./scenegraph";

const RED = "#f00";
const GREEN = "#0f0";

describe("getConditionalColor", () => {
  test("Conditional less than constant", () => {
    expect(
      getConditionalColor({
        condition: { test: { field: "close", lt: 200 }, value: RED },
        value: GREEN,
      })({
        close: 100,
      }),
    ).toEqual(RED);

    expect(
      getConditionalColor({
        condition: { test: { field: "close", lt: 200 }, value: RED },
        value: GREEN,
      })({
        close: 300,
      }),
    ).toEqual(GREEN);

    expect(
      getConditionalColor({
        condition: { test: { field: "close", lt: 200 }, value: RED },
        value: GREEN,
      })({
        close: 200,
      }),
    ).toEqual(GREEN);
  });

  test("Conditional less than another field", () => {
    expect(
      getConditionalColor({
        condition: { test: { field: "close", lt: "open" }, value: RED },
        value: GREEN,
      })({
        close: 100,
        open: 200,
      }),
    ).toEqual(RED);

    expect(
      getConditionalColor({
        condition: { test: { field: "close", lt: "open" }, value: RED },
        value: GREEN,
      })({
        close: 300,
        open: 200,
      }),
    ).toEqual(GREEN);

    expect(
      getConditionalColor({
        condition: { test: { field: "close", lt: "open" }, value: RED },
        value: GREEN,
      })({
        close: 200,
        open: 200,
      }),
    ).toEqual(GREEN);
  });

  test("Conditional greater than constant", () => {
    expect(
      getConditionalColor({
        condition: { test: { field: "close", gt: 200 }, value: RED },
        value: GREEN,
      })({
        close: 100,
      }),
    ).toEqual(GREEN);

    expect(
      getConditionalColor({
        condition: { test: { field: "close", gt: 200 }, value: RED },
        value: GREEN,
      })({
        close: 300,
      }),
    ).toEqual(RED);

    expect(
      getConditionalColor({
        condition: { test: { field: "close", gt: 200 }, value: RED },
        value: RED,
      })({
        close: 200,
      }),
    ).toEqual(RED);
  });

  test("Conditional greater than another field", () => {
    expect(
      getConditionalColor({
        condition: { test: { field: "close", gt: "open" }, value: RED },
        value: GREEN,
      })({
        close: 100,
        open: 200,
      }),
    ).toEqual(GREEN);

    expect(
      getConditionalColor({
        condition: { test: { field: "close", gt: "open" }, value: RED },
        value: GREEN,
      })({
        close: 300,
        open: 200,
      }),
    ).toEqual(RED);

    expect(
      getConditionalColor({
        condition: { test: { field: "close", gt: "open" }, value: RED },
        value: GREEN,
      })({
        close: 200,
        open: 200,
      }),
    ).toEqual(GREEN);
  });

  test("Simple value", () => {
    expect(
      getConditionalColor({
        value: GREEN,
      })({}),
    ).toEqual(GREEN);
  });

  test("Missing color definition", () => {
    expect(getConditionalColor(undefined)({})).toEqual(null);
  });

  test("Missing value in color definition", () => {
    expect(getConditionalColor({})({})).toEqual(null);
  });
});
