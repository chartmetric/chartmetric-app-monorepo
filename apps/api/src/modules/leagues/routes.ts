import { createApiRoutes } from "../../lib/api-routes.ts";
import { leagueFilterOptionsRoute } from "./routes/league-filter-options/route.ts";
import { listLeaguesRoute } from "./routes/list-leagues/route.ts";

export const leaguesRoutes = createApiRoutes([
  { plugin: leagueFilterOptionsRoute, surfaces: ["app"] },
  { plugin: listLeaguesRoute, surfaces: ["app", "v1"] },
]);
