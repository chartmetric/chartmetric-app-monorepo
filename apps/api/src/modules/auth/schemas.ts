import { type Static, Type } from "@sinclair/typebox";

const AccountRoleSchema = Type.Union([
  Type.Literal("owner"),
  Type.Literal("admin"),
  Type.Literal("analyst"),
]);

const ProductFeaturesSchema = Type.Record(Type.String(), Type.Unknown());

const ProductAccessSchema = Type.Object({
  enabled: Type.Boolean(),
  features: Type.Optional(ProductFeaturesSchema),
});

export const AccessContextSchema = Type.Object({
  account: Type.Object({ id: Type.String(), role: AccountRoleSchema }),
  products: Type.Record(Type.String(), ProductAccessSchema),
  user: Type.Object({ id: Type.String() }),
});

export type AccessContext = Static<typeof AccessContextSchema>;

// Auth-service error bodies are passed through verbatim; additionalProperties
// keeps fields beyond the documented ones from being stripped on serialize.
export const AuthServiceErrorSchema = Type.Object(
  {
    error: Type.String(),
    message: Type.Optional(Type.String()),
  },
  { additionalProperties: true },
);

export type AuthServiceError = Static<typeof AuthServiceErrorSchema>;
