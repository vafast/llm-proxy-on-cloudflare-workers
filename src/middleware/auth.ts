import type { Middleware } from "vafast";
import { err } from "vafast";
import { authenticate } from "../utils/authorization";

/**
 * 全局鉴权中间件
 * 统一要求 PROXY_API_KEY 鉴权（DEV 与非 DEV 行为一致）
 */
export const authMiddleware: Middleware = async (req, next) => {
  if ((await authenticate(req)) === false) {
    throw err.unauthorized("Unauthorized");
  }
  return next();
};
