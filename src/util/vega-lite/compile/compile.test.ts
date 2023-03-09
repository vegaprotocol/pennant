import { compile } from "./compile";

describe("compile", () => {
  test("produces a model", () => {
    const model = compile({
      data: { values: [{ open: 100, close: 100 }] },
      name: "spec",
    });

    expect(model.component).toEqual({
      data: {
        outputNodes: {
          data: {
            _children: [],
            _data: { values: [{ close: 100, open: 100 }] },
            _parent: null,
          },
        },
      },
    });
  });
});
