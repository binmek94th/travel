// src/app/bookings/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth, adminDb } from "@/src/lib/firebase-admin";
import BookingsClient from "./BookingsClient";

async function getUid(): Promise<string | null> {
    try {
        const jar = await cookies();
        const val = jar.get("session")?.value;
        if (!val) return null;
        const decoded = await adminAuth.verifySessionCookie(val, true);
        return decoded.uid;
    } catch { return null; }
}

export default async function BookingsPage() {
    const uid = await getUid();
    if (!uid) redirect("/auth/login?returnUrl=/bookings");

    const snap = await adminDb
        .collection("bookings")
        .where("userId", "==", uid)
        .orderBy("createdAt", "desc")
        .get();

    const bookings = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    // Fetch tour details for each booking
    const tourIds   = [...new Set(bookings.map((b: any) => b.tourId).filter(Boolean))];
    const toursMap: Record<string, any> = {};
    for (let i = 0; i < tourIds.length; i += 10) {
        const chunk = tourIds.slice(i, i + 10);
        if (!chunk.length) break;
        const snap2 = await adminDb.collection("tours").where("__name__", "in", chunk).get();
        snap2.docs.forEach((d: any) => { toursMap[d.id] = { id: d.id, ...d.data() }; });
    }

    const serialize = (obj: any) => JSON.parse(JSON.stringify(obj));

    return (
        <BookingsClient
            bookings={serialize(bookings)}
            toursMap={serialize(toursMap)}
        />
    );
}