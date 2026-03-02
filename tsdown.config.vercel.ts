import { defineConfig } from "tsdown/config";

export default defineConfig({
  entry: { index: "api/index.ts" },
  format: ["esm"],
  outDir: "api",
  clean: false,
  minify: true,
  dts: false,
  outputOptions: { codeSplitting: false },
  outExtensions: () => ({ js: ".js" }),
});
