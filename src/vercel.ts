/**
 * Vercel Serverless Function 入口
 *
 * 使用 Vafast Server，与主入口共享路由和中间件
 */
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

export default async function (request: Request): Promise<Response> {
  return server.fetch(request);
}
