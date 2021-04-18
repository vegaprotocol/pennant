import { compile } from "./compile";

/* export interface BaseSpec {
  data?: Data | null;
  encoding?: Encoding<any>;
  mark?: Mark | MarkDef;
  name?: string;
  layer?: BaseSpec[];
  transform?: Transform[];
} */

describe("compile", () => {
  test("", () => {
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
