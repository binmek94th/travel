// src/app/api/webhooks/stripe/route.ts
// Handles Stripe events to update booking status after payment

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/src/lib/firebase-admin";
import {createAdminNotification} from "@/src/lib/admin-notifications";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
    const body      = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) return NextResponse.json({ error: "No signature" }, { status: 400 });

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error("[webhook] Signature verification failed:", err.message);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session   = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.bookingId;

        if (!bookingId) {
            console.error("[webhook] No bookingId in metadata");
            return NextResponse.json({ ok: true });
        }

        try {
            await adminDb.collection("bookings").doc(bookingId).update({
                status:           "confirmed",
                depositPaid:      true,
                stripeSessionId:  session.id,
                stripePaymentIntent: session.payment_intent,
                paidAt:           new Date().toISOString(),
                updatedAt:        new Date().toISOString(),
            });

            // Increment tour booking count
            const bookingDoc = await adminDb.collection("bookings").doc(bookingId).get();
            const tourId     = bookingDoc.data()?.tourId;
            if (tourId) {
                await adminDb.collection("tours").doc(tourId).update({
                    bookingCount: adminDb.collection("tours").doc(tourId)
                        ? require("firebase-admin").firestore.FieldValue.increment(1)
                        : 1,
                });
            }
            await createAdminNotification({
                type:      "payment_received",
                message:   `Payment received via Stripe for booking #${bookingId.slice(0,8)}`,
                bookingId,
            });

            console.log(`[webhook] Booking ${bookingId} confirmed`);
        } catch (err) {
            console.error("[webhook] Failed to update booking:", err);
            return NextResponse.json({ error: "DB update failed" }, { status: 500 });
        }
    }

    if (event.type === "checkout.session.expired") {
        const session   = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.bookingId;
        if (bookingId) {
            await adminDb.collection("bookings").doc(bookingId).update({
                status:    "expired",
                updatedAt: new Date().toISOString(),
            });
        }
    }

    return NextResponse.json({ ok: true });
}

// Stripe webhooks send raw body — disable Next.js body parsing
export const config = { api: { bodyParser: false } };