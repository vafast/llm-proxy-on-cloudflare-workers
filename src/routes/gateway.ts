/**
 * Cloudflare AI Gateway 特有路由
 *
 * - /compat/* — 兼容代理
 * - / POST — Universal Endpoint
 * 仅在 aiGateway 可用时工作
 */
import { defineRoute } from "vafast";
import { compat } from "../requests/compat";
import { universalEndpoint } from "../requests/universal_endpoint";

const COMPAT_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;

export const gatewayRoutes = [
  ...COMPAT_METHODS.map((method) =>
    defineRoute({
      method,
      path: "/compat/*compatPath",
      handler: async ({ req, body, params }) => {
        const aiGateway = req.aiGateway;
        if (!aiGateway) {
          return { data: { error: "AI Gateway not configured" }, status: 400 };
        }
        const pathname =
          "/compat/" +
          ((params as Record<string, string>).compatPath || "");
        return compat(req, pathname, aiGateway, body);
      },
    }),
  ),

  defineRoute({
    method: "POST",
    path: "/",
    handler: async ({ req, body }) => {
      const aiGateway = req.aiGateway;
      if (!aiGateway) {
        return { data: { error: "AI Gateway not configured" }, status: 400 };
      }
      return universalEndpoint(req, aiGateway, body);
    },
  }),
];
