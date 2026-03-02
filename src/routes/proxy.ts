/**
 * Provider Proxy 路由
 *
 * 为每个已注册的 provider 动态生成 proxy 路由
 * 例如: /openai/v1/chat/completions -> 代理到 OpenAI
 */
import { defineRoute } from "vafast";
import { getAllProviders } from "../providers";
import { proxy } from "../requests/proxy";
import { Environments } from "../utils/environments";

const PROXY_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;

export function createProxyRoutes() {
  const allProviders = getAllProviders(Environments.all());

  return Object.keys(allProviders).flatMap((providerName) =>
    PROXY_METHODS.map((method) =>
      defineRoute({
        method,
        path: `/${providerName}/*proxyPath`,
        handler: async ({ req, body, params }) => {
          const targetPathname =
            "/" +
            ((params as Record<string, string>).proxyPath || "");
          return proxy(req, providerName, targetPathname, body);
        },
      }),
    ),
  );
}
