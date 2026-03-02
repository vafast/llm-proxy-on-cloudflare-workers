import { CloudflareAIGateway } from "../ai_gateway";
import { getProvider } from "../providers";
import { Config } from "../utils/config";
import { Environments } from "../utils/environments";
import { fetch2 } from "../utils/helpers";
import { Secrets } from "../utils/secrets";

/**
 * @param request - 原始请求（用于读取 headers 和扩展属性）
 * @param body - Vafast 预解析的 body
 */
export async function chatCompletions(request: Request, body: unknown) {
  const aiGateway = request.aiGateway;
  const contextApiKeyIndex = request.apiKeyIndex;

  const headers = new Headers(request.headers);
  headers.delete("Authorization");

  if (!body || typeof body !== "object") {
    return { data: { error: "Invalid request." }, status: 400 };
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
    return { data: { error: "Invalid provider." }, status: 400 };
  }

  const apiKeyIndex =
    contextApiKeyIndex !== undefined
      ? Secrets.resolveApiKeyIndex(
        contextApiKeyIndex,
        provider.getApiKeys().length,
      )
      : await provider.getNextApiKeyIndex();

  const [requestInfo, requestInit] =
    await provider.buildChatCompletionsRequest({
      body: JSON.stringify({
        ...data,
        model,
      }),
      headers,
      apiKeyIndex,
    });

  if (
    aiGateway &&
    CloudflareAIGateway.isSupportedProvider(providerName, true)
  ) {
    return fetch2(
      ...(await aiGateway.buildChatCompletionsRequest({
        provider: providerName,
        body: requestInit.body as string,
        headers: {
          ...requestInit.headers,
        },
        apiKeyName: provider.apiKeyName as keyof Env,
      })),
    );
  }

  return provider.fetch(requestInfo, requestInit);
}
