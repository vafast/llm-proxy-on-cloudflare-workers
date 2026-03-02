/**
 * Chat Completions 路由
 */
import { defineRoute } from "vafast";
import { chatCompletions } from "../requests/chat_completions";

export const chatRoutes = [
  defineRoute({
    method: "POST",
    path: "/chat/completions",
    handler: async ({ req, body }) => chatCompletions(req, body),
  }),
  defineRoute({
    method: "POST",
    path: "/v1/chat/completions",
    handler: async ({ req, body }) => chatCompletions(req, body),
  }),
];
