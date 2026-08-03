import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import { getAuthRoute } from "./routes/get-auth.ts";

// Registrar only — each route lives in its own file under routes/.
export const authRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  await fastify.register(getAuthRoute);
};
