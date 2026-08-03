import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import process from "node:process";

const LOG_LEVELS = [
  "fatal",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

const EnvironmentSchema = Type.Object({
  AUTHSERVICE_URL: Type.String({ minLength: 1 }),
  CLICKHOUSE_HOST: Type.String({ minLength: 1 }),
  CLICKHOUSE_PASSWORD: Type.String({ minLength: 1 }),
  CLICKHOUSE_USER: Type.String({ minLength: 1 }),
  CORS_ORIGIN: Type.Optional(Type.String({ minLength: 1 })),
  HOST: Type.String({ default: "0.0.0.0", minLength: 1 }),
  LOG_LEVEL: Type.Union(
    LOG_LEVELS.map((level) => Type.Literal(level)),
    { default: "info" },
  ),
  PORT: Type.Integer({ default: 8080, maximum: 65_535, minimum: 1 }),
});

export interface Config {
  authServiceUrl: string;
  clickhouseHost: string;
  clickhousePassword: string;
  clickhouseUser: string;
  corsOrigins: string[] | undefined;
  host: string;
  logLevel: LogLevel;
  port: number;
}

const describeErrors = (candidate: unknown): string =>
  [...Value.Errors(EnvironmentSchema, candidate)]
    .map((error) => `${error.path.slice(1)}: ${error.message}`)
    .join("; ");

export const loadConfig = (env: NodeJS.ProcessEnv = process.env): Config => {
  const candidate = Value.Default(
    EnvironmentSchema,
    Value.Convert(EnvironmentSchema, {
      AUTHSERVICE_URL: env["AUTHSERVICE_URL"],
      CLICKHOUSE_HOST: env["CLICKHOUSE_HOST"],
      CLICKHOUSE_PASSWORD: env["CLICKHOUSE_PASSWORD"],
      CLICKHOUSE_USER: env["CLICKHOUSE_USER"],
      CORS_ORIGIN: env["CORS_ORIGIN"],
      HOST: env["HOST"],
      LOG_LEVEL: env["LOG_LEVEL"],
      PORT: env["PORT"],
    }),
  );

  if (!Value.Check(EnvironmentSchema, candidate)) {
    throw new Error(
      `Invalid environment configuration — ${describeErrors(candidate)}`,
    );
  }

  return {
    authServiceUrl: candidate.AUTHSERVICE_URL,
    clickhouseHost: candidate.CLICKHOUSE_HOST,
    clickhousePassword: candidate.CLICKHOUSE_PASSWORD,
    clickhouseUser: candidate.CLICKHOUSE_USER,
    corsOrigins: candidate.CORS_ORIGIN?.split(",").map((origin) =>
      origin.trim(),
    ),
    host: candidate.HOST,
    logLevel: candidate.LOG_LEVEL,
    port: candidate.PORT,
  };
};
