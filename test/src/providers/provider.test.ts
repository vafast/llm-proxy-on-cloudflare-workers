import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProviderBase } from "~/src/providers/provider";

vi.mock("~/src/utils", () => ({
  fetch2: vi.fn().mockImplementation(() => Promise.resolve(new Response())),
}));

describe("ProviderBase", () => {
  let providerBase: ProviderBase;

  beforeEach(() => {
    providerBase = new ProviderBase();
  });

  describe("available", () => {
    it("should return false by default (no apiKeyName)", () => {
      expect(providerBase.available()).toBe(false);
    });
  });

  describe("requestData", () => {
    it("should merge init headers with provider headers", async () => {
      vi.spyOn(providerBase, "headers").mockResolvedValue(
        new Headers({ "Content-Type": "application/json", Authorization: "Bearer key" }),
      );

      const result = await providerBase.requestData(
        { method: "POST", headers: new Headers({ accept: "*/*" }) },
        0,
      );

      const headers = result.headers;
      expect(headers).toBeInstanceOf(Headers);
      expect((headers as Headers).get("content-type")).toBe("application/json");
      expect((headers as Headers).get("authorization")).toBe("Bearer key");
      expect((headers as Headers).get("accept")).toBe("*/*");
    });
  });
});
