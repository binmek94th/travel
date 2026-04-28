// src/components/AIPlannerProvider.tsx
// Server component — fetches data, renders the floating button
import { fetchCollection } from "@/src/lib/firestore-helpers";
import AIPlannerButton from "./AIPlannerButton";

export default async function AIPlannerProvider() {
    const [destinations, tours] = await Promise.all([
        fetchCollection("destinations", { where: [["status", "==", "active"]], orderBy: ["name", "asc"] }),
        fetchCollection("tours",        { where: [["status", "==", "active"]], orderBy: ["title", "asc"] }),
    ]);

    const serializedDestinations = destinations.map((d: any) => ({
        id: d.id, name: d.name ?? "", region: d.region ?? "",
        categories: d.categories ?? [], description: (d.description ?? "").slice(0, 200),
        images: d.images ?? [], avgRating: d.avgRating ?? 0,
    }));

    const serializedTours = tours.map((t: any) => ({
        id: t.id, title: t.title ?? "", priceUSD: t.priceUSD ?? 0,
        durationDays: t.durationDays ?? 1, categories: t.categories ?? [],
        description: (t.description ?? "").slice(0, 150),
        images: t.images ?? [], avgRating: t.avgRating ?? 0, region: t.region ?? "",
    }));

    return (
        <AIPlannerButton
            destinations={serializedDestinations}
            tours={serializedTours}
        />
    );
}