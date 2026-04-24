// src/app/routes/page.tsx
import { fetchCollection, countCollection } from "@/src/lib/firestore-helpers";
import RoutesClient from "./RoutesClient";

export const revalidate = 30;

export async function generateMetadata() {
    return {
        title: "Routes — Tizitaw Ethiopia",
        description: "Discover curated multi-stop routes through Ethiopia's most extraordinary destinations.",
    };
}

export default async function RoutesPage() {
    const [routes, total, destinations, tours] = await Promise.all([
        fetchCollection("routes",       { orderBy: ["createdAt", "desc"] }),
        countCollection("routes"),
        fetchCollection("destinations", { where: [["status", "==", "active"]] }),
        fetchCollection("tours",        { where: [["status", "==", "active"]] }),
    ]);

    const serializedRoutes = routes
        .filter((r: any) => r.status === "active" || r.status === "published")
        .map((r: any) => ({
            id:                 r.id,
            name:               r.name               ?? "—",
            description:        r.description        ?? "",
            stops:              r.stops              ?? [],
            totalDays:          r.totalDays          ?? 1,
            status:             r.status             ?? "draft",
            recommendedTourIds: r.recommendedTourIds ?? [],
        }));

    const serializedDestinations = destinations.map((d: any) => ({
        id:        d.id,
        name:      d.name      ?? d.id,
        region:    d.region    ?? "",
        images:    d.images    ?? [],
        latitude:  d.latitude  ?? null,
        longitude: d.longitude ?? null,
    }));

    const serializedTours = tours.map((t: any) => ({
        id:           t.id,
        title:        t.title        ?? t.id,
        priceUSD:     t.priceUSD     ?? null,
        durationDays: t.durationDays ?? null,
        images:       t.images       ?? [],
    }));

    return (
        <RoutesClient
            routes={serializedRoutes}
            total={total}
            destinations={serializedDestinations}
            tours={serializedTours}
        />
    );
}