/**
 * Vercel Serverless Function 入口
 *
 * Vercel Node.js 运行时传入的是 IncomingMessage/ServerResponse，
 * 需要手动适配为 Web Fetch API 的 Request/Response 再交给 vafast 处理。
 *
 * 注意：vafast/node-server 的 writeResponse 在 Vercel HTTP/2 环境下
 * 背压处理（drain 事件）存在兼容性问题，此处使用简化版实现。
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { Server } from "vafast";
import { cors } from "@vafast/cors";
import { requestId } from "@vafast/request-id";
import { errorMiddleware } from "./middleware/error";
import { authMiddleware } from "./middleware/auth";
import { defaultAiGatewayMiddleware } from "./middleware/extractAiGateway";
import { createAllRoutes } from "./routes";

const routes = createAllRoutes();
const server = new Server(routes);

server.use(cors({ origin: true }));
server.use(requestId());
server.use(errorMiddleware);
server.use(authMiddleware);
server.use(defaultAiGatewayMiddleware);

/** 将 Node.js IncomingMessage 转换为 Web API Request */
async function toWebRequest(req: IncomingMessage): Promise<Request> {
  const host = req.headers.host ?? "localhost";
  const url = `https://${host}${req.url ?? "/"}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const body = hasBody
    ? await new Promise<ArrayBuffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer) => chunks.push(chunk));
        req.on("end", () => {
          const buf = Buffer.concat(chunks);
          resolve(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer);
        });
        req.on("error", reject);
      })
    : null;

  return new Request(url, {
    method: req.method ?? "GET",
    headers,
    body,
  });
}

/** 将 Web API Response 写入 Node.js ServerResponse（不等待 drain，兼容 Vercel HTTP/2） */
async function writeWebResponse(webRes: Response, res: ServerResponse): Promise<void> {
  // 跳过这些头，避免与实际写出的 body 长度/编码不一致
  const SKIP = new Set(["content-encoding", "content-length", "transfer-encoding"]);
  res.statusCode = webRes.status;
  webRes.headers.forEach((value, key) => {
    if (!SKIP.has(key.toLowerCase())) res.setHeader(key, value);
  });

  if (!webRes.body) {
    res.end();
    return;
  }

  const reader = webRes.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
    res.end();
  }
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const request = await toWebRequest(req);
  const response = await server.fetch(request);
  await writeWebResponse(response, res);
}
