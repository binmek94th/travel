// src/app/bookings/[id]/resume-payment/page.tsx

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth, adminDb } from "@/src/lib/firebase-admin";
import ResumePaymentClient from "./ResumePaymentClient";

async function getSessionUser() {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return null;
    try {
        return await adminAuth.verifySessionCookie(session, true);
    } catch {
        return null;
    }
}

export default async function ResumePaymentPage({
                                                    params,
                                                }: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user   = await getSessionUser();

    if (!user) redirect(`/auth/login?returnUrl=/bookings/${id}/resume-payment`);

    // Load booking
    const bookingSnap = await adminDb.collection("bookings").doc(id).get();
    if (!bookingSnap.exists) redirect("/bookings?error=not_found");

    const booking = { id: bookingSnap.id, ...bookingSnap.data() } as any;

    // Ownership + status guard
    const ownerId = booking.userId ?? booking.travelerId;
    if (ownerId !== user.uid)           redirect("/bookings?error=unauthorized");
    if (booking.status !== "pending_payment") redirect(`/bookings?error=not_pending`);

    // Load tour
    const tourSnap = await adminDb.collection("tours").doc(booking.tourId).get();
    const tour     = tourSnap.exists ? { id: tourSnap.id, ...tourSnap.data() } as any : null;

    return (
        <ResumePaymentClient
            booking={{
                id:                 booking.id,
                tourId:             booking.tourId,
                status:             booking.status,
                startDate:          booking.startDate     ?? "",
                endDate:            booking.endDate       ?? "",
                travelers:          booking.travelers      ?? 1,
                totalAmountUSD:     booking.totalAmountUSD ?? 0,
                depositAmountUSD:   booking.depositAmountUSD ?? 0,
                remainingAmountUSD: booking.remainingAmountUSD ?? 0,
                depositPaid:        booking.depositPaid   ?? false,
                emergencyName:      booking.emergencyName ?? "",
                emergencyPhone:     booking.emergencyPhone ?? "",
                specialRequests:    booking.specialRequests,
                createdAt:          booking.createdAt     ?? "",
            }}
            tour={tour ? {
                id:          tour.id,
                title:       tour.title        ?? "Ethiopia Tour",
                images:      tour.images       ?? [],
                durationDays:tour.durationDays ?? 0,
                categories:  tour.categories   ?? [],
            } : null}
        />
    );
}