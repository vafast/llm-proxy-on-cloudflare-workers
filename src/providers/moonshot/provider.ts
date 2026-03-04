import { OpenAICompatibleProvider } from "../provider";

export class Moonshot extends OpenAICompatibleProvider {
  readonly apiKeyName: keyof Env = "MOONSHOT_API_KEY";
  readonly baseUrlProp: string = "https://api.moonshot.cn/v1";
}
