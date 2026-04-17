import { fetchCollection, countCollection, fmtDate } from "@/src/lib/firestore-helpers";
import DestinationsClient from "./DestinationsClient";

export const revalidate = 60;

export default async function DestinationsPage() {
  const [destinations, total, hiddenGems] = await Promise.all([
    fetchCollection("destinations", { orderBy: ["name", "asc"] }),
    countCollection("destinations"),
    countCollection("destinations", [["isHiddenGem", "==", true]]),
  ]);

  const serialized = destinations.map((d: any) => ({
    id:           d.id,
    name:         d.name         ?? "—",
    slug:         d.slug         ?? "",
    region:       d.region       ?? "—",
    categories:   d.categories   ?? [],
    avgRating:    d.avgRating     ?? 0,
    reviewCount:  d.reviewCount   ?? 0,
    isHiddenGem:  d.isHiddenGem   ?? false,
    status:       d.status        ?? "draft",
    coverImage:   d.coverImage    ?? null,
    bestTimeToVisit: d.bestTimeToVisit ?? "",
    latitude:  d.latitude   ?? 0,
    longitude: d.longitude ?? 0,
    description: d.description    ?? "",
  }));

  return <DestinationsClient destinations={serialized} total={total} hiddenGems={hiddenGems} />;
}
