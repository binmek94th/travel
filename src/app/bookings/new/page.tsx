// src/app/bookings/new/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth, adminDb } from "@/src/lib/firebase-admin";
import BookingClient from "./BookingClient";

async function getUid(): Promise<string | null> {
    try {
        const jar = await cookies();
        const val = jar.get("session")?.value;
        if (!val) return null;
        const decoded = await adminAuth.verifySessionCookie(val, true);
        return decoded.uid;
    } catch { return null; }
}

export default async function BookingNewPage({
                                                 searchParams,
                                             }: {
    searchParams: Promise<{ tourId?: string }>;
}) {
    const { tourId } = await searchParams;

    if (!tourId) redirect("/tours");

    const uid = await getUid();
    if (!uid) redirect(`/auth/login?returnUrl=${encodeURIComponent(`/bookings/new?tourId=${tourId}`)}`);

    // Fetch tour
    const tourDoc = await adminDb.collection("tours").doc(tourId).get();
    if (!tourDoc.exists) redirect("/tours");

    const tour = { id: tourDoc.id, ...tourDoc.data() } as any;
    if (tour.status !== "active") redirect("/tours");

    // Fetch user profile
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const user    = userDoc.data() ?? {};

    const deposit    = Math.round(tour.priceUSD * 0.2 * 100) / 100; // 20%
    const remaining  = Math.round((tour.priceUSD - deposit) * 100) / 100;

    const serialize  = (obj: any) => JSON.parse(JSON.stringify(obj));

    return (
        <BookingClient
            tour={serialize(tour)}
            user={serialize({ uid, name: user.displayName ?? user.name ?? "", email: user.email ?? "", nationality: user.nationality ?? "" })}
            deposit={deposit}
            remaining={remaining}
        />
    );
}