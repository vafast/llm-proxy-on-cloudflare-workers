/**
 * 路由聚合
 *
 * 所有路由在此组装，包括前缀变体（/key/:keySpec、/g/:gatewayName）
 */
import { defineRoute, defineRoutes } from "vafast";
import { healthRoutes } from "./health";
import { chatRoutes } from "./chat";
import { modelsRoutes } from "./models";
import { createProxyRoutes } from "./proxy";
import { gatewayRoutes } from "./gateway";
import { extractAiGateway } from "../middleware/extractAiGateway";
import { extractApiKeyIndex } from "../middleware/extractApiKeyIndex";

export function createAllRoutes() {
  const proxyRoutes = createProxyRoutes();

  // 核心业务路由（在多个前缀下复用）
  const coreRoutes = [...chatRoutes, ...modelsRoutes, ...proxyRoutes];

  return defineRoutes([
    // 健康检查
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
        ...healthRoutes.filter((r) => "path" in r && r.path !== "/ping"),
        ...coreRoutes,
        ...gatewayRoutes,
        defineRoute({
          path: "/key/:keySpec",
          middleware: [extractApiKeyIndex],
          children: [...coreRoutes, ...gatewayRoutes],
        }),
      ],
    }),
  ]);
}
