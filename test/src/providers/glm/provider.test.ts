import { describe, it, expect, vi, beforeEach } from "vitest";
import { Glm } from "~/src/providers/glm/provider";
import * as Secrets from "~/src/utils/secrets";

vi.mock("~/src/utils/secrets");

describe("Glm Provider", () => {
  const testApiKey = "test-glm-key";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Secrets.Secrets.get).mockImplementation((key: string) => {
      if (key === "GLM_API_KEY") return testApiKey;
      return "";
    });
    vi.mocked(Secrets.Secrets.getAll).mockImplementation((key: string) => {
      if (key === "GLM_API_KEY") return [testApiKey];
      return [];
    });
  });

  describe("properties", () => {
    it("should have correct API key name and base URL", () => {
      const provider = new Glm();
      expect(provider.apiKeyName).toBe("GLM_API_KEY");
      expect(provider.baseUrl()).toBe("https://open.bigmodel.cn/api/paas/v4");
    });
  });

  describe("available", () => {
    it("should return true when API key is provided", () => {
      const provider = new Glm();
      expect(provider.available()).toBe(true);
    });

    it("should return false when API key is missing", () => {
      vi.mocked(Secrets.Secrets.getAll).mockReturnValue([]);
      const provider = new Glm();
      expect(provider.available()).toBe(false);
    });
  });
});
