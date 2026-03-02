/**
 * 健康检查路由
 */
import { defineRoute } from "vafast";
import { status } from "../requests/status";

export const healthRoutes = [
  defineRoute({
    method: "GET",
    path: "/ping",
    handler: () => "Pong",
  }),
  defineRoute({
    method: "GET",
    path: "/status",
    handler: async ({ req }) => status(req.aiGateway),
  }),
];
