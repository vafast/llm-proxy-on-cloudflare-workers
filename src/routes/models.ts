/**
 * Models 路由
 */
import { defineRoute } from "vafast";
import { models } from "../requests/models";

export const modelsRoutes = [
  defineRoute({
    method: "GET",
    path: "/models",
    handler: async ({ req }) => models(req),
  }),
  defineRoute({
    method: "GET",
    path: "/v1/models",
    handler: async ({ req }) => models(req),
  }),
];
