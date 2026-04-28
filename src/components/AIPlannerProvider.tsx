// src/components/AIPlannerProvider.tsx
import { fetchCollection } from "@/src/lib/firestore-helpers";
import AIPlannerButton from "./AIPlannerButton";

export default async function AIPlannerProvider() {
    const [destinations, tours, routes, events, guides] = await Promise.all([
        fetchCollection("destinations", { where: [["status", "==", "active"]], orderBy: ["name",      "asc"] }),
        fetchCollection("tours",        { where: [["status", "==", "active"]], orderBy: ["title",     "asc"] }),
        fetchCollection("routes",       { where: [["status", "==", "active"]], orderBy: ["name",      "asc"] }),
        fetchCollection("events",       { orderBy: ["startDate", "asc"] }),
        fetchCollection("guides",       { where: [["isActive", "==", true]],   orderBy: ["name",      "asc"] }),
    ]);

    const now = new Date().toISOString().split("T")[0];

    // Resolve destination names for route stops
    const destMap = Object.fromEntries(destinations.map((d: any) => [d.id, d.name ?? d.id]));

    const s = (obj: any) => JSON.parse(JSON.stringify(obj));

    return (
        <AIPlannerButton
            destinations={s(destinations.map((d: any) => ({
                id: d.id, name: d.name ?? "", region: d.region ?? "",
                categories: d.categories ?? [],
                description: (d.description ?? "").slice(0, 200),
                images: d.images ?? [], avgRating: d.avgRating ?? 0,
            })))}
            tours={s(tours.map((t: any) => ({
                id: t.id, title: t.title ?? "", priceUSD: t.priceUSD ?? 0,
                durationDays: t.durationDays ?? 1, categories: t.categories ?? [],
                description: (t.description ?? "").slice(0, 150),
                images: t.images ?? [], avgRating: t.avgRating ?? 0, region: t.region ?? "",
            })))}
            routes={s(routes.map((r: any) => ({
                id: r.id, name: r.name ?? "", totalDays: r.totalDays ?? 1,
                description: (r.description ?? "").slice(0, 150),
                stops: (r.stops ?? []).map((stop: any) => ({
                    ...stop,
                    destName: destMap[stop.destinationId] ?? stop.destinationId,
                })),
            })))}
            events={s(
                events
                    .filter((e: any) => !e.endDate || e.endDate >= now) // only future/ongoing
                    .map((e: any) => ({
                        id: e.id, name: e.name ?? "", type: e.type ?? "",
                        startDate: e.startDate ?? "", endDate: e.endDate ?? "",
                        location: e.location ?? "",
                        destName: destMap[e.destinationId] ?? "",
                        description: (e.description ?? "").slice(0, 120),
                    }))
            )}
            guides={s(guides.map((g: any) => ({
                id: g.id, name: g.name ?? "",
                regions:     g.regions     ?? [],
                languages:   g.languages   ?? [],
                specialties: g.specialties ?? [],
                bio: (g.bio ?? "").slice(0, 150),
            })))}
        />
    );
}