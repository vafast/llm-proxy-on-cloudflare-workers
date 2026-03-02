export {};

declare global {
  /**
   * 环境变量类型定义
   */
  interface Env {
    PROXY_API_KEY?: string;
    CLOUDFLARE_ACCOUNT_ID?: string;
    AI_GATEWAY_NAME?: string;
    CF_AIG_TOKEN?: string;
    OPENAI_API_KEY?: string;
    GEMINI_API_KEY?: string;
    ANTHROPIC_API_KEY?: string;
    CEREBRAS_API_KEY?: string;
    COHERE_API_KEY?: string;
    DEEPSEEK_API_KEY?: string;
    GROK_API_KEY?: string;
    GROQ_API_KEY?: string;
    MISTRAL_API_KEY?: string;
    OPENROUTER_API_KEY?: string;
    HUGGINGFACE_API_KEY?: string;
    PERPLEXITYAI_API_KEY?: string;
    REPLICATE_API_KEY?: string;
    CLOUDFLARE_API_KEY?: string;
    OLLAMA_API_KEY?: string;
    CUSTOM_OPENAI_ENDPOINTS?: string;
    DEV?: string;
    DEFAULT_MODEL?: string;
    ENABLE_GLOBAL_ROUND_ROBIN?: string;
  }

  /**
   * Request 扩展属性，用于中间件之间传递业务状态
   */
  interface Request {
    pathname?: string;
    aiGateway?: import("./ai_gateway").CloudflareAIGateway;
    apiKeyIndex?: number | { start?: number; end?: number };
  }
}
