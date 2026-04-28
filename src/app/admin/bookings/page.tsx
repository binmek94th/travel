import { adminDb } from "@/src/lib/firebase-admin";
import { fetchCollection, fmtDate } from "@/src/lib/firestore-helpers";
import BookingsClient, { type Booking } from "./BookingsClient";

export const revalidate = 30;

export default async function BookingsPage() {
  // 1. Fetch all bookings
  const raw = await fetchCollection("bookings", { orderBy: ["createdAt", "desc"] });

  // 2. Collect unique traveler IDs (field is "userId" in your schema)
  const travelerIds = [...new Set(
    raw.map((b: any) => b.userId ?? b.travelerId).filter(Boolean) as string[]
  )];

  // 3. Collect unique tour IDs
  const tourIds = [...new Set(
    raw.map((b: any) => b.tourId).filter(Boolean) as string[]
  )];

  // 4. Batch-fetch users (Firestore "in" max = 30 docs per query)
  const travelerMap: Record<string, { name?: string; email?: string; phone?: string; avatarUrl?: string; country?: string }> = {};
  for (let i = 0; i < travelerIds.length; i += 30) {
    const chunk = travelerIds.slice(i, i + 30);
    const snap  = await adminDb.collection("users")
      .where("__name__", "in", chunk)
      .select("displayName", "email", "phone", "photoURL", "country")
      .get();
    snap.docs.forEach(d => {
      const u = d.data();
      travelerMap[d.id] = {
        name:      u.displayName ?? u.name,
        email:     u.email,
        phone:     u.phone,
        avatarUrl: u.photoURL,
        country:   u.country,
      };
    });
  }

  // 5. Batch-fetch tours
  const tourMap: Record<string, { title?: string; coverUrl?: string; duration?: number }> = {};
  for (let i = 0; i < tourIds.length; i += 30) {
    const chunk = tourIds.slice(i, i + 30);
    const snap  = await adminDb.collection("tours")
      .where("__name__", "in", chunk)
      .select("title", "coverImage", "duration")
      .get();
    snap.docs.forEach(d => {
      const t = d.data();
      tourMap[d.id] = {
        title:    t.title,
        coverUrl: t.coverImage ?? t.coverUrl,
        duration: t.duration,
      };
    });
  }

  // 6. Merge enriched data onto each booking
  const bookings: Booking[] = raw.map((b: any) => {
    const travelerId = b.userId ?? b.travelerId ?? "";
    const traveler   = travelerMap[travelerId] ?? {};
    const tour       = tourMap[b.tourId]       ?? {};

    return {
      ...b,
      // Traveler enrichment
      travelerName:     traveler.name,
      travelerEmail:    traveler.email,
      travelerPhone:    traveler.phone,
      travelerAvatarUrl:traveler.avatarUrl,
      travelerCountry:  traveler.country,
      // Tour enrichment
      tourTitle:    tour.title,
      tourCoverUrl: tour.coverUrl,
      tourDuration: tour.duration,
    };
  });

  // 7. Compute stats
  const stats = {
    pending:    bookings.filter(b => b.status === "pending_payment").length,
    confirmed:  bookings.filter(b => b.status === "confirmed").length,
    cancelled:  bookings.filter(b => b.status === "cancelled").length,
    revenueUSD: bookings
      .filter(b => b.status === "confirmed")
      .reduce((s, b) => s + (b.totalAmountUSD ?? 0), 0),
  };

  return <BookingsClient bookings={bookings} stats={stats} />;
}
