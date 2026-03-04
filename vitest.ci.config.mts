/**
 * CI 部署门禁：单元测试 + 集成测试
 * 不排除 integration，作为部署前必跑
 */
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    testTimeout: 30_000,
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});
