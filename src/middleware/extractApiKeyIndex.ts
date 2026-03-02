import type { Middleware } from "vafast";

/**
 * 路由级中间件：从 /key/:keySpec 路径中提取 API Key Index
 *
 * 支持格式:
 * - /key/0 — 指定单个 key（index=0）
 * - /key/0-3 — 指定范围 [0, 3]
 * - /key/-3 — 指定范围 [undefined, 3]
 * - /key/0- — 指定范围 [0, undefined]
 */
export const extractApiKeyIndex: Middleware = async (req, next) => {
  const url = new URL(req.url);
  const match = url.pathname.match(/\/key\/(?:(\d+)?-(\d+)?|(\d+))/);

  if (match) {
    if (match[3] !== undefined) {
      req.apiKeyIndex = parseInt(match[3], 10);
    } else {
      const startStr = match[1];
      const endStr = match[2];

      if (startStr !== undefined || endStr !== undefined) {
        req.apiKeyIndex = {
          start: startStr !== undefined ? parseInt(startStr, 10) : undefined,
          end:
            endStr === "" || endStr === undefined
              ? undefined
              : parseInt(endStr, 10),
        };
      }
    }
  }

  return next();
};
