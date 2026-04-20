// src/app/saved/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth, adminDb } from "@/src/lib/firebase-admin";
import SavedClient from "./SavedClient";

async function getUid(): Promise<string | null> {
    try {
        const jar    = await cookies();          // ← await required in Next 15
        const cookie = jar.get("session")?.value;
        if (!cookie) return null;
        const decoded = await adminAuth.verifySessionCookie(cookie, true);
        return decoded.uid;
    } catch (err) {
        console.error("[saved/page] Session verify error:", err);
        return null;
    }
}

export default async function SavedPage() {
    const uid = await getUid();
    if (!uid) redirect("/auth/login?returnUrl=/saved");

    const destSnap = await adminDb
        .collection("users").doc(uid)
        .collection("savedDestinations")
        .orderBy("savedAt", "desc")
        .get();
    const savedDestIds = destSnap.docs.map(d => d.data().destinationId as string);

    const tourSnap = await adminDb
        .collection("users").doc(uid)
        .collection("savedTours")
        .orderBy("savedAt", "desc")
        .get();
    const savedTourIds = tourSnap.docs.map(d => d.data().tourId as string);

    const destinations: any[] = [];
    for (let i = 0; i < savedDestIds.length; i += 10) {
        const chunk = savedDestIds.slice(i, i + 10);
        if (!chunk.length) break;
        const snap = await adminDb.collection("destinations").where("__name__", "in", chunk).get();
        const map  = Object.fromEntries(snap.docs.map(d => [d.id, { id: d.id, ...d.data() }]));
        chunk.forEach(id => { if (map[id]) destinations.push(map[id]); });
    }

    const tours: any[] = [];
    for (let i = 0; i < savedTourIds.length; i += 10) {
        const chunk = savedTourIds.slice(i, i + 10);
        if (!chunk.length) break;
        const snap = await adminDb.collection("tours").where("__name__", "in", chunk).get();
        const map  = Object.fromEntries(snap.docs.map(d => [d.id, { id: d.id, ...d.data() }]));
        chunk.forEach(id => { if (map[id]) tours.push(map[id]); });
    }

    const serialize = (obj: any) => JSON.parse(JSON.stringify(obj));

    return (
        <SavedClient
            destinations={serialize(destinations)}
            tours={serialize(tours)}
        />
    );
}