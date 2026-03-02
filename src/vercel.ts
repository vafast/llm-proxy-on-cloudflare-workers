/**
 * Vercel Serverless Function 入口
 *
 * 使用 vafast 内置的 node-server 适配器处理 IncomingMessage/ServerResponse 转换
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { Server } from "vafast";
import { createProxyRequest, writeResponse } from "vafast/node-server";
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

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const request = createProxyRequest(req, "localhost", { trustProxy: true });
  const response = await server.fetch(request);
  await writeResponse(response, res);
}
