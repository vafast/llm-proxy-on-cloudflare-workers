import { describe, it, expect, vi, beforeEach } from "vitest";
import { MiniMax } from "~/src/providers/minimax/provider";
import * as Secrets from "~/src/utils/secrets";

vi.mock("~/src/utils/secrets");

describe("MiniMax Provider", () => {
  const testApiKey = "sk-test-minimax-key";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Secrets.Secrets.get).mockImplementation((key: string) => {
      if (key === "MINIMAX_API_KEY") return testApiKey;
      return "";
    });
    vi.mocked(Secrets.Secrets.getAll).mockImplementation((key: string) => {
      if (key === "MINIMAX_API_KEY") return [testApiKey];
      return [];
    });
  });

  describe("properties", () => {
    it("should have correct API key name and base URL", () => {
      const provider = new MiniMax();
      expect(provider.apiKeyName).toBe("MINIMAX_API_KEY");
      expect(provider.baseUrl()).toBe("https://api.minimaxi.com");
    });

    it("should use /v1/chat/completions path", () => {
      const provider = new MiniMax();
      expect(provider.chatCompletionPath).toBe("/v1/chat/completions");
    });
  });

  describe("available", () => {
    it("should return true when API key is provided", () => {
      const provider = new MiniMax();
      expect(provider.available()).toBe(true);
    });

    it("should return false when API key is missing", () => {
      vi.mocked(Secrets.Secrets.getAll).mockReturnValue([]);
      const provider = new MiniMax();
      expect(provider.available()).toBe(false);
    });
  });
});
