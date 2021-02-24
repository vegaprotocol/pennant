import scss from "rollup-plugin-scss";
import typescript from "@rollup/plugin-typescript";

const config = {
  input: "src/index.ts",
  output: {
    dir: "dist",
    format: "cjs",
  },
  plugins: [scss({ output: "dist/bundle.css" }), typescript()],
};

export default config;
