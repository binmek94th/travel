// src/lib/email/triggers.ts
// Called from API routes, webhooks, and Cloud Functions to fire emails automatically

import { adminDb } from "@/src/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import {
    sendBookingConfirmation,
    sendWelcomeEmail,
    sendBookingCancellation,
    sendBookingReminder,
} from "./resend";

// ─── Log every email send to Firestore ───────────────────────────────────────

async function logEmail(opts: {
    type:      string;
    to:        string;
    bookingId?: string;
    userId?:   string;
    success:   boolean;
    error?:    string;
    messageId?: string;
}) {
    await adminDb.collection("emailLogs").add({
        ...opts,
        sentAt: FieldValue.serverTimestamp(),
    });
}

// ─── Trigger: new user registered ────────────────────────────────────────────
// Call from: src/app/api/auth/register/route.ts

export async function triggerWelcomeEmail(opts: {
    userId:       string;
    to:           string;
    travelerName: string;
    nationality?: string;
}) {
    const result = await sendWelcomeEmail(opts);
    await logEmail({ type:"welcome", to:opts.to, userId:opts.userId, success:result.success, error:result.error, messageId:result.id });
    return result;
}

// ─── Trigger: booking confirmed ───────────────────────────────────────────────
// Call from: src/app/api/admin/bookings/[id]/route.ts (on confirmed transition)
// OR from:   src/app/api/webhooks/stripe/route.ts (on checkout.session.completed)

export async function triggerBookingConfirmation(bookingId: string) {
    // Load all data from Firestore
    const bookingSnap = await adminDb.collection("bookings").doc(bookingId).get();
    if (!bookingSnap.exists) return;
    const b = bookingSnap.data()!;

    const travelerId  = b.userId ?? b.travelerId ?? "";
    const [userSnap, tourSnap] = await Promise.all([
        travelerId ? adminDb.collection("users").doc(travelerId).get() : Promise.resolve(null),
        adminDb.collection("tours").doc(b.tourId).get(),
    ]);

    const user = userSnap?.data();
    const tour = tourSnap.data();
    if (!user?.email) return;

    const result = await sendBookingConfirmation({
        to:              user.email,
        travelerName:    user.displayName ?? user.email,
        tourTitle:       tour?.title        ?? "Your tour",
        startDate:       b.startDate        ?? "",
        endDate:         b.endDate          ?? "",
        travelers:       b.travelers         ?? 1,
        totalAmountUSD:  b.totalAmountUSD   ?? 0,
        depositAmountUSD:b.depositAmountUSD ?? 0,
        bookingId,
        tourImageUrl:    tour?.images?.[0] ?? tour?.coverImage,
        adminNote:       b.adminNote,
    });

    await logEmail({ type:"booking_confirmed", to:user.email, bookingId, userId:travelerId, success:result.success, error:result.error, messageId:result.id });
    return result;
}

// ─── Trigger: booking cancelled ───────────────────────────────────────────────

export async function triggerBookingCancellation(bookingId: string) {
    const bookingSnap = await adminDb.collection("bookings").doc(bookingId).get();
    if (!bookingSnap.exists) return;
    const b = bookingSnap.data()!;

    const travelerId = b.userId ?? b.travelerId ?? "";
    const [userSnap, tourSnap] = await Promise.all([
        travelerId ? adminDb.collection("users").doc(travelerId).get() : Promise.resolve(null),
        adminDb.collection("tours").doc(b.tourId).get(),
    ]);

    const user = userSnap?.data();
    const tour = tourSnap.data();
    if (!user?.email) return;

    const result = await sendBookingCancellation({
        to:           user.email,
        travelerName: user.displayName ?? user.email,
        tourTitle:    tour?.title ?? "Your tour",
        startDate:    b.startDate ?? "",
        bookingId,
    });

    await logEmail({ type:"booking_cancelled", to:user.email, bookingId, userId:travelerId, success:result.success, error:result.error, messageId:result.id });
    return result;
}

// ─── Trigger: departure reminder ──────────────────────────────────────────────
// Call from a Cloud Function / cron job that runs daily

export async function triggerDepartureReminders() {
    const now = new Date();
    const results: Array<{ bookingId: string; success: boolean }> = [];

    // Find confirmed bookings where startDate is in 7 days or 1 day
    for (const daysAhead of [7, 1]) {
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + daysAhead);
        const dateStr = targetDate.toISOString().slice(0, 10); // YYYY-MM-DD

        const snap = await adminDb.collection("bookings")
            .where("status", "==", "confirmed")
            .where("startDate", "==", dateStr)
            .get();

        for (const doc of snap.docs) {
            const b          = doc.data();
            const travelerId = b.userId ?? b.travelerId ?? "";

            // Skip if already sent today
            const alreadySent = await adminDb.collection("emailLogs")
                .where("type", "==", "booking_reminder")
                .where("bookingId", "==", doc.id)
                .where("success", "==", true)
                .get();

            const todayStr = now.toISOString().slice(0, 10);
            const sentToday = alreadySent.docs.some(d => {
                const sent = d.data().sentAt?.toDate?.()?.toISOString?.()?.slice(0, 10);
                return sent === todayStr;
            });
            if (sentToday) continue;

            const [userSnap, tourSnap] = await Promise.all([
                travelerId ? adminDb.collection("users").doc(travelerId).get() : Promise.resolve(null),
                adminDb.collection("tours").doc(b.tourId).get(),
            ]);

            const user = userSnap?.data();
            const tour = tourSnap.data();
            if (!user?.email) continue;

            const result = await sendBookingReminder({
                to:           user.email,
                travelerName: user.displayName ?? user.email,
                tourTitle:    tour?.title ?? "Your tour",
                startDate:    b.startDate,
                daysUntil:    daysAhead,
                bookingId:    doc.id,
                tourImageUrl: tour?.images?.[0] ?? tour?.coverImage,
            });

            await logEmail({ type:"booking_reminder", to:user.email, bookingId:doc.id, userId:travelerId, success:result.success, error:result.error, messageId:result.id });
            results.push({ bookingId: doc.id, success: result.success });
        }
    }

    return results;
}