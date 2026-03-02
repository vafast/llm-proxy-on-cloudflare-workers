import { CloudflareAIGateway } from "../ai_gateway";
import {
  CloudflareAIGatewayUniversalEndpointData,
  CloudflareAIGatewayUniversalEndpointStep,
} from "../ai_gateway/const";
import { isCloudflareAIGatewayProvider } from "../ai_gateway/utils";
import { Providers } from "../providers";
import { fetch2 } from "../utils/helpers";
import { Secrets } from "../utils/secrets";

type UniversalEndpointRequest = {
  provider?: string;
  endpoint?: string;
  headers?: { [key: string]: string };
  query: {
    model?: string;
    [key: string]: any;
  };
};

/**
 * @param body - Vafast 预解析的 body（避免重复消耗 ReadableStream）
 */
export async function universalEndpoint(
  request: Request,
  aiGateway: CloudflareAIGateway,
  body: unknown,
) {
  const items = body as UniversalEndpointRequest[];

  const mappedItems: CloudflareAIGatewayUniversalEndpointData =
    await Promise.all(
      items.map(
        async (item): Promise<CloudflareAIGatewayUniversalEndpointStep> => {
          const providerName = item.provider;
          if (!providerName) {
            throw new Error(`Provider not specified.`);
          }
          if (isCloudflareAIGatewayProvider(providerName) === false) {
            throw new Error(`Provider ${providerName} is not supported.`);
          }
          const provider = Providers[providerName];
          const providerClass = new provider();
          const endpoint =
            item.endpoint || providerClass.chatCompletionPath.replace("/", "");
          const apiKeyName = providerClass.apiKeyName as keyof Env;
          const apiKeyIndex = await Secrets.getNext(apiKeyName);
          const providerHeaders = await providerClass.headers(apiKeyIndex);
          const headers: Record<string, string> = {
            ...(providerHeaders instanceof Headers
              ? Object.fromEntries(providerHeaders.entries())
              : (providerHeaders as Record<string, string>)),
            ...item.headers,
          };
          const query = item.query;

          return {
            provider: providerName,
            endpoint,
            headers,
            query,
          };
        },
      ),
    );

  return await fetch2(
    ...aiGateway.buildUniversalEndpointRequest({
      data: mappedItems,
    }),
  );
}
