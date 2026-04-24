import { adminDb } from "@/src/lib/firebase-admin";
import { fetchCollection, fmtDate } from "@/src/lib/firestore-helpers";
import { StatCard, Card, CardHeader, Badge } from "@/src/components/admin/ui";
import Link from "next/link";
import { CollectionReference, Query } from "firebase-admin/firestore";

export const revalidate = 60;

async function getCount(query: CollectionReference | Query): Promise<number> {
  const snap = await query.select().get();
  return snap.size;
}

async function getDashboardData() {
  const [
    userCount,
    destCount,
    tourCount,
    confirmedBookings,
    pendingBookings,
    recentBookings,
    pendingOperators,
    flaggedReviews,
    pendingTours,
  ] = await Promise.all([
    getCount(adminDb.collection("users")),
    getCount(adminDb.collection("destinations")),
    getCount(adminDb.collection("tours").where("status", "==", "active")),
    getCount(adminDb.collection("bookings").where("status", "==", "confirmed")),
    getCount(adminDb.collection("bookings").where("status", "==", "pending")),
    fetchCollection("bookings", { orderBy: ["createdAt", "desc"], limit: 8 }),
    getCount(adminDb.collection("operators").where("isVerified", "==", false)),
    getCount(adminDb.collection("reviews").where("isFlagged", "==", true)),
    getCount(adminDb.collection("tours").where("status", "==", "pending")),
  ]);

  // Batch-fetch tour titles for the recent bookings
  const tourIds = [...new Set(
      recentBookings.map((b: any) => b.tourId).filter(Boolean) as string[]
  )];

  const tourTitles: Record<string, string> = {};
  if (tourIds.length > 0) {
    // Firestore "in" limit is 30
    for (let i = 0; i < tourIds.length; i += 10) {
      const chunk = tourIds.slice(i, i + 10);
      const snap  = await adminDb
          .collection("tours")
          .where("__name__", "in", chunk)
          .select("title")
          .get();
      snap.docs.forEach(d => { tourTitles[d.id] = d.data().title ?? "—"; });
    }
  }

  return {
    userCount, destCount, tourCount,
    confirmedBookings, pendingBookings,
    recentBookings, tourTitles,
    pendingOperators, flaggedReviews, pendingTours,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
      <div className="flex flex-col gap-6">
        {/* Page header */}
        <div>
          <h2 className="text-2xl font-light text-slate-800" style={{ fontFamily:"'Playfair Display',serif" }}>
            Good morning ✦
          </h2>
          <p className="text-sm text-slate-500 mt-1">Here's what's happening on Tizitaw today.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
              label="Total Users"
              value={data.userCount.toLocaleString()}
              gradient="bg-gradient-to-br from-cyan-500 to-cyan-700"
          />
          <StatCard
              label="Destinations"
              value={data.destCount.toLocaleString()}
              gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
          />
          <StatCard
              label="Active Bookings"
              value={data.confirmedBookings.toLocaleString()}
              delta={`${data.pendingBookings} pending`}
              gradient="bg-gradient-to-br from-amber-500 to-amber-700"
          />
          <StatCard
              label="Active Tours"
              value={data.tourCount.toLocaleString()}
              gradient="bg-gradient-to-br from-violet-500 to-violet-700"
          />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-3 gap-5">
          {/* Recent bookings */}
          <div className="col-span-2">
            <Card>
              <CardHeader title="Recent Bookings" subtitle="Latest reservations across all tours">
                <Link href="/admin/bookings" className="text-xs text-cyan-600 hover:text-cyan-700 font-medium">
                  View all →
                </Link>
              </CardHeader>

              {data.recentBookings.length === 0 ? (
                  <div className="py-12 text-center text-sm text-slate-400">No bookings yet</div>
              ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-2.5">Traveler</th>
                        <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-2.5">Tour</th>
                        <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-2.5">Status</th>
                        <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-2.5">Amount</th>
                        <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-2.5">Date</th>
                      </tr>
                      </thead>
                      <tbody>
                      {data.recentBookings.map((b: any) => (
                          <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 border-b border-slate-50">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                  {(b.userName?.[0] ?? "?").toUpperCase()}
                                </div>
                                <span className="text-sm text-slate-700 truncate max-w-[120px]">
                              {b.userName ?? "—"}
                            </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 border-b border-slate-50">
                              {b.tourId ? (
                                  <Link
                                      href={`/admin/tours?highlight=${b.tourId}`}
                                      className="text-xs text-slate-700 hover:text-cyan-600 transition-colors line-clamp-2 max-w-[160px] block"
                                      title={data.tourTitles[b.tourId]}
                                  >
                                    {data.tourTitles[b.tourId] ?? b.tourId}
                                  </Link>
                              ) : (
                                  <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 border-b border-slate-50">
                              <Badge status={b.status ?? "pending"} />
                            </td>
                            <td className="px-4 py-3 border-b border-slate-50 font-semibold text-slate-700">
                              {b.currency === "ETB" ? "ETB " : "$"}{b.totalAmountUSD ?? b.totalETB ?? "—"}
                            </td>
                            <td className="px-4 py-3 border-b border-slate-50 text-slate-400 text-xs">
                              {fmtDate(b.createdAt)}
                            </td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
              )}
            </Card>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            {/* Quick actions */}
            <Card>
              <CardHeader title="Quick Actions" />
              <div className="p-4 flex flex-col gap-1.5">
                {[
                  { href:"/admin/destinations", label:"Add destination",  emoji:"🗺" },
                  { href:"/admin/tours",        label:"Create tour",      emoji:"🧭" },
                  { href:"/admin/operators",    label:"Verify operator",  emoji:"✅" },
                  { href:"/admin/featured",     label:"Manage featured",  emoji:"⭐" },
                  { href:"/admin/guides",       label:"Publish guide",    emoji:"📖" },
                ].map(a => (
                    <Link
                        key={a.href}
                        href={a.href}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-600
                    hover:bg-cyan-50 hover:text-cyan-700 transition-colors"
                    >
                      <span className="text-base">{a.emoji}</span>
                      {a.label}
                    </Link>
                ))}
              </div>
            </Card>

            {/* Pending items */}
            <Card>
              <CardHeader title="Needs Attention" />
              <div className="p-4 flex flex-col gap-2">
                {[
                  { href:"/admin/operators", label:"Operator applications", count: data.pendingOperators },
                  { href:"/admin/reviews",   label:"Flagged reviews",       count: data.flaggedReviews   },
                  { href:"/admin/tours",     label:"Tour approvals",        count: data.pendingTours     },
                  { href:"/admin/bookings",  label:"Pending bookings",      count: data.pendingBookings  },
                ].map(item => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center justify-between px-3 py-2 rounded-lg text-sm
                    text-slate-600 hover:bg-cyan-50 hover:text-cyan-700 transition-colors"
                    >
                      <span>{item.label}</span>
                      {item.count > 0 ? (
                          <span className="bg-amber-100 text-amber-700 border border-amber-200
                      text-xs font-bold px-2 py-0.5 rounded-full">
                      {item.count}
                    </span>
                      ) : (
                          <span className="text-xs text-slate-300">None</span>
                      )}
                    </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
  );
}