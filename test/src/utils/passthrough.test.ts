import { describe, it, expect } from "vitest";
import {
  buildForwardHeaders,
  getHeaderFromInit,
  PASSTHROUGH_HEADERS,
} from "~/src/utils/passthrough";

describe("passthrough", () => {
  describe("getHeaderFromInit", () => {
    it("从 Headers 读取", () => {
      const headers = new Headers({ "X-OpenAI-Key": "sk-xxx" });
      expect(getHeaderFromInit(headers, "X-OpenAI-Key")).toBe("sk-xxx");
      expect(getHeaderFromInit(headers, "x-openai-key")).toBe("sk-xxx");
    });

    it("从 Record 读取", () => {
      const headers = { "X-Anthropic-Key": "sk-ant-xxx" };
      expect(getHeaderFromInit(headers, "X-Anthropic-Key")).toBe("sk-ant-xxx");
    });

    it("无值时返回 null", () => {
      expect(getHeaderFromInit(undefined, "X-OpenAI-Key")).toBeNull();
      expect(getHeaderFromInit(new Headers(), "X-OpenAI-Key")).toBeNull();
    });
  });

  describe("buildForwardHeaders", () => {
    it("去除 Authorization，透传 X-OpenAI-Key 转为 Authorization", () => {
      const request = new Request("https://example.com", {
        headers: {
          Authorization: "Bearer proxy-key",
          "X-OpenAI-Key": "sk-user-openai",
          "Content-Type": "application/json",
        },
      });
      const headers = buildForwardHeaders(request, "openai");
      expect(headers.get("Authorization")).toBe("Bearer sk-user-openai");
      expect(headers.get("X-OpenAI-Key")).toBeNull();
      expect(headers.get("Content-Type")).toBe("application/json");
    });

    it("透传 X-Anthropic-Key 转为 x-api-key", () => {
      const request = new Request("https://example.com", {
        headers: {
          Authorization: "Bearer proxy-key",
          "X-Anthropic-Key": "sk-ant-user",
        },
      });
      const headers = buildForwardHeaders(request, "anthropic");
      expect(headers.get("x-api-key")).toBe("sk-ant-user");
      expect(headers.get("Authorization")).toBeNull();
    });

    it("透传 X-Google-Key 转为 x-goog-api-key", () => {
      const request = new Request("https://example.com", {
        headers: {
          Authorization: "Bearer proxy-key",
          "X-Google-Key": "AIza-user-key",
        },
      });
      const headers = buildForwardHeaders(request, "google-ai-studio");
      expect(headers.get("x-goog-api-key")).toBe("AIza-user-key");
      expect(headers.get("X-Google-Key")).toBeNull();
    });

    it("无透传头时去除 Authorization 和 x-api-key", () => {
      const request = new Request("https://example.com", {
        headers: {
          Authorization: "Bearer proxy-key",
          "x-api-key": "old-key",
        },
      });
      const headers = buildForwardHeaders(request, "openai");
      expect(headers.get("Authorization")).toBeNull();
      expect(headers.get("x-api-key")).toBeNull();
    });

    it("未知 provider 时仅去除鉴权头", () => {
      const request = new Request("https://example.com", {
        headers: {
          Authorization: "Bearer proxy-key",
          "Content-Type": "application/json",
        },
      });
      const headers = buildForwardHeaders(request, "unknown-provider");
      expect(headers.get("Authorization")).toBeNull();
      expect(headers.get("Content-Type")).toBe("application/json");
    });
  });

  describe("PASSTHROUGH_HEADERS 覆盖", () => {
    it("应包含所有已注册 provider", () => {
      const providers = [
        "openai",
        "anthropic",
        "google-ai-studio",
        "cerebras",
        "cohere",
        "deepseek",
        "grok",
        "groq",
        "mistral",
        "openrouter",
        "perplexity-ai",
        "replicate",
        "huggingface",
        "ollama",
      ];
      for (const p of providers) {
        expect(PASSTHROUGH_HEADERS[p], `缺少 ${p}`).toBeDefined();
        expect(PASSTHROUGH_HEADERS[p].incoming).toBeTruthy();
        expect(PASSTHROUGH_HEADERS[p].upstream).toBeTruthy();
      }
    });
  });
});
