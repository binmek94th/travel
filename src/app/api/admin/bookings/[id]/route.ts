// src/app/api/admin/bookings/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase-admin";
import { verifyAdminSession } from "@/src/lib/admin-auth";
import { FieldValue } from "firebase-admin/firestore";

// ─── External notification stubs ─────────────────────────────────────────────

async function sendConfirmationEmail(opts: {
  to: string; travelerName: string; tourTitle: string;
  startDate: string; totalAmountUSD: number; note?: string;
}) {
  // await resend.emails.send({ ... });
  console.log("[notify:email]", opts);
}

async function sendConfirmationSMS(opts: {
  to: string; travelerName: string; tourTitle: string; startDate: string;
}) {
  // await twilioClient.messages.create({ ... });
  console.log("[notify:sms]", opts);
}

// ─── Admin topbar notification ────────────────────────────────────────────────

async function createAdminNotification(opts: {
  type: string; message: string; bookingId?: string; userId?: string;
}) {
  await adminDb.collection("adminNotifications").add({
    ...opts,
    read:      false,
    createdAt: FieldValue.serverTimestamp(),
  });
}

// ─── Traveler in-app notification ─────────────────────────────────────────────

async function createTravelerNotification(opts: {
  userId:     string;
  type:       string;
  title:      string;
  message:    string;
  bookingId:  string;
  tourId:     string;
  tourTitle:  string;
  startDate:  string;
  adminNote?: string;
}) {
  await adminDb.collection("notifications").add({
    ...opts,
    adminNote: opts.adminNote ?? null,
    read:      false,
    createdAt: FieldValue.serverTimestamp(),
  });
}

// ─── Valid transitions ────────────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending_payment: ["confirmed", "cancelled"],
  pending:         ["paid", "cancelled"],
  paid:            ["confirmed", "refunded"],
  confirmed:       ["active", "cancelled"],
  active:          ["completed", "cancelled"],
  completed:       [],
  cancelled:       ["refunded"],
  refunded:        [],
};

// ─── PATCH handler ────────────────────────────────────────────────────────────

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!await verifyAdminSession(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { status, notify, adminNote } = body as {
    status:     string;
    notify?:    { email?: boolean; sms?: boolean };
    adminNote?: string;
  };

  if (!status) return NextResponse.json({ error: "status required" }, { status: 400 });

  const docRef  = adminDb.collection("bookings").doc(id);
  const docSnap = await docRef.get();
  if (!docSnap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const booking = docSnap.data()!;
  const current = booking.status ?? "pending_payment";
  const allowed = VALID_TRANSITIONS[current] ?? [];

  if (!allowed.includes(status)) {
    return NextResponse.json(
        { error: `Cannot transition from '${current}' to '${status}'` },
        { status: 422 }
    );
  }

  await docRef.update({
    status,
    updatedAt: new Date().toISOString(),
    ...(adminNote ? { adminNote } : {}),
  });

  // ── On confirmation ───────────────────────────────────────────────────────
  if (status === "confirmed") {
    const travelerId = booking.userId ?? booking.travelerId ?? "";

    const [travelerSnap, tourSnap] = await Promise.all([
      travelerId ? adminDb.collection("users").doc(travelerId).get() : Promise.resolve(null),
      adminDb.collection("tours").doc(booking.tourId).get(),
    ]);

    const traveler       = travelerSnap?.data();
    const travelerName   = traveler?.displayName ?? traveler?.name ?? "Traveler";
    const tourTitle      = tourSnap.data()?.title ?? "your tour";
    const startDate      = booking.startDate ?? "";
    const totalAmountUSD = booking.totalAmountUSD ?? 0;

    const jobs: Promise<unknown>[] = [];

    if (travelerId) {
      jobs.push(
          createTravelerNotification({
            userId:    travelerId,
            type:      "booking_confirmed",
            title:     "Your booking is confirmed! ✦",
            message:   adminNote
                ? `Great news! Your booking for ${tourTitle} on ${startDate} has been confirmed. Note from our team: "${adminNote}"`
                : `Great news! Your booking for ${tourTitle} on ${startDate} has been confirmed. We look forward to seeing you!`,
            bookingId: id,
            tourId:    booking.tourId,
            tourTitle,
            startDate,
            adminNote,
          })
      );
    }

    jobs.push(
        createAdminNotification({
          type:      "booking_confirmed",
          message:   `Booking confirmed: ${travelerName} → ${tourTitle} (${startDate})`,
          bookingId: id,
          userId:    travelerId,
        })
    );

    if (notify?.email && traveler?.email) {
      jobs.push(sendConfirmationEmail({
        to: traveler.email, travelerName, tourTitle, startDate, totalAmountUSD, note: adminNote,
      }));
    }

    if (notify?.sms && traveler?.phone) {
      jobs.push(sendConfirmationSMS({
        to: traveler.phone, travelerName, tourTitle, startDate,
      }));
    }

    const results = await Promise.allSettled(jobs);
    results.forEach((r, i) => {
      if (r.status === "rejected") console.error(`[notify] job ${i} failed:`, r.reason);
    });
  }

  // ── On cancellation ───────────────────────────────────────────────────────
  if (status === "cancelled") {
    const travelerId = booking.userId ?? booking.travelerId ?? "";
    const tourSnap   = await adminDb.collection("tours").doc(booking.tourId).get();
    const tourTitle  = tourSnap.data()?.title ?? "your tour";

    const jobs: Promise<unknown>[] = [];

    if (travelerId) {
      jobs.push(
          createTravelerNotification({
            userId:    travelerId,
            type:      "booking_cancelled",
            title:     "Booking cancelled",
            message:   `Your booking for ${tourTitle} on ${booking.startDate} has been cancelled. Please contact support if you have questions.`,
            bookingId: id,
            tourId:    booking.tourId,
            tourTitle,
            startDate: booking.startDate ?? "",
          })
      );
    }

    jobs.push(
        createAdminNotification({
          type:      "booking_cancelled",
          message:   `Booking cancelled: #${id.slice(0, 8)} — ${tourTitle}`,
          bookingId: id,
          userId:    travelerId,
        })
    );

    await Promise.allSettled(jobs);
  }

  return NextResponse.json({ ok: true });
}