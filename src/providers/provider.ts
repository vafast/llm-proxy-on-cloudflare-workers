import { fetch2 } from "../utils/helpers";
import { getHeaderFromInit } from "../utils/passthrough";
import { Secrets } from "../utils/secrets";
import {
  OpenAIChatCompletionsRequestBody,
  OpenAIModelsListResponseBody,
} from "./openai/types";

/** 将多组 headers 按顺序合并，后者覆盖前者（大小写不敏感） */
function mergeHeaders(...sources: (HeadersInit | undefined)[]): Headers {
  const merged = new Headers();
  for (const src of sources) {
    if (!src) continue;
    const h = src instanceof Headers ? src : new Headers(src);
    h.forEach((v, k) => merged.set(k, v));
  }
  return merged;
}

export class ProviderBase {
  // --- 配置属性 ---
  readonly apiKeyName: keyof Env | undefined = undefined;
  readonly baseUrlProp: string = "https://example.com";
  readonly pathnamePrefixProp: string = "";
  get chatCompletionPath(): string {
    return "/chat/completions";
  }
  get modelsPath(): string {
    return "/models";
  }

  // --- Core Methods ---
  available(): boolean {
    return this.getApiKeys().length > 0;
  }

  getApiKeys(): string[] {
    if (this.apiKeyName) {
      return Secrets.getAll(this.apiKeyName);
    }
    return [];
  }

  async getNextApiKeyIndex(): Promise<number> {
    const keys = this.getApiKeys();
    if (keys.length <= 1) {
      return 0;
    }

    if (this.apiKeyName) {
      return await Secrets.getNext(this.apiKeyName);
    }

    return 0;
  }

  async fetch(
    pathname: string,
    init?: RequestInit,
    apiKeyIndex?: number,
  ): Promise<Response> {
    return fetch2(...(await this.buildRequest(pathname, init, apiKeyIndex)));
  }

  // --- URL 与 Header 构建 ---
  baseUrl(): string {
    return this.baseUrlProp;
  }

  pathnamePrefix(): string {
    return this.pathnamePrefixProp;
  }

  async headers(
    _apiKeyIndex?: number,
    _init?: RequestInit,
  ): Promise<Headers> {
    return new Headers();
  }

  async buildRequest(
    pathname: string,
    init?: RequestInit,
    apiKeyIndex?: number,
  ): Promise<[string, RequestInit]> {
    return [
      this.baseUrl() + this.pathnamePrefix() + pathname,
      await this.requestData(init, apiKeyIndex),
    ];
  }

  async requestData(
    init?: RequestInit,
    apiKeyIndex?: number,
  ): Promise<RequestInit> {
    return {
      ...init,
      headers: mergeHeaders(init?.headers, await this.headers(apiKeyIndex, init)),
    };
  }

  // --- OpenAI 兼容 API 方法 ---
  // 以下方法只构建 [pathname, partialInit]，headers 由 fetch → requestData 统一 merge
  async buildChatCompletionsRequest({
    body,
    headers,
  }: {
    body: string;
    headers: Headers;
  }): Promise<[string, RequestInit]> {
    const data = JSON.parse(body) as OpenAIChatCompletionsRequestBody;
    const trimmedData = Object.fromEntries(
      (Object.keys(data) as (keyof OpenAIChatCompletionsRequestBody)[])
        .map((key) =>
          this.CHAT_COMPLETIONS_SUPPORTED_PARAMETERS.includes(key)
            ? [key, data[key]]
            : null,
        )
        .filter((x) => x !== null),
    );

    return [
      this.chatCompletionPath,
      {
        method: "POST",
        body: JSON.stringify(trimmedData),
        headers,
      },
    ];
  }

  async buildModelsRequest(): Promise<[string, RequestInit]> {
    return [
      this.modelsPath,
      { method: "GET" },
    ];
  }

  modelsToOpenAIFormat(data: any): OpenAIModelsListResponseBody {
    return data as OpenAIModelsListResponseBody;
  }

  staticModels(): OpenAIModelsListResponseBody | undefined {
    return undefined;
  }

  // --- 常量与元数据 ---
  readonly CHAT_COMPLETIONS_SUPPORTED_PARAMETERS: (keyof OpenAIChatCompletionsRequestBody)[] =
    [
      "messages",
      "model",
      "store",
      "metadata",
      "frequency_penalty",
      "logit_bias",
      "logprobs",
      "max_tokens",
      "max_completion_tokens",
      "n",
      "modalities",
      "prediction",
      "audio",
      "presence_penalty",
      "response_format",
      "seed",
      "service_tier",
      "stop",
      "stream",
      "stream_options",
      "suffix",
      "temperature",
      "top_p",
      "tools",
      "tool_choice",
      "parallel_tool_calls",
      "user",
      "function_call",
      "functions",
    ];
}

export class OpenAICompatibleProvider extends ProviderBase {
  async headers(
    apiKeyIndex?: number,
    init?: RequestInit,
  ): Promise<Headers> {
    if (getHeaderFromInit(init?.headers, "Authorization")) {
      return new Headers({ "Content-Type": "application/json" });
    }
    const keys = this.getApiKeys();
    if (keys.length === 0) return new Headers();

    const index = apiKeyIndex !== undefined ? apiKeyIndex % keys.length : 0;
    const apiKey = keys[index];

    return new Headers({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    });
  }
}

export class ProviderNotSupportedError extends Error {}
