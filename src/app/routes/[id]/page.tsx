// src/app/routes/[id]/page.tsx
import { adminDb } from "@/src/lib/firebase-admin";
import { fetchCollection } from "@/src/lib/firestore-helpers";
import { notFound } from "next/navigation";
import Link from "next/link";
import RouteDetailClient from "./RouteDetailClient";

export const revalidate = 30;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id }   = await params;
    const doc      = await adminDb.collection("routes").doc(id).get();
    if (!doc.exists) return { title: "Route not found" };
    const route    = doc.data()!;
    return {
        title:       `${route.name} — Tizitaw Ethiopia`,
        description: route.description || `A ${route.totalDays}-day route through Ethiopia.`,
    };
}

export default async function RouteDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const [routeDoc, destinations, tours] = await Promise.all([
        adminDb.collection("routes").doc(id).get(),
        fetchCollection("destinations", { where: [["status", "==", "active"]] }),
        fetchCollection("tours",        { where: [["status", "==", "active"]] }),
    ]);

    if (!routeDoc.exists) notFound();

    const raw   = routeDoc.data()!;
    const route = {
        id:                 routeDoc.id,
        name:               raw.name               ?? "—",
        description:        raw.description        ?? "",
        stops:              raw.stops              ?? [],
        totalDays:          raw.totalDays          ?? 1,
        status:             raw.status             ?? "draft",
        recommendedTourIds: raw.recommendedTourIds ?? [],
    };

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

    // Fetch tour details for recommended tours only
    const recommendedTours = serializedTours.filter((t: any) =>
        route.recommendedTourIds.includes(t.id)
    );

    const serialize = (obj: any) => JSON.parse(JSON.stringify(obj));

    return (
        <RouteDetailClient
            route={serialize(route)}
            destinations={serialize(serializedDestinations)}
            recommendedTours={serialize(recommendedTours)}
        />
    );
}