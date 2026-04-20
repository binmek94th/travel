// src/app/api/user/saved-destinations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/src/lib/firebase-admin";

async function getUserUid(req: NextRequest): Promise<string | null> {
    try {
        const cookie = req.cookies.get("session")?.value;
        if (!cookie) return null;
        const decoded = await adminAuth.verifySessionCookie(cookie, true);
        return decoded.uid;
    } catch { return null; }
}

export async function GET(req: NextRequest) {
    const uid = await getUserUid(req);
    if (!uid) return NextResponse.json({ saved: false });
    const destId = req.nextUrl.searchParams.get("destinationId");
    if (!destId) return NextResponse.json({ saved: false });
    const doc = await adminDb.collection("users").doc(uid).collection("savedDestinations").doc(destId).get();
    return NextResponse.json({ saved: doc.exists });
}

export async function POST(req: NextRequest) {
    const uid = await getUserUid(req);
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { destinationId, destinationName } = await req.json();
    if (!destinationId) return NextResponse.json({ error: "destinationId required" }, { status: 400 });
    await adminDb.collection("users").doc(uid).collection("savedDestinations").doc(destinationId)
        .set({ destinationId, destinationName: destinationName ?? "", savedAt: new Date().toISOString() });
    return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
    const uid = await getUserUid(req);
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { destinationId } = await req.json();
    if (!destinationId) return NextResponse.json({ error: "destinationId required" }, { status: 400 });
    await adminDb.collection("users").doc(uid).collection("savedDestinations").doc(destinationId).delete();
    return NextResponse.json({ ok: true });
}