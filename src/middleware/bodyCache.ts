import { defineMiddleware } from "vafast";

/**
 * 预解析 body，通过 next({ body }) 注入 context
 *
 * 必须用 defineMiddleware 创建，否则 next({ body }) 的参数会被忽略。
 */
export const bodyCacheMiddleware = defineMiddleware(async (req, next) => {
  const method = req.method?.toUpperCase();
  if (method === "GET" || method === "HEAD") {
    return next();
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let body: unknown;
    if (contentType.includes("application/json")) {
      body = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      body = Object.fromEntries(new URLSearchParams(text));
    } else {
      body = await req.text();
    }
    return next({ body });
  } catch {
    return next();
  }
});
