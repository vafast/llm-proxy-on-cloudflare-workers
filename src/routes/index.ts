/**
 * 路由聚合
 *
 * 所有业务路由在此组装，auth 和 aiGateway 作为路由组中间件（非全局）
 * /ping 作为公开根路由不在此处，定义在 src/index.ts
 */
import { defineRoute, defineRoutes } from "vafast";
import { healthRoutes } from "./health";
import { chatRoutes } from "./chat";
import { modelsRoutes } from "./models";
import { createProxyRoutes } from "./proxy";
import { gatewayRoutes } from "./gateway";
import { authMiddleware } from "../middleware/auth";
import { defaultAiGatewayMiddleware } from "../middleware/extractAiGateway";
import { extractAiGateway } from "../middleware/extractAiGateway";
import { extractApiKeyIndex } from "../middleware/extractApiKeyIndex";

export function createAllRoutes() {
  const proxyRoutes = createProxyRoutes();

  // 核心业务路由（在多个前缀下复用）
  const coreRoutes = [...chatRoutes, ...modelsRoutes, ...proxyRoutes];

  // 所有业务路由统一挂载 auth + aiGateway 中间件
  return defineRoutes([
    defineRoute({
      path: "",
      middleware: [authMiddleware, defaultAiGatewayMiddleware],
      children: [
        // 健康检查（/status）
        ...healthRoutes,

        // 直连
        ...coreRoutes,
        ...gatewayRoutes,

        // /key/:keySpec 前缀
        defineRoute({
          path: "/key/:keySpec",
          middleware: [extractApiKeyIndex],
          children: [
            ...coreRoutes,
            ...gatewayRoutes,
            defineRoute({
              path: "/g/:gatewayName",
              middleware: [extractAiGateway],
              children: [...coreRoutes, ...gatewayRoutes],
            }),
          ],
        }),

        // /g/:gatewayName 前缀
        defineRoute({
          path: "/g/:gatewayName",
          middleware: [extractAiGateway],
          children: [
            ...healthRoutes,
            ...coreRoutes,
            ...gatewayRoutes,
            defineRoute({
              path: "/key/:keySpec",
              middleware: [extractApiKeyIndex],
              children: [...coreRoutes, ...gatewayRoutes],
            }),
          ],
        }),
      ],
    }),
  ]);
}
