import type { Middleware } from "vafast";
import { CloudflareAIGateway } from "../ai_gateway";
import { Config } from "../utils/config";

/**
 * 路由级中间件：从 /g/:gatewayName 路径中提取 AI Gateway
 */
export const extractAiGateway: Middleware = async (req, next) => {
  const { accountId, token } = Config.aiGateway();
  const url = new URL(req.url);
  const match = url.pathname.match(/\/g\/([^/]+)/);

  if (match && accountId) {
    req.aiGateway = new CloudflareAIGateway(accountId, match[1], token);
  }

  return next();
};

/**
 * 全局中间件：如果配置了默认 AI Gateway，自动设置
 */
export const defaultAiGatewayMiddleware: Middleware = async (req, next) => {
  if (!req.aiGateway) {
    const { accountId, name, token } = Config.aiGateway();
    if (accountId && name) {
      req.aiGateway = new CloudflareAIGateway(accountId, name, token);
    }
  }
  return next();
};
