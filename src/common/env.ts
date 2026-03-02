/**
 * 环境变量配置
 *
 * 使用 zod 进行类型安全校验，启动时立即验证
 */
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "staging", "test"])
    .default("development"),
  PORT: z.coerce.number().default(8787),

  // 代理鉴权
  PROXY_API_KEY: z.string().default(""),

  // AI Gateway（Cloudflare，可选）
  CLOUDFLARE_ACCOUNT_ID: z.string().default(""),
  AI_GATEWAY_NAME: z.string().default(""),
  CF_AIG_TOKEN: z.string().default(""),

  // Upstash Redis（Key 轮询，可选）
  KV_REST_API_URL: z.string().default(""),
  KV_REST_API_TOKEN: z.string().default(""),

  // Provider API Keys
  OPENAI_API_KEY: z.string().default(""),
  GEMINI_API_KEY: z.string().default(""),
  ANTHROPIC_API_KEY: z.string().default(""),
  CEREBRAS_API_KEY: z.string().default(""),
  COHERE_API_KEY: z.string().default(""),
  DEEPSEEK_API_KEY: z.string().default(""),
  GROK_API_KEY: z.string().default(""),
  GROQ_API_KEY: z.string().default(""),
  MISTRAL_API_KEY: z.string().default(""),
  OPENROUTER_API_KEY: z.string().default(""),
  HUGGINGFACE_API_KEY: z.string().default(""),
  PERPLEXITYAI_API_KEY: z.string().default(""),
  REPLICATE_API_KEY: z.string().default(""),
  CLOUDFLARE_API_KEY: z.string().default(""),
  OLLAMA_API_KEY: z.string().default(""),

  // 自定义 OpenAI 兼容端点（JSON 字符串）
  CUSTOM_OPENAI_ENDPOINTS: z.string().default(""),

  // 配置
  DEV: z
    .string()
    .default("false")
    .transform((v) => v === "true" || v === "1"),
  DEFAULT_MODEL: z.string().default(""),
  ENABLE_GLOBAL_ROUND_ROBIN: z
    .string()
    .default("false")
    .transform((v) => v === "true" || v === "1"),
});

function parseEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("\n❌ 环境变量校验失败:\n");
    result.error.issues.forEach((issue) => {
      console.error(`   ${issue.path.join(".")}: ${issue.message}`);
    });
    console.error("\n");
    process.exit(1);
  }

  return result.data;
}

const parsed = parseEnv();

export const env = {
  nodeEnv: parsed.NODE_ENV,
  port: parsed.PORT,
  isDev: parsed.NODE_ENV === "development",
  isProd: parsed.NODE_ENV === "production",
} as const;

export const proxyConfig = {
  apiKey: parsed.PROXY_API_KEY,
  dev: parsed.DEV,
  defaultModel: parsed.DEFAULT_MODEL || undefined,
  enableGlobalRoundRobin: parsed.ENABLE_GLOBAL_ROUND_ROBIN,
} as const;

export const aiGatewayConfig = {
  accountId: parsed.CLOUDFLARE_ACCOUNT_ID || undefined,
  name: parsed.AI_GATEWAY_NAME || undefined,
  token: parsed.CF_AIG_TOKEN || undefined,
} as const;

export const redisConfig = {
  url: parsed.KV_REST_API_URL || undefined,
  token: parsed.KV_REST_API_TOKEN || undefined,
} as const;

export const providerKeys = {
  OPENAI_API_KEY: parsed.OPENAI_API_KEY,
  GEMINI_API_KEY: parsed.GEMINI_API_KEY,
  ANTHROPIC_API_KEY: parsed.ANTHROPIC_API_KEY,
  CEREBRAS_API_KEY: parsed.CEREBRAS_API_KEY,
  COHERE_API_KEY: parsed.COHERE_API_KEY,
  DEEPSEEK_API_KEY: parsed.DEEPSEEK_API_KEY,
  GROK_API_KEY: parsed.GROK_API_KEY,
  GROQ_API_KEY: parsed.GROQ_API_KEY,
  MISTRAL_API_KEY: parsed.MISTRAL_API_KEY,
  OPENROUTER_API_KEY: parsed.OPENROUTER_API_KEY,
  HUGGINGFACE_API_KEY: parsed.HUGGINGFACE_API_KEY,
  PERPLEXITYAI_API_KEY: parsed.PERPLEXITYAI_API_KEY,
  REPLICATE_API_KEY: parsed.REPLICATE_API_KEY,
  CLOUDFLARE_API_KEY: parsed.CLOUDFLARE_API_KEY,
  OLLAMA_API_KEY: parsed.OLLAMA_API_KEY,
  CUSTOM_OPENAI_ENDPOINTS: parsed.CUSTOM_OPENAI_ENDPOINTS,
} as const;
