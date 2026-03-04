import { OpenAICompatibleProvider } from "../provider";

export class Qwen extends OpenAICompatibleProvider {
  readonly apiKeyName: keyof Env = "QWEN_API_KEY";
  readonly baseUrlProp: string =
    "https://dashscope.aliyuncs.com/compatible-mode/v1";
}
