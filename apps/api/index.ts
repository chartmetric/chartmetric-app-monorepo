import Fastify from "fastify";

const server = Fastify({ logger: true });

server.get("/", () => ({
  message: "Hello, world!",
}));

await server.listen({ host: "0.0.0.0", port: 8080 });
