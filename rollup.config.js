import * as meta from "./package.json";

import { babel, getBabelOutputPlugin } from "@rollup/plugin-babel";

import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import scss from "rollup-plugin-scss";
import { terser } from "rollup-plugin-terser";

const extensions = [".js", ".jsx", ".ts", ".tsx"];

const globals = {
  react: "React",
};

const config = {
  input: "src/main.ts",
  output: [
    {
      file: meta.exports,
      format: "es",
      plugins: [
        getBabelOutputPlugin({
          presets: [
            [
              "@babel/preset-env",
              {
                targets: { esmodules: true },
                bugfixes: true,
                loose: true,
                debug: false,
              },
            ],
          ],
        }),
      ],
      globals,
    },
    {
      file: meta.module,
      format: "es",
      plugins: [
        getBabelOutputPlugin({
          presets: [
            [
              "@babel/preset-env",
              {
                targets: { esmodules: true },
                bugfixes: false,
                loose: true,
                debug: false,
              },
            ],
          ],
        }),
      ],
      globals,
    },
    {
      file: meta.main,
      format: "cjs",
      plugins: [getBabelOutputPlugin({ presets: ["@babel/preset-env"] })],
      globals,
    },
  ],
  plugins: [
    nodeResolve({ extensions }),
    commonjs(),
    scss({ output: "dist/style.css" }),
    babel({
      extensions,
      plugins: ["@babel/plugin-transform-runtime"],
      presets: [
        "@babel/preset-react",
        ["@babel/preset-typescript", { allExtensions: true, isTSX: true }],
      ],
      babelHelpers: "runtime",
    }),
    terser(),
  ],
  external: Object.keys(globals),
};

export default config;
