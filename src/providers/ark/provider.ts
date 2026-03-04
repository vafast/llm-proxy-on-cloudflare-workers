import { OpenAICompatibleProvider } from "../provider";

export class Ark extends OpenAICompatibleProvider {
  readonly apiKeyName: keyof Env = "ARK_API_KEY";
  readonly baseUrlProp: string = "https://ark.cn-beijing.volces.com/api/v3";
}
