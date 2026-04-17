import { fetchCollection, countCollection, fmtDate } from "@/src/lib/firestore-helpers";
import BookingsClient from "./BookingsClient";

export const revalidate = 15;

export default async function BookingsPage() {
  const [bookings, pending, confirmed, cancelled, revenue] = await Promise.all([
    fetchCollection("bookings", { orderBy: ["createdAt", "desc"], limit: 50 }),
    countCollection("bookings", [["status", "==", "pending"]]),
    countCollection("bookings", [["status", "==", "confirmed"]]),
    countCollection("bookings", [["status", "==", "cancelled"]]),
    // Revenue aggregation — we sum in client from fetched docs for simplicity
    Promise.resolve(0),
  ]);

  const serialized = bookings.map((b: any) => ({
    id:              b.id,
    travelerId:      b.travelerId      ?? "—",
    tourId:          b.tourId          ?? "—",
    operatorId:      b.operatorId      ?? "—",
    totalUSD:        b.totalUSD        ?? 0,
    totalETB:        b.totalETB        ?? 0,
    currency:        b.currency        ?? "USD",
    status:          b.status          ?? "pending",
    paymentProvider: b.paymentProvider ?? "stripe",
    startDate:       fmtDate(b.startDate),
    createdAt:       fmtDate(b.createdAt),
  }));

  const totalRevUSD = serialized
    .filter((b: any) => b.currency === "USD" && ["confirmed","active","completed"].includes(b.status))
    .reduce((s: number, b: any) => s + b.totalUSD, 0);

  return (
    <BookingsClient
      bookings={serialized}
      stats={{ pending, confirmed, cancelled, revenueUSD: totalRevUSD }}
    />
  );
}
