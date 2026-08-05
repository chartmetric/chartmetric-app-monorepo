import { createApiRoutes } from "../../lib/api-routes.ts";
import { artistFilterOptionsRoute } from "./routes/artist-filter-options/route.ts";
import { listArtistsRoute } from "./routes/list-artists/route.ts";

export const artistsRoutes = createApiRoutes([
  { plugin: artistFilterOptionsRoute, surfaces: ["app"] },
  { plugin: listArtistsRoute, surfaces: ["app", "v1"] },
]);
