import type { FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";

import { Type } from "@sinclair/typebox";

export const healthRoutes: FastifyPluginCallbackTypebox = (
  fastify,
  _options,
  done,
) => {
  fastify.get(
    "/health",
    {
      schema: {
        response: {
          200: Type.Object({ status: Type.Literal("ok") }),
        },
        tags: ["system"],
      },
    },
    () => ({ status: "ok" }) as const,
  );

  done();
};
