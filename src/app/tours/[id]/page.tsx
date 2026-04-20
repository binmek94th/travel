import { notFound } from "next/navigation";
import { adminDb } from "@/src/lib/firebase-admin";
import { serializeDoc } from "@/src/lib/firestore-helpers";
import TourDetail from "./TourDetail";

export const revalidate = 60;

export async function generateMetadata({
                                           params,
                                       }: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const snap = await adminDb.collection("tours").doc(id).get();
    if (!snap.exists) return { title: "Tour not found" };
    const d = snap.data()!;
    return {
        title:       `${d.title} — Tizitaw Ethiopia`,
        description: d.description?.slice(0, 160) ?? "",
        openGraph: {
            title:       d.title,
            description: d.description?.slice(0, 160) ?? "",
            images:      d.images?.[0] ? [d.images[0]] : [],
            type:        "article",
        },
    };
}

export default async function TourPage({
                                           params,
                                       }: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const snap = await adminDb.collection("tours").doc(id).get();
    if (!snap.exists) notFound();

    const raw = serializeDoc(snap.data()!);
    if (raw.status !== "active") notFound();

    const tour = {
        id:            snap.id,
        title:         raw.title         ?? "—",
        slug:          raw.slug          ?? id,
        operatorId:    raw.operatorId    ?? "",
        destinationIds:raw.destinationIds ?? [],
        categories:    raw.categories    ?? [],
        itinerary:     raw.itinerary     ?? [],
        durationDays:  raw.durationDays  ?? 0,
        priceUSD:      raw.priceUSD      ?? 0,
        priceETB:      raw.priceETB      ?? 0,
        groupSizeMin:  raw.groupSizeMin  ?? 1,
        groupSizeMax:  raw.groupSizeMax  ?? 12,
        includes:      raw.includes      ?? [],
        excludes:      raw.excludes      ?? [],
        images:        raw.images        ?? [],
        isFeatured:    raw.isFeatured    ?? false,
        description:   raw.description   ?? "",
    };

    // ── Fetch in parallel ────────────────────────────────────────────────────
    const [reviewsSnap, operatorSnap, destinationsSnap] = await Promise.all([

        // Reviews subcollection
        adminDb
            .collection("tours")
            .doc(id)
            .collection("reviews")
            .orderBy("createdAt", "desc")
            .limit(20)
            .get(),

        // Operator from users collection
        tour.operatorId
            ? adminDb.collection("users").doc(tour.operatorId).get()
            : Promise.resolve(null),

        // Destination names for the tour's destinationIds
        tour.destinationIds.length > 0
            ? adminDb
                .collection("destinations")
                .where("__name__", "in", tour.destinationIds.slice(0, 10))
                .get()
            : Promise.resolve(null),
    ]);

    const reviews = reviewsSnap.docs.map(r => {
        const d = serializeDoc(r.data());
        return {
            id:         r.id,
            rating:     d.rating     ?? 0,
            comment:    d.comment    ?? "",
            authorName: d.authorName ?? "Anonymous",
            authorId:   d.authorId   ?? "",
            createdAt:  d.createdAt  ?? "",
        };
    });

    const operatorRaw = operatorSnap?.exists ? serializeDoc(operatorSnap.data()!) : null;
    const operator = operatorRaw ? {
        id:          tour.operatorId,
        name:        operatorRaw.name        ?? operatorRaw.displayName ?? "Unknown operator",
        photoURL:    operatorRaw.photoURL    ?? null,
        nationality: operatorRaw.nationality ?? "",
        createdAt:   operatorRaw.createdAt   ?? "",
    } : null;

    const destinations = destinationsSnap
        ? destinationsSnap.docs.map(d => ({
            id:   d.id,
            name: d.data().name ?? "—",
            slug: d.data().slug ?? d.id,
        }))
        : [];

    return (
        <TourDetail
            tour={tour}
            reviews={reviews}
            operator={operator}
            destinations={destinations}
        />
    );
}