import { createApiRoutes } from "../../lib/api-routes.ts";
import { influencerFilterOptionsRoute } from "./routes/influencer-filter-options/route.ts";
import { listInfluencersRoute } from "./routes/list-influencers/route.ts";

export const influencersRoutes = createApiRoutes([
  { plugin: influencerFilterOptionsRoute, surfaces: ["app"] },
  { plugin: listInfluencersRoute, surfaces: ["app", "v1"] },
]);
