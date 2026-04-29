
import { adminDb } from "@/src/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export type AdminNotificationType =
    | "booking_confirmed"
    | "booking_cancelled"
    | "new_booking"
    | "operator_applied"
    | "review_flagged"
    | "payment_received";

export interface CreateAdminNotificationOpts {
    type:       AdminNotificationType;
    message:    string;
    bookingId?: string;
    userId?:    string;
    tourId?:    string;
}

export async function createAdminNotification(opts: CreateAdminNotificationOpts) {
    await adminDb.collection("adminNotifications").add({
        ...opts,
        read:      false,
        createdAt: FieldValue.serverTimestamp(),
    });
}