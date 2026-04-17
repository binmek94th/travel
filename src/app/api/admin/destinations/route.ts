
import { makeAdminRoutes } from "@/src/lib/admin-routes";
const { POST } = makeAdminRoutes("destinations", [
  "name","slug","region","categories","description","coverImage","images",
  "latitude", "longitude","bestTimeToVisit","travelTips","isHiddenGem","status",
]);
export { POST };

