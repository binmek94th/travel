// src/app/admin/analytics/AnalyticsClient.tsx
"use client";

import { useState, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Counter = { date: string; events: Record<string, number> };
type BookingStats = {
    total: number; confirmed: number; pending: number; cancelled: number;
    last30: number; revenueCollected: number; last30Revenue: number;
};
type UserStats = { total: number; last30: number };
type TopTour   = { tourId: string; title: string; bookings: number; revenue: number };
type DailyRow  = { date: string; count: number; revenue: number };

type Props = {
    counters:  Counter[];
    bookings:  BookingStats;
    users:     UserStats;
    topTours:  TopTour[];
    daily:     DailyRow[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) { return n.toLocaleString("en-US"); }
function fmtMoney(n: number) {
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
    return `$${n.toLocaleString()}`;
}
function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month:"short", day:"numeric" });
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data, color = "#1E9DC8", height = 40 }: {
    data: number[]; color?: string; height?: number;
}) {
    if (!data.length) return null;
    const max = Math.max(...data, 1);
    const w   = 120;
    const h   = height;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - (v / max) * (h - 4);
        return `${x},${y}`;
    }).join(" ");

    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow:"visible" }}>
            <defs>
                <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
                    <stop offset="100%" stopColor={color} stopOpacity="0"/>
                </linearGradient>
            </defs>
            <polygon
                points={`0,${h} ${pts} ${w},${h}`}
                fill={`url(#sg-${color.replace("#","")})`}
            />
            <polyline
                points={pts}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

// ─── Bar chart ────────────────────────────────────────────────────────────────

function BarChart({ data, valueKey, labelKey, color = "#1E9DC8", height = 180 }: {
    data: Record<string, string | number>[];
    valueKey: string;
    labelKey: string;
    color?:   string;
    height?:  number;
}) {
    const [hovered, setHovered] = useState<number | null>(null);
    const values = data.map(d => Number(d[valueKey]) || 0);
    const max    = Math.max(...values, 1);

    return (
        <div style={{ display:"flex", alignItems:"flex-end", gap:3, height, paddingBottom:20, position:"relative" }}>
            {data.map((d, i) => {
                const val = values[i];
                const h   = Math.max(2, (val / max) * (height - 20));
                const isH = hovered === i;
                return (
                    <div
                        key={i}
                        style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", cursor:"pointer", position:"relative" }}
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(null)}
                    >
                        {/* Tooltip */}
                        {isH && (
                            <div style={{ position:"absolute", bottom:h + 24, left:"50%", transform:"translateX(-50%)", background:"#0A3D52", color:"#fff", fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:6, whiteSpace:"nowrap", zIndex:10, pointerEvents:"none" }}>
                                {fmtDate(String(d[labelKey]))}: {val}
                            </div>
                        )}
                        {/* Bar */}
                        <div style={{ width:"100%", height:h, borderRadius:"4px 4px 0 0", background:isH ? "#0A6A94" : color, transition:"all 0.15s", opacity:isH?1:0.75 }}/>
                        {/* Label — show every 5th */}
                        <span style={{ fontSize:8, color:"#94A3B8", marginTop:3, transform:"rotate(-30deg)", transformOrigin:"top left", whiteSpace:"nowrap", display:i % 5 === 0 ? "block" : "none" }}>
              {fmtDate(String(d[labelKey]))}
            </span>
                    </div>
                );
            })}
        </div>
    );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, sparkData, color = "#1E9DC8", bg = "bg-white" }: {
    label: string; value: string; sub?: string;
    sparkData?: number[]; color?: string; bg?: string;
}) {
    return (
        <div className={`${bg} rounded-2xl border border-slate-100 px-5 py-4 shadow-sm flex flex-col gap-1`}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
            <p className="text-2xl font-bold text-slate-800" style={{ letterSpacing:"-0.02em" }}>{value}</p>
            {sub && <p className="text-xs text-slate-400">{sub}</p>}
            {sparkData && (
                <div style={{ marginTop:4 }}>
                    <Sparkline data={sparkData} color={color} height={36}/>
                </div>
            )}
        </div>
    );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
    return (
        <div style={{ marginBottom:16 }}>
            <h3 className="text-base font-semibold text-slate-800" style={{ fontFamily:"'Playfair Display',serif" }}>{title}</h3>
            {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AnalyticsClient({ counters, bookings, users, topTours, daily }: Props) {
    const [tab, setTab] = useState<"overview" | "traffic" | "revenue" | "tours">("overview");

    // Aggregate event counters across all days
    const totalEvents = useMemo(() => {
        const agg: Record<string, number> = {};
        counters.forEach(c => {
            Object.entries(c.events).forEach(([k, v]) => {
                agg[k] = (agg[k] ?? 0) + v;
            });
        });
        return agg;
    }, [counters]);

    // Sparklines
    const dailyBookingSparkline = daily.map(d => d.count);
    const dailyRevenueSparkline = daily.map(d => d.revenue);
    const dailyTourViews        = counters.slice().reverse().map(c => c.events["tour_viewed"] ?? 0);
    const dailySignups          = counters.slice().reverse().map(c => c.events["user_signed_up"] ?? 0);

    // Conversion rate
    const conversionRate = bookings.last30 > 0 && (totalEvents["booking_started"] ?? 0) > 0
        ? ((bookings.last30 / (totalEvents["booking_started"] ?? 1)) * 100).toFixed(1)
        : "—";

    const maxBookings = Math.max(...topTours.map(t => t.bookings), 1);

    const TABS = [
        { key:"overview", label:"Overview" },
        { key:"traffic",  label:"Traffic"  },
        { key:"revenue",  label:"Revenue"  },
        { key:"tours",    label:"Tours"    },
    ] as const;

    return (
        <div className="flex flex-col gap-6">

            {/* Page header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="text-2xl font-light text-slate-800" style={{ fontFamily:"'Playfair Display',serif" }}>
                        Analytics
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Last 30 days · auto-refreshes every 60s</p>
                </div>
                <a
                    href={`https://analytics.google.com`}
                    target="_blank" rel="noopener"
                    className="text-xs font-semibold text-cyan-600 border border-cyan-200 hover:border-cyan-400 px-3 py-1.5 rounded-xl transition-colors"
                >
                    Open GA4 ↗
                </a>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === t.key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── OVERVIEW ──────────────────────────────────────────────────────── */}
            {tab === "overview" && (
                <div className="flex flex-col gap-6">

                    {/* Top KPIs */}
                    <div className="grid grid-cols-4 gap-4">
                        <KpiCard
                            label="Total bookings"
                            value={fmt(bookings.total)}
                            sub={`${bookings.last30} in last 30 days`}
                            sparkData={dailyBookingSparkline}
                            color="#1E9DC8"
                        />
                        <KpiCard
                            label="Revenue collected"
                            value={fmtMoney(bookings.revenueCollected)}
                            sub={`${fmtMoney(bookings.last30Revenue)} last 30 days`}
                            sparkData={dailyRevenueSparkline}
                            color="#10B981"
                        />
                        <KpiCard
                            label="Total users"
                            value={fmt(users.total)}
                            sub={`+${users.last30} this month`}
                            sparkData={dailySignups}
                            color="#8B5CF6"
                        />
                        <KpiCard
                            label="Conversion rate"
                            value={conversionRate === "—" ? "—" : `${conversionRate}%`}
                            sub="Started → completed"
                            color="#F59E0B"
                        />
                    </div>

                    {/* Status breakdown */}
                    <div className="grid grid-cols-4 gap-4">
                        {[
                            { label:"Confirmed",      val:bookings.confirmed, color:"text-emerald-600", bg:"bg-emerald-50" },
                            { label:"Pending payment",val:bookings.pending,   color:"text-amber-600",   bg:"bg-amber-50"   },
                            { label:"Cancelled",      val:bookings.cancelled, color:"text-red-500",     bg:"bg-red-50"     },
                            { label:"Tour views",     val:totalEvents["tour_viewed"] ?? 0, color:"text-cyan-600", bg:"bg-cyan-50" },
                        ].map(s => (
                            <div key={s.label} className={`${s.bg} rounded-2xl border border-slate-100 px-5 py-4`}>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{s.label}</p>
                                <p className={`text-3xl font-bold mt-1 ${s.color}`}>{fmt(s.val)}</p>
                            </div>
                        ))}
                    </div>

                    {/* Daily bookings chart */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <SectionHeader title="Daily bookings — last 30 days" sub="New bookings per day"/>
                        <BarChart data={daily} valueKey="count" labelKey="date" color="#1E9DC8"/>
                    </div>

                    {/* Event summary table */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100">
                            <SectionHeader title="Product events (30 days)"/>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="border-b border-slate-100">
                                {["Event","Count","Trend"].map(h => (
                                    <th key={h} className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">{h}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                            {Object.entries(totalEvents)
                                .filter(([k]) => k !== "total")
                                .sort((a, b) => b[1] - a[1])
                                .map(([event, count]) => {
                                    const trend = counters.slice(-7).reduce((s, c) => s + (c.events[event] ?? 0), 0);
                                    return (
                                        <tr key={event} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-5 py-3">
                                                <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">{event}</span>
                                            </td>
                                            <td className="px-5 py-3 font-semibold text-slate-700">{fmt(count)}</td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Sparkline
                                                        data={counters.slice().reverse().map(c => c.events[event] ?? 0)}
                                                        color="#1E9DC8" height={24}
                                                    />
                                                    <span className="text-xs text-slate-400">{trend} last 7d</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            {Object.keys(totalEvents).length === 0 && (
                                <tr><td colSpan={3} className="px-5 py-12 text-center text-sm text-slate-400">
                                    No events tracked yet. Add <code className="text-xs bg-slate-100 px-1 rounded">track()</code> calls to your pages.
                                </td></tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── TRAFFIC ───────────────────────────────────────────────────────── */}
            {tab === "traffic" && (
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label:"Tour views",        val:totalEvents["tour_viewed"]        ?? 0, color:"text-cyan-600",   bg:"bg-cyan-50"   },
                            { label:"Destination views",  val:totalEvents["destination_viewed"] ?? 0, color:"text-teal-600",   bg:"bg-teal-50"   },
                            { label:"Guide views",        val:totalEvents["guide_viewed"]       ?? 0, color:"text-violet-600", bg:"bg-violet-50" },
                        ].map(s => (
                            <div key={s.label} className={`${s.bg} rounded-2xl border border-slate-100 px-5 py-4`}>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{s.label}</p>
                                <p className={`text-3xl font-bold mt-1 ${s.color}`}>{fmt(s.val)}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <SectionHeader title="Tour views — last 30 days"/>
                        <BarChart data={counters.slice().reverse().map((c, i) => ({ date:c.date, views:c.events["tour_viewed"] ?? 0 }))} valueKey="views" labelKey="date" color="#0A6A94"/>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <SectionHeader title="New sign-ups — last 30 days"/>
                        <BarChart data={counters.slice().reverse().map(c => ({ date:c.date, signups:c.events["user_signed_up"] ?? 0 }))} valueKey="signups" labelKey="date" color="#8B5CF6"/>
                    </div>

                    {/* External analytics links */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 flex items-start justify-between gap-6">
                        <div>
                            <p className="text-sm font-semibold text-white mb-1">Full traffic analytics</p>
                            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                                Detailed page views, sessions, bounce rate, traffic sources, and geographic data are available in Google Analytics 4 and Plausible.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                            <a href="https://analytics.google.com" target="_blank" rel="noopener"
                               className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
                                Open Google Analytics
                            </a>
                            <a href="https://plausible.io" target="_blank" rel="noopener"
                               className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm font-semibold text-white transition-colors">
                                Open Plausible
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* ── REVENUE ───────────────────────────────────────────────────────── */}
            {tab === "revenue" && (
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-3 gap-4">
                        <KpiCard label="Revenue collected"  value={fmtMoney(bookings.revenueCollected)} sub="All confirmed bookings" color="#10B981"/>
                        <KpiCard label="Last 30 days"       value={fmtMoney(bookings.last30Revenue)}    sub={`${bookings.last30} bookings`} color="#1E9DC8"/>
                        <KpiCard label="Avg booking value"  value={bookings.total > 0 ? fmtMoney(Math.round(bookings.revenueCollected / bookings.confirmed || 0)) : "—"} sub="Per confirmed booking" color="#F59E0B"/>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <SectionHeader title="Daily booking value — last 30 days" sub="Total USD value of new bookings per day"/>
                        <BarChart data={daily} valueKey="revenue" labelKey="date" color="#10B981"/>
                    </div>

                    {/* Revenue by tour */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100">
                            <SectionHeader title="Revenue by tour"/>
                        </div>
                        <div className="p-5 flex flex-col gap-3">
                            {topTours.map((t, i) => (
                                <div key={t.tourId}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-slate-700 truncate max-w-[280px]">{t.title}</span>
                                        <span className="text-sm font-bold text-emerald-600 ml-2 flex-shrink-0">{fmtMoney(t.revenue)}</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
                                             style={{ width:`${(t.revenue / (topTours[0]?.revenue || 1)) * 100}%` }}/>
                                    </div>
                                </div>
                            ))}
                            {topTours.length === 0 && <p className="text-sm text-slate-400 text-center py-6">No revenue data yet</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* ── TOURS ─────────────────────────────────────────────────────────── */}
            {tab === "tours" && (
                <div className="flex flex-col gap-6">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <SectionHeader title="Top tours by bookings"/>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="border-b border-slate-100">
                                {["#","Tour","Bookings","Revenue","Share"].map(h => (
                                    <th key={h} className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">{h}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                            {topTours.map((t, i) => (
                                <tr key={t.tourId} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                                    </td>
                                    <td className="px-5 py-3.5 font-medium text-slate-700 max-w-[200px] truncate">{t.title}</td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-700">{t.bookings}</span>
                                            <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-cyan-500 rounded-full" style={{ width:`${(t.bookings / maxBookings) * 100}%` }}/>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 font-semibold text-emerald-600">{fmtMoney(t.revenue)}</td>
                                    <td className="px-5 py-3.5 text-slate-400 text-xs">
                                        {bookings.confirmed > 0 ? `${((t.bookings / bookings.confirmed) * 100).toFixed(1)}%` : "—"}
                                    </td>
                                </tr>
                            ))}
                            {topTours.length === 0 && (
                                <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-400">No booking data yet</td></tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}