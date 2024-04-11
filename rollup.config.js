import cjs from "@rollup/plugin-commonjs";
import cleaner from "rollup-plugin-cleaner";
import { babel } from "@rollup/plugin-babel";
import { nodeResolve } from "@rollup/plugin-node-resolve";

const extensions = [".js", ".ts", ".tsx", ".jsx"];

const external = [
  "@babel/core",
  "@babel/preset-typescript",
  "@babel/parser",
  "@babel/traverse",
  "@babel/types",
  "vite",
  "postcss",
  "@csstools/postcss-sass",
  "postcss-less",
  "postcss-scss",
  "postcss-modules",
  "lightningcss",
  "magic-string",
  "@nodelib/fs.scandir",
  "micromatch",
];

/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
  input: "src/index.ts",
  output: [
    {
      format: "esm",
      file: "dist/esm/index.mjs",
      sourcemap: true,
    },
    {
      format: "cjs",
      file: "dist/cjs/index.cjs",
      sourcemap: true,
      exports: "default",
    },
  ],
  external,
  plugins: [
    cleaner({ targets: ["./dist/"] }),
    babel({
      extensions,
      babelHelpers: "bundled",
      presets: [
        ["@babel/preset-env", { targets: { node: "current" } }],
        "@babel/preset-typescript",
      ],
    }),
    nodeResolve({ extensions, preferBuiltins: true, browser: false }),
    cjs({ extensions }),
  ],
};

export default config;
