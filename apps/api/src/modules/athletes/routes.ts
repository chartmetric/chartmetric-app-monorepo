import { createApiRoutes } from "../../lib/api-routes.ts";
import { athleteFilterOptionsRoute } from "./routes/athlete-filter-options.ts";
import { listAthletesRoute } from "./routes/list-athletes.ts";

export const athletesRoutes = createApiRoutes([
  { plugin: athleteFilterOptionsRoute, surfaces: ["app"] },
  { plugin: listAthletesRoute, surfaces: ["app"] },
]);
