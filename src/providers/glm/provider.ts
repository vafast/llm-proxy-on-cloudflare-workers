import { OpenAICompatibleProvider } from "../provider";

export class Glm extends OpenAICompatibleProvider {
  readonly apiKeyName: keyof Env = "GLM_API_KEY";
  readonly baseUrlProp: string = "https://open.bigmodel.cn/api/paas/v4";
}
