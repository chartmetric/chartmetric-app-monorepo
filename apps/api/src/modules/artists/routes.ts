import { createApiRoutes } from "../../lib/api-routes.ts";
import { listArtistsRoute } from "./routes/list-artists.ts";

export const artistsRoutes = createApiRoutes([
  { plugin: listArtistsRoute, surfaces: ["app", "v1"] },
]);
