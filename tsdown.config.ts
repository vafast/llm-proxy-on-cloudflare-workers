import { defineConfig } from "tsdown/config";

export default defineConfig({
  clean: true,
  entry: ["src/index.ts"],
  sourcemap: true,
  minify: true,
  format: ["esm"],
  outDir: "dist",
  dts: true,
});
