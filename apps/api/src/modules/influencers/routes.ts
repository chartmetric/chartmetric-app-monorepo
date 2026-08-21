import { createApiRoutes } from "../../lib/api-routes.ts";
import { listInfluencersRoute } from "./routes/list-influencers/route.ts";

export const influencersRoutes = createApiRoutes([
  { plugin: listInfluencersRoute, surfaces: ["app", "v1"] },
]);
