import { Anthropic } from "./providers/anthropic";
import { Ark } from "./providers/ark";
import { Cerebras } from "./providers/cerebras";
import { Cohere } from "./providers/cohere";
import { CustomOpenAI } from "./providers/custom-openai";
import { DeepSeek } from "./providers/deepseek";
import { Glm } from "./providers/glm";
import { GoogleAiStudio } from "./providers/google-ai-studio";
import { Grok } from "./providers/grok";
import { Groq } from "./providers/groq";
import { HuggingFace } from "./providers/huggingface";
import { MiniMax } from "./providers/minimax";
import { Mistral } from "./providers/mistral";
import { Moonshot } from "./providers/moonshot";
import { Ollama } from "./providers/ollama";
import { OpenAI } from "./providers/openai";
import { OpenRouter } from "./providers/openrouter";
import { PerplexityAi } from "./providers/perplexity-ai";
import { ProviderBase } from "./providers/provider";
import { Qwen } from "./providers/qwen";
import { Replicate } from "./providers/replicate";
import { Config } from "./utils/config";

export const Providers: {
  [providerName: string]: typeof ProviderBase;
} = {
  // 海外
  anthropic: Anthropic,
  cerebras: Cerebras,
  cohere: Cohere,
  "google-ai-studio": GoogleAiStudio,
  grok: Grok,
  groq: Groq,
  huggingface: HuggingFace,
  mistral: Mistral,
  ollama: Ollama,
  openai: OpenAI,
  openrouter: OpenRouter,
  "perplexity-ai": PerplexityAi,
  replicate: Replicate,
  // 中国
  ark: Ark,
  deepseek: DeepSeek,
  glm: Glm,
  minimax: MiniMax,
  moonshot: Moonshot,
  qwen: Qwen,
};

export function getProvider(
  providerName: string,
  _env: Env,
): ProviderBase | undefined {
  const ProviderClass = Providers[providerName];
  if (ProviderClass) {
    return new ProviderClass();
  }

  // 检查自定义端点
  const customEndpoints = Config.customOpenAIEndpoints();
  const customConfig = customEndpoints?.find((e) => e.name === providerName);
  if (customConfig) {
    return new CustomOpenAI(customConfig);
  }

  return undefined;
}

export function getAllProviders(env: Env): Record<string, ProviderBase> {
  const providers = Object.fromEntries(
    Object.keys(Providers).map((providerName) => [
      providerName,
      getProvider(providerName, env)!,
    ]),
  );

  // 添加自定义端点
  const customEndpoints = Config.customOpenAIEndpoints();
  if (customEndpoints) {
    for (const config of customEndpoints) {
      providers[config.name] = new CustomOpenAI(config);
    }
  }

  return providers;
}
