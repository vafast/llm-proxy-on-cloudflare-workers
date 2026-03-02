/**
 * Chat Completions 路由
 */
import { defineRoute, err, Type } from "vafast";
import { getProvider } from "../providers";
import { Config } from "../utils/config";
import { Environments } from "../utils/environments";
import { Secrets } from "../utils/secrets";
import { buildForwardHeaders } from "../utils/passthrough";

const chatBodySchema = {
  body: Type.Any(),
};

/** 供单元测试使用 */
export async function chatCompletions(request: Request, body: unknown) {
  const contextApiKeyIndex = request.apiKeyIndex;

  if (!body || typeof body !== "object") {
    throw err.badRequest("Invalid request.");
  }

  const data = body as Record<string, unknown>;

  const modelStr =
    data["model"] === "default"
      ? Config.defaultModel() || ""
      : String(data["model"] || "");
  const [providerName, ...modelParts] = modelStr.split("/") as [
    string,
    string,
  ];
  const model = modelParts.join("/");

  const provider = getProvider(providerName, Environments.all());
  if (!provider) {
    throw err.badRequest("Invalid provider.");
  }

  const headers = buildForwardHeaders(request, providerName);

  const apiKeyIndex =
    contextApiKeyIndex !== undefined
      ? Secrets.resolveApiKeyIndex(
          contextApiKeyIndex,
          provider.getApiKeys().length,
        )
      : await provider.getNextApiKeyIndex();

  const [pathname, requestInit] =
    await provider.buildChatCompletionsRequest({
      body: JSON.stringify({ ...data, model }),
      headers,
    });

  return provider.fetch(pathname, requestInit, apiKeyIndex);
}

export const chatRoutes = [
  defineRoute({
    method: "POST",
    path: "/chat/completions",
    schema: chatBodySchema,
    handler: async ({ req, body }) => chatCompletions(req, body),
  }),
  defineRoute({
    method: "POST",
    path: "/v1/chat/completions",
    schema: chatBodySchema,
    handler: async ({ req, body }) => chatCompletions(req, body),
  }),
];
