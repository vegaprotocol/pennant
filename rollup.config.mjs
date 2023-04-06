import { babel, getBabelOutputPlugin } from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import { readFileSync } from "fs";
import path from "path";
import postcss from "rollup-plugin-postcss";
import tsConfigPaths from "rollup-plugin-tsconfig-paths";

const meta = JSON.parse(readFileSync("./package.json"));

const extensions = [".js", ".jsx", ".ts", ".tsx"];

const globals = {
  react: "React",
  "react-dom": "ReactDOM",
};

const config = {
  input: "src/index.ts",
  external: [/@babel\/runtime/, ...Object.keys(globals)],
  output: [
    {
      file: meta.main,
      format: "cjs",
      globals,
      plugins: [
        getBabelOutputPlugin({
          presets: ["@babel/preset-env"],
        }),
      ],
    },
  ],
  plugins: [
    tsConfigPaths(),
    nodeResolve({ extensions }),
    commonjs(),
    postcss({
      autoModules: true,
      extract: path.resolve("dist/style.css"),
    }),
    babel({
      extensions,
      plugins: ["@babel/plugin-transform-runtime"],
      presets: [
        [
          "@babel/preset-react",
          {
            runtime: "automatic",
          },
        ],
        ["@babel/preset-typescript", { allExtensions: true, isTSX: true }],
      ],
      babelHelpers: "runtime",
    }),
    terser({ mangle: false }),
  ],
};

export default config;
