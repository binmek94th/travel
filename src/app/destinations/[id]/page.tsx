import { notFound } from "next/navigation";
import { adminDb } from "@/src/lib/firebase-admin";
import { serializeDoc } from "@/src/lib/firestore-helpers";
import DestinationDetail from "./DestinationDetail";

export const revalidate = 60;

export async function generateMetadata({
                                           params,
                                       }: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const snap = await adminDb
        .collection("destinations")
        .doc(id)
        .get();

    if (!snap.exists) return { title: "Destination not found" };

    const d = snap.data()!;
    return {
        title:       `${d.name} — Tizitaw Ethiopia`,
        description: d.description?.slice(0, 160) ?? "",
        openGraph: {
            title:       d.name,
            description: d.description?.slice(0, 160) ?? "",
            images:      d.coverImage ? [d.coverImage] : [],
            type:        "article",
        },
    };
}

export default async function DestinationPage({
                                                  params,
                                              }: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    // Fetch destination by ID directly — no slug lookup needed
    const snap = await adminDb.collection("destinations").doc(id).get();

    if (!snap.exists) notFound();

    const raw = serializeDoc(snap.data()!);

    // Only show active destinations to public
    if (raw.status !== "active") notFound();

    const destination = {
        id:              snap.id,
        name:            raw.name            ?? "—",
        slug:            raw.slug            ?? id,
        region:          raw.region          ?? "",
        categories:      raw.categories      ?? [],
        avgRating:       raw.avgRating       ?? 0,
        reviewCount:     raw.reviewCount     ?? 0,
        isHiddenGem:     raw.isHiddenGem     ?? false,
        coverImage:      raw.coverImage      ?? null,
        images:          raw.images          ?? [],
        description:     raw.description     ?? "",
        bestTimeToVisit: raw.bestTimeToVisit ?? "",
        travelTips:      raw.travelTips      ?? [],
        latitude:        raw.latitude        ?? null,
        longitude:       raw.longitude       ?? null,
    };

    // Fetch reviews subcollection
    const reviewsSnap = await adminDb
        .collection("destinations")
        .doc(id)
        .collection("reviews")
        .orderBy("createdAt", "desc")
        .limit(20)
        .get();

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

    // Fetch nearby tours where this destination is included
    const toursSnap = await adminDb
        .collection("tours")
        .where("destinationIds", "array-contains", id)
        .where("status", "==", "active")
        .limit(6)
        .get();

    const nearbyTours = toursSnap.docs.map(t => {
        const d = serializeDoc(t.data());
        return {
            id:           t.id,
            title:        d.title        ?? "—",
            slug:         d.slug         ?? t.id,
            priceUSD:     d.priceUSD     ?? 0,
            durationDays: d.durationDays ?? 0,
            avgRating:    d.avgRating    ?? 0,
            reviewCount:  d.reviewCount  ?? 0,
            coverImage:   d.coverImage   ?? null,
            categories:   d.categories   ?? [],
            isFeatured:   d.isFeatured   ?? false,
        };
    });

    return (
        <DestinationDetail
            destination={destination}
            reviews={reviews}
            nearbyTours={nearbyTours}
        />
    );
}