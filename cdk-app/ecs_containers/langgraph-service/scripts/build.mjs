import { build } from "esbuild";

await build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.js",
  bundle: true,
  minify: true,
  sourcemap: true,
  platform: "node",
  target: "node20",
  format: "esm",
  treeShaking: true,
  legalComments: "none",
  tsconfig: "./tsconfig.json",
});
