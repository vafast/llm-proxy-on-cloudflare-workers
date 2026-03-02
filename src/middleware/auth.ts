import type { Middleware } from "vafast";
import { authenticate } from "../utils/authorization";
import { Config } from "../utils/config";
import { UnauthorizedError } from "../utils/error";

/**
 * 全局鉴权中间件
 * DEV 模式或未配置 PROXY_API_KEY 时跳过鉴权
 */
export const authMiddleware: Middleware = async (req, next) => {
  if (!Config.isDevelopment() && authenticate(req) === false) {
    throw new UnauthorizedError();
  }
  return next();
};
