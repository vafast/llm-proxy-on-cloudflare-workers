import { describe, it, expect, vi, beforeEach } from "vitest";
import { Qwen } from "~/src/providers/qwen/provider";
import * as Secrets from "~/src/utils/secrets";

vi.mock("~/src/utils/secrets");

describe("Qwen Provider", () => {
  const testApiKey = "sk-test-qwen-key";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Secrets.Secrets.get).mockImplementation((key: string) => {
      if (key === "QWEN_API_KEY") return testApiKey;
      return "";
    });
    vi.mocked(Secrets.Secrets.getAll).mockImplementation((key: string) => {
      if (key === "QWEN_API_KEY") return [testApiKey];
      return [];
    });
  });

  describe("properties", () => {
    it("should have correct API key name and base URL", () => {
      const provider = new Qwen();
      expect(provider.apiKeyName).toBe("QWEN_API_KEY");
      expect(provider.baseUrl()).toBe(
        "https://dashscope.aliyuncs.com/compatible-mode/v1",
      );
    });
  });

  describe("available", () => {
    it("should return true when API key is provided", () => {
      const provider = new Qwen();
      expect(provider.available()).toBe(true);
    });

    it("should return false when API key is missing", () => {
      vi.mocked(Secrets.Secrets.getAll).mockReturnValue([]);
      const provider = new Qwen();
      expect(provider.available()).toBe(false);
    });
  });
});
