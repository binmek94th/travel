// src/app/api/bookings/[id]/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/src/lib/firebase-admin";

async function getUid(req: NextRequest): Promise<string | null> {
    try {
        const cookie = req.cookies.get("session")?.value;
        if (!cookie) return null;
        const decoded = await adminAuth.verifySessionCookie(cookie, true);
        return decoded.uid;
    } catch { return null; }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const uid = await getUid(req);
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const bookingRef = adminDb.collection("bookings").doc(id);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    const booking = bookingDoc.data()!;
    if (booking.userId !== uid) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const cancellable = ["confirmed", "pending_payment"];
    if (!cancellable.includes(booking.status)) {
        return NextResponse.json({ error: "This booking cannot be cancelled" }, { status: 400 });
    }

    await bookingRef.update({
        status:    "cancelled",
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
}