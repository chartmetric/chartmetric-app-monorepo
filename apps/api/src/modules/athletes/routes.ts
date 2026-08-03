import { createApiRoutes } from "../../lib/api-routes.ts";
import { listAthletesRoute } from "./routes/list-athletes.ts";

export const athletesRoutes = createApiRoutes([
  { plugin: listAthletesRoute, surfaces: ["app"] },
]);
