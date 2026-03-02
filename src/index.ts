/**
 * LLM Proxy 入口
 *
 * 使用 Vafast Server + serve，与 ai-server 架构一致
 */
import { Server, serve } from "vafast";
import { cors } from "@vafast/cors";
import { requestId } from "@vafast/request-id";
import { errorMiddleware } from "./middleware/error";
import { authMiddleware } from "./middleware/auth";
import { defaultAiGatewayMiddleware } from "./middleware/extractAiGateway";
import { createAllRoutes } from "./routes";
import { env } from "./common/env";

const routes = createAllRoutes();
const server = new Server(routes);

server.use(cors({ origin: true }));
server.use(requestId());
server.use(errorMiddleware);
server.use(authMiddleware);
server.use(defaultAiGatewayMiddleware);

serve(
  {
    fetch: server.fetch,
    port: env.port,
    hostname: "0.0.0.0",
    gracefulShutdown: true,
    trustProxy: true,
  },
  () => {
    console.log(`LLM Proxy 已启动: http://localhost:${env.port}`);
  },
);
