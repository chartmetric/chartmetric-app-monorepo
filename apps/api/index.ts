import Fastify from "fastify";

import { helloMessage } from "./hello.ts";

const server = Fastify({ logger: true });

server.get("/", helloMessage);

await server.listen({ host: "0.0.0.0", port: 8080 });
