import type { FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";

import { Type } from "@sinclair/typebox";

import { AccessContextSchema, AuthServiceErrorSchema } from "../schemas.ts";

const AuthHeadersSchema = Type.Object({
  authorization: Type.Optional(Type.String()),
  "x-org-id": Type.Optional(Type.String()),
});

export const getAuthRoute: FastifyPluginCallbackTypebox = (
  fastify,
  _options,
  done,
) => {
  fastify.get(
    "/auth",
    {
      schema: {
        headers: AuthHeadersSchema,
        response: {
          200: AccessContextSchema,
          401: AuthServiceErrorSchema,
          403: AuthServiceErrorSchema,
          502: AuthServiceErrorSchema,
        },
        tags: ["auth"],
      },
    },
    async (request, reply) => {
      const result = await fastify.authService.getAccessContext({
        authorization: request.headers.authorization,
        orgId: request.headers["x-org-id"],
      });

      return await reply.code(result.status).send(result.body);
    },
  );

  done();
};
