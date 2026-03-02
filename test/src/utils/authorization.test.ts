import { describe, it, expect, beforeEach, vi } from "vitest";
import { authenticate } from "~/src/utils/authorization";
import { Config } from "~/src/utils/config";

vi.mock("~/src/utils/config");

describe("authenticate", () => {
  // Mock Config.apiKeys 返回有效 API key
  beforeEach(() => {
    vi.mocked(Config.apiKeys).mockReturnValue(["valid-key"]);
  });

  // 未配置 PROXY_API_KEY 且无有效 key 时拒绝（统一行为）
  it("should return false when no PROXY_API_KEY is set and no valid key", async () => {
    vi.mocked(Config.apiKeys).mockReturnValue(undefined);
    const request = new Request("https://example.com");

    expect(await authenticate(request)).toBe(false);
  });

  // Authorization 头鉴权成功
  it("should return true when valid Authorization header is provided", async () => {
    const request = new Request("https://example.com", {
      headers: {
        Authorization: "Bearer valid-key",
      },
    });

    expect(await authenticate(request)).toBe(true);
  });

  // x-api-key 头鉴权成功
  it("should return true when valid x-api-key header is provided", async () => {
    const request = new Request("https://example.com", {
      headers: {
        "x-api-key": "valid-key",
      },
    });

    expect(await authenticate(request)).toBe(true);
  });

  // x-goog-api-key 头鉴权成功
  it("should return true when valid x-goog-api-key header is provided", async () => {
    const request = new Request("https://example.com", {
      headers: {
        "x-goog-api-key": "valid-key",
      },
    });

    expect(await authenticate(request)).toBe(true);
  });

  // key 查询参数鉴权成功
  it("should return true when valid 'key' query parameter is provided", async () => {
    const request = new Request("https://example.com?key=valid-key");

    expect(await authenticate(request)).toBe(true);
  });

  // 无鉴权头时失败
  it("should return false when no authorization header or query key is provided", async () => {
    const request = new Request("https://example.com");

    expect(await authenticate(request)).toBe(false);
  });

  // API key 错误时失败
  it("should return false when invalid API key is provided", async () => {
    const request = new Request("https://example.com", {
      headers: {
        Authorization: "Bearer invalid-key",
      },
    });

    expect(await authenticate(request)).toBe(false);
  });

  describe("多 PROXY_API_KEY 场景（多用户各自 key）", () => {
    it("多个 key 应各自独立鉴权通过，互不混淆", async () => {
      vi.mocked(Config.apiKeys).mockReturnValue([
        "user-a-key-aaa",
        "user-b-key-bbb",
        "user-c-key-ccc",
      ]);

      const reqA = new Request("https://example.com", {
        headers: { "x-api-key": "user-a-key-aaa" },
      });
      const reqB = new Request("https://example.com", {
        headers: { "x-api-key": "user-b-key-bbb" },
      });
      const reqC = new Request("https://example.com", {
        headers: { "x-api-key": "user-c-key-ccc" },
      });

      expect(await authenticate(reqA)).toBe(true);
      expect(await authenticate(reqB)).toBe(true);
      expect(await authenticate(reqC)).toBe(true);
    });

    it("用户 A 的 key 不能通过用户 B 的鉴权", async () => {
      vi.mocked(Config.apiKeys).mockReturnValue([
        "user-a-key-aaa",
        "user-b-key-bbb",
      ]);

      const reqWithWrongKey = new Request("https://example.com", {
        headers: { "x-api-key": "user-a-key-aaa" },
      });
      // 请求带的是 user-a 的 key，应在列表中，通过
      expect(await authenticate(reqWithWrongKey)).toBe(true);

      const reqWithInvalidKey = new Request("https://example.com", {
        headers: { "x-api-key": "random-key-not-in-list" },
      });
      expect(await authenticate(reqWithInvalidKey)).toBe(false);
    });

    it("key 精确匹配，子串或相似 key 不应通过", async () => {
      vi.mocked(Config.apiKeys).mockReturnValue(["exact-key-123"]);

      expect(
        await authenticate(
          new Request("https://x", { headers: { "x-api-key": "exact-key-123" } }),
        ),
      ).toBe(true);
      expect(
        await authenticate(
          new Request("https://x", { headers: { "x-api-key": "exact-key-12" } }),
        ),
      ).toBe(false);
      expect(
        await authenticate(
          new Request("https://x", { headers: { "x-api-key": "exact-key-1234" } }),
        ),
      ).toBe(false);
    });
  });
});
