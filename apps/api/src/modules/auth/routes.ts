import { createApiRoutes } from "../../lib/api-routes.ts";
import { getAuthRoute } from "./routes/get-auth/route.ts";

export const authRoutes = createApiRoutes([
  { plugin: getAuthRoute, surfaces: ["app"] },
]);
