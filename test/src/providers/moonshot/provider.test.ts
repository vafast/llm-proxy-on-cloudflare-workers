import { describe, it, expect, vi, beforeEach } from "vitest";
import { Moonshot } from "~/src/providers/moonshot/provider";
import * as Secrets from "~/src/utils/secrets";

vi.mock("~/src/utils/secrets");

describe("Moonshot Provider", () => {
  const testApiKey = "sk-test-moonshot-key";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Secrets.Secrets.get).mockImplementation((key: string) => {
      if (key === "MOONSHOT_API_KEY") return testApiKey;
      return "";
    });
    vi.mocked(Secrets.Secrets.getAll).mockImplementation((key: string) => {
      if (key === "MOONSHOT_API_KEY") return [testApiKey];
      return [];
    });
  });

  describe("properties", () => {
    it("should have correct API key name and base URL", () => {
      const provider = new Moonshot();
      expect(provider.apiKeyName).toBe("MOONSHOT_API_KEY");
      expect(provider.baseUrl()).toBe("https://api.moonshot.cn/v1");
    });
  });

  describe("available", () => {
    it("should return true when API key is provided", () => {
      const provider = new Moonshot();
      expect(provider.available()).toBe(true);
    });

    it("should return false when API key is missing", () => {
      vi.mocked(Secrets.Secrets.getAll).mockReturnValue([]);
      const provider = new Moonshot();
      expect(provider.available()).toBe(false);
    });
  });
});
