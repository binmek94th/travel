// src/app/ai-planner/page.tsx
import { fetchCollection } from "@/src/lib/firestore-helpers";
import AIPlannerClient from "./AIPlannerClient";

export const metadata = {
    title: "AI Journey Planner — Tizitaw Ethiopia",
    description: "Tell us your travel style and let our AI build a personalised Ethiopia itinerary with real tours and destinations.",
};

export default async function AIPlannerPage() {
    const [destinations, tours] = await Promise.all([
        fetchCollection("destinations", { where: [["status", "==", "active"]], orderBy: ["name", "asc"] }),
        fetchCollection("tours",        { where: [["status", "==", "active"]], orderBy: ["title", "asc"] }),
    ]);

    const serializedDestinations = destinations.map((d: any) => ({
        id:          d.id,
        name:        d.name        ?? "",
        region:      d.region      ?? "",
        categories:  d.categories  ?? [],
        description: d.description ?? "",
        images:      d.images      ?? [],
        avgRating:   d.avgRating   ?? 0,
    }));

    const serializedTours = tours.map((t: any) => ({
        id:           t.id,
        title:        t.title        ?? "",
        priceUSD:     t.priceUSD     ?? 0,
        durationDays: t.durationDays ?? 1,
        categories:   t.categories   ?? [],
        description:  t.description  ?? "",
        images:       t.images       ?? [],
        avgRating:    t.avgRating    ?? 0,
        region:       t.region       ?? "",
    }));

    return (
        <AIPlannerClient
            destinations={serializedDestinations}
            tours={serializedTours}
        />
    );
}