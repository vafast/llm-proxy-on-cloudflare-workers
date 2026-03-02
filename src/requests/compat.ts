import { CloudflareAIGateway } from "../ai_gateway";
import { fetch2 } from "../utils/helpers";

/**
 * @param body - Vafast 预解析的 body（避免重复消耗 ReadableStream）
 */
export async function compat(
  request: Request,
  pathname: string,
  aiGateway: CloudflareAIGateway,
  body?: unknown,
) {
  const headers = new Headers(request.headers);
  headers.delete("Authorization");

  const sanitizedHeaders = Object.fromEntries(headers.entries());

  const forwardBody =
    body != null
      ? typeof body === "string"
        ? body
        : JSON.stringify(body)
      : null;

  const [requestInfo, requestInit] = aiGateway.buildCompatRequest({
    method: request.method,
    path: pathname,
    headers: sanitizedHeaders,
    body: forwardBody,
    signal: request.signal,
  });

  return fetch2(requestInfo, requestInit);
}
