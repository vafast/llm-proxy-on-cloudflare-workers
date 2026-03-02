import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "node",
    alias: {
      "~/src": resolve(__dirname, "./src"),
      "~/*": resolve(__dirname, "./src/*"),
    },
  },
  resolve: {
    alias: {
      "~/src": resolve(__dirname, "./src"),
      "~/*": resolve(__dirname, "./src/*"),
    },
  },
});
