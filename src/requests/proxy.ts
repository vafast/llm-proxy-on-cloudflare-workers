import { CloudflareAIGateway } from "../ai_gateway";
import { getProvider } from "../providers";
import { Environments } from "../utils/environments";
import { NotFoundError } from "../utils/error";
import { fetch2 } from "../utils/helpers";
import { Secrets } from "../utils/secrets";

/**
 * @param request - 原始请求
 * @param providerName - provider 名称
 * @param pathname - 目标路径
 * @param body - Vafast 预解析的 body（避免重复消耗 ReadableStream）
 */
export async function proxy(
  request: Request,
  providerName: string,
  pathname: string,
  body?: unknown,
) {
  const aiGateway = request.aiGateway;
  const contextApiKeyIndex = request.apiKeyIndex;

  const env = Environments.all();
  const providerInstance = getProvider(providerName, env);

  if (!providerInstance) {
    throw new NotFoundError();
  }

  const apiKeyIndex =
    contextApiKeyIndex !== undefined
      ? Secrets.resolveApiKeyIndex(
          contextApiKeyIndex,
          providerInstance.getApiKeys().length,
        )
      : await providerInstance.getNextApiKeyIndex();

  const forwardBody =
    body != null
      ? typeof body === "string"
        ? body
        : JSON.stringify(body)
      : null;

  if (aiGateway && CloudflareAIGateway.isSupportedProvider(providerName)) {
    return fetch2(
      ...aiGateway.buildProviderEndpointRequest({
        provider: providerName,
        method: request.method,
        path: pathname,
        body: forwardBody,
        headers: {
          ...(await providerInstance.headers(apiKeyIndex)),
          ...Object.fromEntries(request.headers.entries()),
        },
      }),
    );
  }

  return providerInstance.fetch(
    pathname,
    {
      method: request.method,
      body: forwardBody,
      headers: request.headers,
    },
    apiKeyIndex,
  );
}
