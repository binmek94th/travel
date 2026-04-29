

import { NextRequest, NextResponse } from "next/server";
import {adminAuth, adminDb} from "@/src/lib/firebase-admin";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;


async function getUid(req: NextRequest): Promise<string | null> {
    try {
        const cookie = req.cookies.get("session")?.value;
        if (!cookie) return null;
        const decoded = await adminAuth.verifySessionCookie(cookie, true);
        return decoded.uid;
    } catch {
        return null;
    }
}

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    // ── 1. Auth ────────────────────────────────────────────────────────────────
    const uid = await getUid(req);
    if (!uid) {
        return NextResponse.redirect(new URL(`/auth/login?returnUrl=/bookings`, BASE_URL));
    }

    // ── 2. Load booking ────────────────────────────────────────────────────────
    const docRef  = adminDb.collection("bookings").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
        return NextResponse.redirect(new URL("/bookings?error=not_found", BASE_URL));
    }

    const booking = docSnap.data()!;

    // Make sure this booking actually belongs to the signed-in user
    const ownerId = booking.userId ?? booking.travelerId;
    if (ownerId !== uid) {
        return NextResponse.redirect(new URL("/bookings?error=unauthorized", BASE_URL));
    }

    // Only allow resuming a pending_payment booking
    if (booking.status !== "pending_payment") {
        return NextResponse.redirect(new URL(`/bookings?error=not_pending`, BASE_URL));
    }

    // ── 3. Try to reuse the existing Stripe session ────────────────────────────
    if (booking.stripeSessionId) {
        try {
            const existing = await stripe.checkout.sessions.retrieve(booking.stripeSessionId);

            // If the session is still open, send the user straight there
            if (existing.status === "open") {
                return NextResponse.redirect(existing.url!);
            }
        } catch {
            // Session expired or invalid — fall through to create a new one
        }
    }
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const user    = userDoc.data() ?? {};

    // ── 4. Look up the tour for line-item details ──────────────────────────────
    const tourSnap = await adminDb.collection("tours").doc(booking.tourId).get();
    const tour     = tourSnap.data();
    const tourTitle = tour?.title ?? "Ethiopia Tour";
    const coverImage = tour?.images?.[0] ?? tour?.coverImage ?? null;

    const depositUSD    = booking.depositAmountUSD   ?? 0;
    const totalUSD      = booking.totalAmountUSD     ?? 0;
    const startDate     = booking.startDate          ?? "";
    const travelers     = booking.travelers           ?? 1;

    // ── 5. Create a new Stripe Checkout session ────────────────────────────────
    const session = await stripe.checkout.sessions.create({
        mode:               "payment",
        payment_method_types: ["card"],
        customer_email:     user.email ?? undefined,

        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency:     "usd",
                    unit_amount:  Math.round(depositUSD * 100), // deposit only
                    product_data: {
                        name:        `Deposit — ${tourTitle}`,
                        description: `${travelers} traveler${travelers !== 1 ? "s" : ""} · ${startDate} · 20% deposit to confirm your booking`,
                        ...(coverImage ? { images: [coverImage] } : {}),
                    },
                },
            },
        ],

        metadata: {
            bookingId: id,
            userId:    uid,
            tourId:    booking.tourId,
            type:      "deposit",
        },

        // After payment, your webhook handles status → "confirmed"
        success_url: `${BASE_URL}/bookings/${id}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:  `${BASE_URL}/bookings?cancelled=1`,
    });

    // ── 6. Store the new session ID so we can reuse it next time ───────────────
    await docRef.update({
        stripeSessionId: session.id,
        updatedAt:       new Date().toISOString(),
    });

    return NextResponse.redirect(session.url!);
}