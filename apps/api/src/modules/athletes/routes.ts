import { createApiRoutes } from "../../lib/api-routes.ts";
import { athleteFilterOptionsRoute } from "./routes/athlete-filter-options/route.ts";
import { listAthletesRoute } from "./routes/list-athletes/route.ts";

export const athletesRoutes = createApiRoutes([
  { plugin: athleteFilterOptionsRoute, surfaces: ["app"] },
  { plugin: listAthletesRoute, surfaces: ["app", "v1"] },
]);
