import { describe, it, expect, vi, beforeEach } from "vitest";
import { Ark } from "~/src/providers/ark/provider";
import * as Secrets from "~/src/utils/secrets";

vi.mock("~/src/utils/secrets");

describe("Ark Provider", () => {
  const testApiKey = "test-ark-key";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Secrets.Secrets.get).mockImplementation((key: string) => {
      if (key === "ARK_API_KEY") return testApiKey;
      return "";
    });
    vi.mocked(Secrets.Secrets.getAll).mockImplementation((key: string) => {
      if (key === "ARK_API_KEY") return [testApiKey];
      return [];
    });
  });

  describe("properties", () => {
    it("should have correct API key name and base URL", () => {
      const provider = new Ark();
      expect(provider.apiKeyName).toBe("ARK_API_KEY");
      expect(provider.baseUrl()).toBe("https://ark.cn-beijing.volces.com/api/v3");
    });
  });

  describe("available", () => {
    it("should return true when API key is provided", () => {
      const provider = new Ark();
      expect(provider.available()).toBe(true);
    });

    it("should return false when API key is missing", () => {
      vi.mocked(Secrets.Secrets.getAll).mockReturnValue([]);
      const provider = new Ark();
      expect(provider.available()).toBe(false);
    });
  });
});
