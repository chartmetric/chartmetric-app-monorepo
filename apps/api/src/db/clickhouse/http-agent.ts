import http from "node:http";
import https from "node:https";

// The @clickhouse/client default agent can fail with a bogus
// "connect ECONNREFUSED ::1:443" — same tuned agents chartmetric-api runs with.
const agentOptions: http.AgentOptions = {
  keepAlive: true,
  keepAliveMsecs: 2500,
  maxFreeSockets: 256,
  maxSockets: 256,
  timeout: 90_000,
};

const httpAgent = new http.Agent(agentOptions);
const httpsAgent = new https.Agent(agentOptions);

export const pickClickhouseAgent = (url: string): http.Agent =>
  url.startsWith("http:") ? httpAgent : httpsAgent;

// Idle keep-alive sockets would otherwise hold the event loop open after close.
export const destroyClickhouseAgents = (): void => {
  httpAgent.destroy();
  httpsAgent.destroy();
};
