/**
 * 透传 Key 支持（BYOK）
 *
 * 当用户通过 X-*-Key 传入自己的厂商 key 时，
 * 代理使用该 key 调上游，而非 env 中的厂商 key。
 */

/** 透传头名 → 上游 header 的映射 */
export const PASSTHROUGH_HEADERS: Record<
  string,
  { incoming: string; upstream: string }
> = {
  openai: { incoming: "X-OpenAI-Key", upstream: "Authorization" },
  anthropic: { incoming: "X-Anthropic-Key", upstream: "x-api-key" },
  "google-ai-studio": { incoming: "X-Google-Key", upstream: "x-goog-api-key" },
  cerebras: { incoming: "X-Cerebras-Key", upstream: "Authorization" },
  cohere: { incoming: "X-Cohere-Key", upstream: "Authorization" },
  deepseek: { incoming: "X-DeepSeek-Key", upstream: "Authorization" },
  grok: { incoming: "X-Grok-Key", upstream: "Authorization" },
  groq: { incoming: "X-Groq-Key", upstream: "Authorization" },
  mistral: { incoming: "X-Mistral-Key", upstream: "Authorization" },
  openrouter: { incoming: "X-OpenRouter-Key", upstream: "Authorization" },
  "perplexity-ai": { incoming: "X-Perplexity-Key", upstream: "Authorization" },
  replicate: { incoming: "X-Replicate-Key", upstream: "Authorization" },
  huggingface: { incoming: "X-HuggingFace-Key", upstream: "Authorization" },
  ollama: { incoming: "X-Ollama-Key", upstream: "Authorization" },
};

/**
 * 从 HeadersInit 中读取指定 header 的值（大小写不敏感）
 *
 * 内部统一转为 Headers 对象，避免调用方处理多种类型。
 */
export function getHeaderFromInit(
  headers: HeadersInit | undefined,
  name: string,
): string | null {
  if (!headers) return null;
  const h = headers instanceof Headers ? headers : new Headers(headers);
  return h.get(name)?.trim() || null;
}

/**
 * 构建转发给 provider 的 headers：去除 proxy 鉴权头 + 透传头，保留透传转换后的上游头
 */
export function buildForwardHeaders(
  request: Request,
  providerName: string,
): Headers {
  const headers = new Headers(request.headers);

  // 去除不应转发给上游的头
  headers.delete("Authorization");
  headers.delete("x-api-key");
  headers.delete("host");
  headers.delete("content-length");

  const mapping = PASSTHROUGH_HEADERS[providerName];
  if (mapping) {
    const value = headers.get(mapping.incoming)?.trim() || null;
    if (value) {
      if (mapping.upstream === "Authorization") {
        headers.set("Authorization", `Bearer ${value}`);
      } else {
        headers.set(mapping.upstream, value);
      }
      headers.delete(mapping.incoming);
    }
  }

  return headers;
}
