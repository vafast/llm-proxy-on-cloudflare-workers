import { getHeaderFromInit } from "../../utils/passthrough";
import { Secrets } from "../../utils/secrets";
import { OpenAIModelsListResponseBody } from "../openai/types";
import { ProviderBase } from "../provider";
import { AnthropicModelsListResponseBody } from "./types";

export class Anthropic extends ProviderBase {
  get chatCompletionPath(): string {
    return "/v1/chat/completions";
  }
  get modelsPath(): string {
    return "/v1/models";
  }

  readonly apiKeyName: keyof Env = "ANTHROPIC_API_KEY";
  readonly baseUrlProp: string = "https://api.anthropic.com";

  async headers(
    apiKeyIndex?: number,
    init?: RequestInit,
  ): Promise<Headers> {
    if (getHeaderFromInit(init?.headers, "x-api-key")) {
      return new Headers({ "Content-Type": "application/json", "anthropic-version": "2023-06-01" });
    }
    const apiKey = Secrets.get(this.apiKeyName, apiKeyIndex);
    return new Headers({
      "Content-Type": "application/json",
      "x-api-key": `${apiKey}`,
      "anthropic-version": "2023-06-01",
    });
  }

  modelsToOpenAIFormat(
    data: AnthropicModelsListResponseBody,
  ): OpenAIModelsListResponseBody {
    return {
      object: "list",
      data: data.data.map(({ id, type, created_at, ...model }) => ({
        id,
        object: type,
        created: Math.floor(Date.parse(created_at) / 1000),
        owned_by: "anthropic",
        _: model,
      })),
    };
  }
}
