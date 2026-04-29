// src/app/api/analytics/event/route.ts
// Receives product events from the client tracker and stores them in Firestore.
// Kept ultra-lean — no auth required (public endpoint), but rate-limited by IP.

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// Only store these events — ignore anything else sent to the endpoint
const ALLOWED_EVENTS = new Set([
    "tour_viewed", "booking_started", "booking_completed",
    "booking_cancelled", "payment_started", "payment_completed",
    "user_signed_up", "guide_viewed", "destination_viewed",
]);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { event, props, url, referrer, timestamp } = body;

        if (!event || !ALLOWED_EVENTS.has(event)) {
            return NextResponse.json({ ok: false }, { status: 204 });
        }

        // Get session user if available (from cookie)
        let userId: string | null = null;
        try {
            const { adminAuth } = await import("@/src/lib/firebase-admin");
            const session = req.cookies.get("session")?.value;
            if (session) {
                const decoded = await adminAuth.verifySessionCookie(session);
                userId = decoded.uid;
            }
        } catch { /* anonymous visitor */ }

        // Write to analytics collection — sharded by date for easy querying
        const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

        await adminDb.collection("analytics").doc(dateStr).collection("events").add({
            event,
            props:     props ?? {},
            url:       url   ?? null,
            referrer:  referrer ?? null,
            userId,
            ip:        req.headers.get("x-forwarded-for")?.split(",")[0] ?? null,
            createdAt: FieldValue.serverTimestamp(),
            clientTs:  timestamp ?? null,
        });

        // Also increment daily counters for fast dashboard queries
        const counterRef = adminDb.collection("analyticsCounters").doc(dateStr);
        await counterRef.set(
            {
                date: dateStr,
                [`events.${event}`]: FieldValue.increment(1),
                "events.total":      FieldValue.increment(1),
                updatedAt:           FieldValue.serverTimestamp(),
            },
            { merge: true }
        );

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        // Silent — analytics must never surface errors to users
        console.error("[analytics/event]", err.message);
        return NextResponse.json({ ok: false }, { status: 204 });
    }
}