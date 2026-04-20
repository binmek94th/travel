// src/app/api/user/saved-tours/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase-admin";
import { verifyAdminSession } from "@/src/lib/admin-auth";

// GET — check if a specific tour is saved
export async function GET(req: NextRequest) {
    const session = await verifyAdminSession(req).catch(() => null);
    // verifyAdminSession throws for non-admins — use a lighter session check here
    const uid = await getUserUid(req);
    if (!uid) return NextResponse.json({ saved: false });

    const tourId = req.nextUrl.searchParams.get("tourId");
    if (!tourId) return NextResponse.json({ saved: false });

    const doc = await adminDb
        .collection("users").doc(uid)
        .collection("savedTours").doc(tourId)
        .get();

    return NextResponse.json({ saved: doc.exists });
}

// POST — save a tour
export async function POST(req: NextRequest) {
    const uid = await getUserUid(req);
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tourId, tourTitle } = await req.json();
    if (!tourId) return NextResponse.json({ error: "tourId required" }, { status: 400 });

    await adminDb
        .collection("users").doc(uid)
        .collection("savedTours").doc(tourId)
        .set({ tourId, tourTitle: tourTitle ?? "", savedAt: new Date().toISOString() });

    return NextResponse.json({ ok: true });
}

// DELETE — unsave a tour
export async function DELETE(req: NextRequest) {
    const uid = await getUserUid(req);
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tourId } = await req.json();
    if (!tourId) return NextResponse.json({ error: "tourId required" }, { status: 400 });

    await adminDb
        .collection("users").doc(uid)
        .collection("savedTours").doc(tourId)
        .delete();

    return NextResponse.json({ ok: true });
}

// ── Helper: extract uid from session cookie ───────────────────────────────────
async function getUserUid(req: NextRequest): Promise<string | null> {
    try {
        const { adminAuth } = await import("@/src/lib/firebase-admin");
        const cookie = req.cookies.get("session")?.value;
        if (!cookie) return null;
        const decoded = await adminAuth.verifySessionCookie(cookie, true);
        return decoded.uid;
    } catch {
        return null;
    }
}