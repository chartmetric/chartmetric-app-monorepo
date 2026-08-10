import { createApiRoutes } from "../../lib/api-routes.ts";
import { listActorsRoute } from "./routes/list-actors/route.ts";

export const actorsRoutes = createApiRoutes([
  { plugin: listActorsRoute, surfaces: ["app", "v1"] },
]);
