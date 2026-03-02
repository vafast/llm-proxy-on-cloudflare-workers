import { AUTHORIZATION_QUERY_PARAMETERS } from "./authorization";
import { randomInt } from "node:crypto";

// --- URL 脱敏 ---

const MASK_THRESHOLD = 10;
const MASK_PREFIX_LENGTH = 3;
const MASK_PLACEHOLDER = "***";

const SENSITIVE_PARAMS = new Set([
  "apikey",
  "api_key",
  "token",
  "access_token",
  "accesstoken",
  "auth",
  "authorization",
  "password",
  "secret",
  "key",
  "api-key",
]);

export function maskUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    if (urlObj.search) {
      const params = new URLSearchParams(urlObj.search);
      const maskedParams = new URLSearchParams();

      for (const [key, value] of params.entries()) {
        if (SENSITIVE_PARAMS.has(key.toLowerCase())) {
          if (value.length > MASK_THRESHOLD) {
            maskedParams.set(key, `${value.slice(0, MASK_PREFIX_LENGTH)}${MASK_PLACEHOLDER}`);
          } else if (value.length > 0) {
            maskedParams.set(key, MASK_PLACEHOLDER);
          } else {
            maskedParams.set(key, value);
          }
        } else {
          maskedParams.set(key, value);
        }
      }

      urlObj.search = maskedParams.toString();
    }

    return urlObj.toString();
  } catch {
    return url.split("?")[0] + (url.includes("?") ? `?${MASK_PLACEHOLDER}` : "");
  }
}

// --- 代理 fetch ---

/**
 * Node.js fetch() 会自动解压 gzip/br 响应，但不会修改 Response.headers，
 * 导致 content-encoding/content-length 与实际 body 不匹配。
 * 作为代理透传时需要剥掉这些 hop-by-hop 头。
 */
const HOP_BY_HOP_HEADERS = ["content-encoding", "content-length", "transfer-encoding"];

function stripHopHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const h of HOP_BY_HOP_HEADERS) headers.delete(h);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export const fetch2: typeof fetch = async (input, init) => {
  const url = input.toString();
  console.info(`Sub-Request: ${init?.method} ${maskUrl(url)}`);

  try {
    const response = await fetch(input, init);
    return stripHopHeaders(response);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const cause = err instanceof Error && err.cause ? ` (cause: ${(err.cause as Error)?.message})` : "";
    console.error(`Sub-Request failed: ${msg}${cause}`);
    throw err;
  }
};

// --- 通用工具 ---

export function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function getPathname(request: Request): string {
  return new URL(request.url).pathname;
}

export function shuffleArray<T>(array: T[]): T[] {
  const cloneArray = [...array];
  for (let i = cloneArray.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [cloneArray[i], cloneArray[j]] = [cloneArray[j], cloneArray[i]];
  }
  return cloneArray;
}

export function formatString(
  template: string,
  args: Record<string, string>,
): string {
  return Object.keys(args).reduce((result, key) => {
    return result.replace(new RegExp(`\\{${key}\\}`, "g"), args[key]);
  }, template);
}

export function cleanPathname(pathname: string): string {
  let cleaned = pathname;

  AUTHORIZATION_QUERY_PARAMETERS.forEach((param) => {
    const paramPattern = new RegExp(`[?&]${param}=([^&]*)`, "g");
    cleaned = cleaned.replace(
      paramPattern,
      (match, _value, offset, str) => {
        if (match.startsWith("?") && typeof str === "string") {
          const nextAmpersand = str.indexOf("&", offset + match.length);
          if (nextAmpersand !== -1) return "?";
          return "";
        }
        return "";
      },
    );
  });

  return cleaned.replace(/\?\&/, "?");
}

/**
 * 使用 AbortController 包装 Promise 超时。
 * 超时时中止 fetch 并 reject TimeoutError。
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  abortController: AbortController,
  timeoutMs: number,
  providerName: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      abortController.abort();
      const timeoutError = new Error(`Provider ${providerName} request timed out`);
      timeoutError.name = "TimeoutError";
      reject(timeoutError);
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}
