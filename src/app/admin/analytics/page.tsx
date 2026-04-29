// src/app/admin/analytics/page.tsx

import { adminDb } from "@/src/lib/firebase-admin";
import AnalyticsClient from "./AnalyticsClient";

export const revalidate = 60;

function dateStr(daysAgo: number): string {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
}

async function getCounters(days: number) {
    const dates: string[] = [];
    for (let i = 0; i < days; i++) dates.push(dateStr(i));

    const snaps = await Promise.all(
        dates.map(d => adminDb.collection("analyticsCounters").doc(d).get())
    );

    return snaps.map((snap, i) => ({
        date:   dates[i],
        events: snap.exists ? (snap.data()?.events ?? {}) : {},
    }));
}

async function getBookingStats() {
    const [
        totalSnap, confirmedSnap, pendingSnap, cancelledSnap,
        last30Snap, revenueSnap,
    ] = await Promise.all([
        adminDb.collection("bookings").select().get(),
        adminDb.collection("bookings").where("status", "==", "confirmed").select().get(),
        adminDb.collection("bookings").where("status", "==", "pending_payment").select().get(),
        adminDb.collection("bookings").where("status", "==", "cancelled").select().get(),
        adminDb.collection("bookings")
            .where("createdAt", ">=", dateStr(30))
            .select("totalAmountUSD")
            .get(),
        adminDb.collection("bookings")
            .where("status", "in", ["confirmed", "completed"])
            .select("totalAmountUSD", "depositAmountUSD", "remainingPaid")
            .get(),
    ]);

    const revenueCollected = revenueSnap.docs.reduce((sum, d) => {
        const b = d.data();
        const dep = b.depositAmountUSD ?? 0;
        const rem = b.remainingPaid ? (b.totalAmountUSD ?? 0) - dep : 0;
        return sum + dep + rem;
    }, 0);

    const last30Revenue = last30Snap.docs.reduce((sum, d) =>
        sum + (d.data().totalAmountUSD ?? 0), 0);

    return {
        total:            totalSnap.size,
        confirmed:        confirmedSnap.size,
        pending:          pendingSnap.size,
        cancelled:        cancelledSnap.size,
        last30:           last30Snap.size,
        revenueCollected: Math.round(revenueCollected),
        last30Revenue:    Math.round(last30Revenue),
    };
}

async function getUserStats() {
    const [totalSnap, last30Snap] = await Promise.all([
        adminDb.collection("users").select().get(),
        adminDb.collection("users")
            .where("createdAt", ">=", dateStr(30))
            .select()
            .get(),
    ]);
    return { total: totalSnap.size, last30: last30Snap.size };
}

async function getTopTours() {
    // Count bookings per tour
    const snap = await adminDb
        .collection("bookings")
        .where("status", "in", ["confirmed", "completed", "active"])
        .select("tourId", "totalAmountUSD")
        .limit(200)
        .get();

    const map: Record<string, { count: number; revenue: number }> = {};
    snap.docs.forEach(d => {
        const { tourId, totalAmountUSD = 0 } = d.data();
        if (!tourId) return;
        if (!map[tourId]) map[tourId] = { count: 0, revenue: 0 };
        map[tourId].count++;
        map[tourId].revenue += totalAmountUSD;
    });

    const ranked = Object.entries(map)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 6);

    if (ranked.length === 0) return [];

    // Fetch tour titles
    const ids      = ranked.map(([id]) => id);
    const tourSnap = await adminDb
        .collection("tours")
        .where("__name__", "in", ids)
        .select("title")
        .get();
    const titles: Record<string, string> = {};
    tourSnap.docs.forEach(d => { titles[d.id] = d.data().title ?? "—"; });

    return ranked.map(([id, stats]) => ({
        tourId:  id,
        title:   titles[id] ?? "—",
        bookings:stats.count,
        revenue: Math.round(stats.revenue),
    }));
}

async function getDailyBookings(days = 30) {
    const result: { date: string; count: number; revenue: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = dateStr(i);
        result.push({ date: d, count: 0, revenue: 0 });
    }
    const snap = await adminDb
        .collection("bookings")
        .where("createdAt", ">=", dateStr(days))
        .select("createdAt", "totalAmountUSD")
        .get();

    snap.docs.forEach(doc => {
        const created = doc.data().createdAt;
        const d = typeof created === "string"
            ? created.slice(0, 10)
            : created?.toDate?.()?.toISOString?.()?.slice(0, 10);
        const row = result.find(r => r.date === d);
        if (row) {
            row.count++;
            row.revenue += doc.data().totalAmountUSD ?? 0;
        }
    });

    return result;
}

export default async function AnalyticsPage() {
    const [counters, bookings, users, topTours, daily] = await Promise.all([
        getCounters(30),
        getBookingStats(),
        getUserStats(),
        getTopTours(),
        getDailyBookings(30),
    ]);

    return (
        <AnalyticsClient
            counters={counters}
            bookings={bookings}
            users={users}
            topTours={topTours}
            daily={daily}
        />
    );
}