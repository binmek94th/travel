// src/app/admin/analytics/page.tsx

import { adminDb } from "@/src/lib/firebase-admin";
import AnalyticsClient from "./AnalyticsClient";

export const revalidate = 60;

function dateStr(daysAgo: number): string {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
}

// ─── Counters (events + page views + geo) ─────────────────────────────────────

async function getCounters(days: number) {
    const dates: string[] = [];
    for (let i = 0; i < days; i++) dates.push(dateStr(i));

    const snaps = await Promise.all(
        dates.map(d => adminDb.collection("analyticsCounters").doc(d).get())
    );

    return snaps.map((snap, i) => ({
        date:       dates[i],
        events:     snap.exists ? (snap.data()?.events     ?? {}) : {},
        pageViews:  snap.exists ? (snap.data()?.pageViews  ?? {}) : {},
        countries:  snap.exists ? (snap.data()?.countries  ?? {}) : {},
        continents: snap.exists ? (snap.data()?.continents ?? {}) : {},
        cities:     snap.exists ? (snap.data()?.cities     ?? {}) : {},
    }));
}

// ─── Unique visitor counts ─────────────────────────────────────────────────────
// Each visitor writes one doc to analyticsVisitors/{date}/ids/{visitorId}
// so counting docs = counting unique daily visitors

async function getVisitorStats(days: number) {
    const dates: string[] = [];
    for (let i = 0; i < days; i++) dates.push(dateStr(i));

    const dailyCounts = await Promise.all(
        dates.map(async d => {
            const snap = await adminDb
                .collection("analyticsVisitors")
                .doc(d)
                .collection("ids")
                .select() // only fetch doc IDs, no fields
                .get();
            return { date: d, visitors: snap.size };
        })
    );

    // Aggregate totals
    const totalVisitors    = dailyCounts.reduce((s, d) => s + d.visitors, 0);
    const last7Visitors    = dailyCounts.slice(0, 7).reduce((s, d) => s + d.visitors, 0);
    const todayVisitors    = dailyCounts[0]?.visitors ?? 0;

    // Sparkline data (oldest → newest for chart)
    const sparkline = dailyCounts.slice(0, days).reverse().map(d => d.visitors);

    return { totalVisitors, last7Visitors, todayVisitors, sparkline, daily: dailyCounts.slice().reverse() };
}

// ─── Top pages ─────────────────────────────────────────────────────────────────

async function getTopPages(counters: Awaited<ReturnType<typeof getCounters>>) {
    const pathAgg: Record<string, number> = {};
    counters.forEach(c => {
        const paths = (c.pageViews as Record<string, unknown>)?.paths ?? {};
        Object.entries(paths as Record<string, number>).forEach(([k, v]) => {
            pathAgg[k] = (pathAgg[k] ?? 0) + v;
        });
    });

    return Object.entries(pathAgg)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([key, count]) => ({
            path:  "/" + key.replace(/_/g, "/"),
            count,
        }));
}

// ─── Geo breakdown ────────────────────────────────────────────────────────────

async function getGeoBreakdown(counters: Awaited<ReturnType<typeof getCounters>>) {
    const countryAgg: Record<string, number>   = {};
    const continentAgg: Record<string, number> = {};
    const cityAgg: Record<string, number>      = {};

    counters.forEach(c => {
        Object.entries(c.countries  ?? {}).forEach(([k,v]) => { countryAgg[k]   = (countryAgg[k]   ?? 0) + (v as number); });
        Object.entries(c.continents ?? {}).forEach(([k,v]) => { continentAgg[k] = (continentAgg[k] ?? 0) + (v as number); });
        Object.entries(c.cities     ?? {}).forEach(([k,v]) => { cityAgg[k]      = (cityAgg[k]      ?? 0) + (v as number); });
    });

    const topCountries = Object.entries(countryAgg).sort((a,b) => b[1]-a[1]).slice(0, 15).map(([code, count]) => ({ code, count }));
    const topCities    = Object.entries(cityAgg).sort((a,b) => b[1]-a[1]).slice(0, 10).map(([key, count]) => {
        const parts = key.split("_"); const cc = parts[0]; const city = parts.slice(1).join(" ");
        return { city, countryCode:cc, count };
    });
    const continentBreakdown = Object.entries(continentAgg).sort((a,b) => b[1]-a[1]).map(([name, count]) => ({ name, count }));

    return { topCountries, topCities, continentBreakdown };
}

// ─── Booking stats ────────────────────────────────────────────────────────────

async function getBookingStats() {
    const [totalSnap, confirmedSnap, pendingSnap, cancelledSnap, last30Snap, revenueSnap] = await Promise.all([
        adminDb.collection("bookings").select().get(),
        adminDb.collection("bookings").where("status","==","confirmed").select().get(),
        adminDb.collection("bookings").where("status","==","pending_payment").select().get(),
        adminDb.collection("bookings").where("status","==","cancelled").select().get(),
        adminDb.collection("bookings").where("createdAt",">=",dateStr(30)).select("totalAmountUSD").get(),
        adminDb.collection("bookings").where("status","in",["confirmed","completed"]).select("totalAmountUSD","depositAmountUSD","remainingPaid").get(),
    ]);
    const revenueCollected = revenueSnap.docs.reduce((s,d) => {
        const b = d.data();
        return s + (b.depositAmountUSD??0) + (b.remainingPaid ? ((b.totalAmountUSD??0)-(b.depositAmountUSD??0)) : 0);
    }, 0);
    const last30Revenue = last30Snap.docs.reduce((s,d) => s + (d.data().totalAmountUSD??0), 0);
    return { total:totalSnap.size, confirmed:confirmedSnap.size, pending:pendingSnap.size, cancelled:cancelledSnap.size, last30:last30Snap.size, revenueCollected:Math.round(revenueCollected), last30Revenue:Math.round(last30Revenue) };
}

async function getUserStats() {
    const [t, l] = await Promise.all([
        adminDb.collection("users").select().get(),
        adminDb.collection("users").where("createdAt",">=",dateStr(30)).select().get(),
    ]);
    return { total:t.size, last30:l.size };
}

async function getTopTours() {
    const snap = await adminDb.collection("bookings").where("status","in",["confirmed","completed","active"]).select("tourId","totalAmountUSD").limit(200).get();
    const map: Record<string, { count:number; revenue:number }> = {};
    snap.docs.forEach(d => {
        const { tourId, totalAmountUSD=0 } = d.data();
        if (!tourId) return;
        if (!map[tourId]) map[tourId] = { count:0, revenue:0 };
        map[tourId].count++; map[tourId].revenue += totalAmountUSD;
    });
    const ranked = Object.entries(map).sort((a,b) => b[1].count-a[1].count).slice(0,6);
    if (!ranked.length) return [];
    const ids = ranked.map(([id])=>id);
    const tourSnap = await adminDb.collection("tours").where("__name__","in",ids).select("title").get();
    const titles: Record<string,string> = {};
    tourSnap.docs.forEach(d => { titles[d.id] = d.data().title??"—"; });
    return ranked.map(([id,s]) => ({ tourId:id, title:titles[id]??"—", bookings:s.count, revenue:Math.round(s.revenue) }));
}

async function getDailyBookings(days=30) {
    const result: { date:string; count:number; revenue:number }[] = [];
    for (let i=days-1; i>=0; i--) result.push({ date:dateStr(i), count:0, revenue:0 });
    const snap = await adminDb.collection("bookings").where("createdAt",">=",dateStr(days)).select("createdAt","totalAmountUSD").get();
    snap.docs.forEach(doc => {
        const c = doc.data().createdAt;
        const d = typeof c==="string" ? c.slice(0,10) : c?.toDate?.()?.toISOString?.()?.slice(0,10);
        const row = result.find(r => r.date===d);
        if (row) { row.count++; row.revenue += doc.data().totalAmountUSD??0; }
    });
    return result;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage() {
    const counters = await getCounters(30);
    const [visitors, geo, topPages, bookings, users, topTours, daily] = await Promise.all([
        getVisitorStats(30),
        getGeoBreakdown(counters),
        getTopPages(counters),
        getBookingStats(),
        getUserStats(),
        getTopTours(),
        getDailyBookings(30),
    ]);

    return (
        <AnalyticsClient
            counters={counters}
            visitors={visitors}
            geo={geo}
            topPages={topPages}
            bookings={bookings}
            users={users}
            topTours={topTours}
            daily={daily}
        />
    );
}