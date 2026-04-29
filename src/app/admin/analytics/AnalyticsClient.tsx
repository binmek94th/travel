// src/app/admin/analytics/AnalyticsClient.tsx
"use client";

import { useState, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Counter = {
    date: string;
    events: Record<string, number>;
    pageViews: Record<string, unknown>;
    countries: Record<string, number>;
    continents: Record<string, number>;
    cities: Record<string, number>;
};

type VisitorStats = {
    totalVisitors: number;
    last7Visitors: number;
    todayVisitors: number;
    sparkline:     number[];
    daily:         { date: string; visitors: number }[];
};

type GeoData = {
    topCountries:       { code: string; count: number }[];
    topCities:          { city: string; countryCode: string; count: number }[];
    continentBreakdown: { name: string; count: number }[];
};

type BookingStats = {
    total: number; confirmed: number; pending: number; cancelled: number;
    last30: number; revenueCollected: number; last30Revenue: number;
};

type TopTour  = { tourId: string; title: string; bookings: number; revenue: number };
type DailyRow = { date: string; count: number; revenue: number };
type TopPage  = { path: string; count: number };

type Props = {
    counters:  Counter[];
    visitors:  VisitorStats;
    geo:       GeoData;
    topPages:  TopPage[];
    bookings:  BookingStats;
    users:     UserStats;
    topTours:  TopTour[];
    daily:     DailyRow[];
};

type UserStats = { total: number; last30: number };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COUNTRY_NAMES: Record<string, string> = {
    ET:"Ethiopia", US:"United States", GB:"United Kingdom", DE:"Germany",
    FR:"France", CN:"China", IN:"India", AU:"Australia", CA:"Canada",
    JP:"Japan", KE:"Kenya", NG:"Nigeria", ZA:"South Africa", AE:"UAE",
    IT:"Italy", ES:"Spain", NL:"Netherlands", SE:"Sweden", BR:"Brazil",
    MX:"Mexico", AR:"Argentina", RU:"Russia", KR:"South Korea", SG:"Singapore",
    TH:"Thailand", EG:"Egypt", GH:"Ghana", TZ:"Tanzania", UG:"Uganda",
    XX:"Unknown", LC:"Local / Dev",
};
const CONTINENT_EMOJI: Record<string, string> = {
    "Africa":"🌍","Europe":"🌍","Asia":"🌏","North America":"🌎","South America":"🌎","Oceania":"🌏","Unknown":"🌐",
};

function flag(code: string): string {
    if (!code || code.length !== 2 || code === "XX" || code === "LC") return "🌐";
    return String.fromCodePoint(...code.toUpperCase().split("").map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
}
function countryName(code: string) { return COUNTRY_NAMES[code] ?? code; }
function fmt(n: number) { return n.toLocaleString("en-US"); }
function fmtMoney(n: number) { return n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${n.toLocaleString()}`; }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString("en-US", { month:"short", day:"numeric" }); }
function pct(v: number, total: number) { return total > 0 ? `${((v/total)*100).toFixed(1)}%` : "—"; }

// ─── Sub-components ───────────────────────────────────────────────────────────

function Sparkline({ data, color="#1E9DC8", height=40 }: { data:number[]; color?:string; height?:number }) {
    if (!data.length) return null;
    const max = Math.max(...data, 1), w=120, h=height;
    const pts = data.map((v,i) => `${(i/(data.length-1))*w},${h-(v/max)*(h-4)}`).join(" ");
    const gid = `sg${color.replace("#","")}`;
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{overflow:"visible"}}>
            <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
                <stop offset="100%" stopColor={color} stopOpacity="0"/>
            </linearGradient></defs>
            <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${gid})`}/>
            <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

function BarChart({ data, valueKey, labelKey, color="#1E9DC8", height=180 }: {
    data:Record<string,string|number>[]; valueKey:string; labelKey:string; color?:string; height?:number;
}) {
    const [hov, setHov] = useState<number|null>(null);
    const vals = data.map(d => Number(d[valueKey])||0);
    const max  = Math.max(...vals, 1);
    return (
        <div style={{display:"flex",alignItems:"flex-end",gap:3,height,paddingBottom:20,position:"relative"}}>
            {data.map((d,i) => {
                const v=vals[i], h=Math.max(2,(v/max)*(height-20)), isH=hov===i;
                return (
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",cursor:"pointer",position:"relative"}}
                         onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}>
                        {isH&&<div style={{position:"absolute",bottom:h+24,left:"50%",transform:"translateX(-50%)",background:"#0A3D52",color:"#fff",fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:6,whiteSpace:"nowrap",zIndex:10,pointerEvents:"none"}}>{fmtDate(String(d[labelKey]))}: {fmt(v)}</div>}
                        <div style={{width:"100%",height:h,borderRadius:"4px 4px 0 0",background:isH?"#0A6A94":color,transition:"all 0.15s",opacity:isH?1:0.75}}/>
                        <span style={{fontSize:8,color:"#94A3B8",marginTop:3,transform:"rotate(-30deg)",transformOrigin:"top left",whiteSpace:"nowrap",display:i%5===0?"block":"none"}}>{fmtDate(String(d[labelKey]))}</span>
                    </div>
                );
            })}
        </div>
    );
}

function HBar({ label, value, max, color="#1E9DC8", sub }: { label:string; value:number; max:number; color?:string; sub?:string }) {
    return (
        <div style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <span style={{fontSize:"0.82rem",color:"#0A3D52",fontWeight:500}}>{label}</span>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                    {sub&&<span style={{fontSize:"0.72rem",color:"#94A3B8"}}>{sub}</span>}
                    <span style={{fontSize:"0.82rem",fontWeight:700,color:"#0A3D52"}}>{fmt(value)}</span>
                </div>
            </div>
            <div style={{height:7,background:"#F1F5F9",borderRadius:20,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${max>0?(value/max)*100:0}%`,background:`linear-gradient(90deg,${color},${color}cc)`,borderRadius:20,transition:"width 0.5s ease"}}/>
            </div>
        </div>
    );
}

function KpiCard({ label, value, sub, sparkData, color="#1E9DC8", accent }: {
    label:string; value:string; sub?:string; sparkData?:number[]; color?:string; accent?:boolean;
}) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4 shadow-sm flex flex-col gap-1">
            {accent && <div className="w-8 h-1 rounded-full mb-1" style={{background:color}}/>}
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
            <p className="text-2xl font-bold text-slate-800" style={{letterSpacing:"-0.02em"}}>{value}</p>
            {sub && <p className="text-xs text-slate-400">{sub}</p>}
            {sparkData && <div style={{marginTop:4}}><Sparkline data={sparkData} color={color} height={36}/></div>}
        </div>
    );
}

function SectionHeader({ title, sub }: { title:string; sub?:string }) {
    return (
        <div style={{marginBottom:16}}>
            <h3 className="text-base font-semibold text-slate-800" style={{fontFamily:"'Playfair Display',serif"}}>{title}</h3>
            {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
    );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
    { key:"overview",  label:"Overview"   },
    { key:"visitors",  label:"Visitors"   },
    { key:"geo",       label:"Geography"  },
    { key:"traffic",   label:"Traffic"    },
    { key:"revenue",   label:"Revenue"    },
    { key:"tours",     label:"Tours"      },
] as const;
type Tab = typeof TABS[number]["key"];

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AnalyticsClient({ counters, visitors, geo, topPages, bookings, users, topTours, daily }: Props) {
    const [tab, setTab] = useState<Tab>("overview");

    const totalEvents = useMemo(() => {
        const agg: Record<string, number> = {};
        counters.forEach(c => Object.entries(c.events).forEach(([k,v]) => { agg[k]=(agg[k]??0)+v; }));
        return agg;
    }, [counters]);

    const totalPageViews = totalEvents["page_view"] ?? 0;
    const conversionRate = bookings.last30 > 0 && (totalEvents["booking_started"]??0) > 0
        ? `${((bookings.last30/(totalEvents["booking_started"]??1))*100).toFixed(1)}%` : "—";

    const geoTotal    = geo.topCountries.reduce((s,c)=>s+c.count,0);
    const maxCountry  = geo.topCountries[0]?.count  ?? 1;
    const maxCity     = geo.topCities[0]?.count     ?? 1;
    const maxContinent= geo.continentBreakdown[0]?.count ?? 1;
    const maxPage     = topPages[0]?.count          ?? 1;

    // Daily visitor sparkline
    const visitorSparkline    = visitors.daily.map(d => d.visitors);
    const dailyBookingSparkline = daily.map(d => d.count);
    const dailyRevenueSparkline = daily.map(d => d.revenue);

    return (
        <div className="flex flex-col gap-6">

            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="text-2xl font-light text-slate-800" style={{fontFamily:"'Playfair Display',serif"}}>Analytics</h2>
                    <p className="text-sm text-slate-500 mt-1">Last 30 days · refreshes every 60s</p>
                </div>
                <a href="https://analytics.google.com" target="_blank" rel="noopener"
                   className="text-xs font-semibold text-cyan-600 border border-cyan-200 hover:border-cyan-400 px-3 py-1.5 rounded-xl transition-colors">
                    Open GA4 ↗
                </a>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
                {TABS.map(t => (
                    <button key={t.key} onClick={()=>setTab(t.key)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab===t.key?"bg-white text-slate-800 shadow-sm":"text-slate-500 hover:text-slate-700"}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
            {tab === "overview" && (
                <div className="flex flex-col gap-6">

                    {/* Top 6 KPIs */}
                    <div className="grid grid-cols-3 gap-4">
                        <KpiCard label="Page views (30d)"    value={fmt(totalPageViews)}              sub={`${fmt(visitors.todayVisitors)} today`}      sparkData={counters.slice().reverse().map(c=>c.events["page_view"]??0)}  color="#0A6A94" accent/>
                        <KpiCard label="Unique visitors (30d)"value={fmt(visitors.totalVisitors)}      sub={`${fmt(visitors.last7Visitors)} last 7 days`} sparkData={visitorSparkline}  color="#28B8E8" accent/>
                        <KpiCard label="Total bookings"       value={fmt(bookings.total)}              sub={`${bookings.last30} in last 30d`}             sparkData={dailyBookingSparkline} color="#10B981" accent/>
                        <KpiCard label="Revenue collected"    value={fmtMoney(bookings.revenueCollected)} sub={`${fmtMoney(bookings.last30Revenue)} last 30d`} sparkData={dailyRevenueSparkline} color="#059669" accent/>
                        <KpiCard label="Registered users"     value={fmt(users.total)}                sub={`+${users.last30} this month`}               color="#8B5CF6" accent/>
                        <KpiCard label="Conversion"           value={conversionRate}                  sub="Started → completed booking"                 color="#F59E0B" accent/>
                    </div>

                    {/* Status strip */}
                    <div className="grid grid-cols-4 gap-4">
                        {[
                            { label:"Confirmed",       val:bookings.confirmed, color:"text-emerald-600", bg:"bg-emerald-50" },
                            { label:"Pending payment", val:bookings.pending,   color:"text-amber-600",   bg:"bg-amber-50"   },
                            { label:"Cancelled",       val:bookings.cancelled, color:"text-red-500",     bg:"bg-red-50"     },
                            { label:"Tour views",      val:totalEvents["tour_viewed"]??0, color:"text-cyan-600", bg:"bg-cyan-50" },
                        ].map(s => (
                            <div key={s.label} className={`${s.bg} rounded-2xl border border-slate-100 px-5 py-4`}>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{s.label}</p>
                                <p className={`text-3xl font-bold mt-1 ${s.color}`}>{fmt(s.val)}</p>
                            </div>
                        ))}
                    </div>

                    {/* Daily bookings chart */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <SectionHeader title="Daily bookings — last 30 days"/>
                        <BarChart data={daily} valueKey="count" labelKey="date" color="#1E9DC8"/>
                    </div>
                </div>
            )}

            {/* ── VISITORS ─────────────────────────────────────────────────────── */}
            {tab === "visitors" && (
                <div className="flex flex-col gap-5">

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4">
                        {[
                            { label:"Total visitors (30d)", val:fmt(visitors.totalVisitors),  color:"text-cyan-700",  bg:"bg-cyan-50"  },
                            { label:"Last 7 days",          val:fmt(visitors.last7Visitors),  color:"text-blue-600",  bg:"bg-blue-50"  },
                            { label:"Today",                val:fmt(visitors.todayVisitors),  color:"text-indigo-600",bg:"bg-indigo-50"},
                            { label:"Page views (30d)",     val:fmt(totalPageViews),          color:"text-slate-700", bg:"bg-slate-50" },
                        ].map(s => (
                            <div key={s.label} className={`${s.bg} rounded-2xl border border-slate-100 px-5 py-4`}>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{s.label}</p>
                                <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.val}</p>
                            </div>
                        ))}
                    </div>

                    {/* Daily visitor chart */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <SectionHeader title="Daily unique visitors — last 30 days" sub="One visitor = one session (browser tab)"/>
                        <BarChart data={visitors.daily} valueKey="visitors" labelKey="date" color="#28B8E8"/>
                    </div>

                    {/* Page views chart */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <SectionHeader title="Daily page views — last 30 days"/>
                        <BarChart data={counters.slice().reverse().map(c=>({date:c.date, views:c.events["page_view"]??0}))} valueKey="views" labelKey="date" color="#0A6A94"/>
                    </div>

                    {/* Top pages */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100">
                            <SectionHeader title="Top pages — last 30 days" sub="By page view count"/>
                        </div>
                        <div className="p-5">
                            {topPages.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-6">No page view data yet. Make sure PageTracker is mounted in ClientProviders.</p>
                            ) : topPages.map((p, i) => (
                                <HBar key={p.path} label={p.path === "/" ? "/ (Home)" : p.path} value={p.count} max={maxPage}
                                      sub={pct(p.count, totalPageViews)} color={i === 0 ? "#0A6A94" : "#28B8E8"}/>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── GEO ──────────────────────────────────────────────────────────── */}
            {tab === "geo" && (
                <div className="flex flex-col gap-5">
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label:"Countries reached", val:geo.topCountries.filter(c=>c.code!=="XX"&&c.code!=="LC").length, color:"text-cyan-600",   bg:"bg-cyan-50"   },
                            { label:"Total events",      val:geoTotal,                                                          color:"text-slate-800", bg:"bg-slate-50"  },
                            { label:"Top country",       val:geo.topCountries[0] ? `${flag(geo.topCountries[0].code)} ${countryName(geo.topCountries[0].code)}` : "—", color:"text-emerald-600", bg:"bg-emerald-50" },
                        ].map(s => (
                            <div key={s.label} className={`${s.bg} rounded-2xl border border-slate-100 px-5 py-4`}>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{s.label}</p>
                                <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.val}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                            <SectionHeader title="Top countries" sub="Last 30 days"/>
                            {geo.topCountries.length === 0 ? <p className="text-sm text-slate-400 text-center py-8">No geo data yet</p> :
                                geo.topCountries.map((c,i) => <HBar key={c.code} label={`${flag(c.code)} ${countryName(c.code)}`} value={c.count} max={maxCountry} sub={pct(c.count,geoTotal)} color={i===0?"#0A6A94":"#28B8E8"}/>)
                            }
                        </div>
                        <div className="flex flex-col gap-5">
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                <SectionHeader title="By continent"/>
                                {geo.continentBreakdown.map(c => <HBar key={c.name} label={`${CONTINENT_EMOJI[c.name]??"🌐"} ${c.name}`} value={c.count} max={maxContinent} sub={pct(c.count,geoTotal)} color="#8B5CF6"/>)}
                            </div>
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                <SectionHeader title="Top cities"/>
                                {geo.topCities.map((c,i) => <HBar key={i} label={`${flag(c.countryCode)} ${c.city}`} value={c.count} max={maxCity} sub={pct(c.count,geoTotal)} color="#10B981"/>)}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100"><SectionHeader title="Country detail"/></div>
                        <table className="w-full text-sm">
                            <thead><tr className="border-b border-slate-100">
                                {["#","Country","Events","Share","Trend"].map(h => <th key={h} className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">{h}</th>)}
                            </tr></thead>
                            <tbody className="divide-y divide-slate-50">
                            {geo.topCountries.map((c,i) => {
                                const trend = counters.slice(-7).reduce((s,day)=>s+(day.countries[c.code]??0),0);
                                return (
                                    <tr key={c.code} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-5 py-3"><span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center">{i+1}</span></td>
                                        <td className="px-5 py-3"><span className="flex items-center gap-2"><span className="text-lg">{flag(c.code)}</span><span className="font-medium text-slate-700">{countryName(c.code)}</span><span className="text-xs text-slate-400 font-mono">{c.code}</span></span></td>
                                        <td className="px-5 py-3 font-bold text-slate-700">{fmt(c.count)}</td>
                                        <td className="px-5 py-3"><div className="flex items-center gap-2"><div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-cyan-500 rounded-full" style={{width:`${(c.count/maxCountry)*100}%`}}/></div><span className="text-xs text-slate-400">{pct(c.count,geoTotal)}</span></div></td>
                                        <td className="px-5 py-3 text-xs text-slate-400">{trend} last 7d</td>
                                    </tr>
                                );
                            })}
                            {geo.topCountries.length===0&&<tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-400">No geographic data yet</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── TRAFFIC ──────────────────────────────────────────────────────── */}
            {tab === "traffic" && (
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label:"Tour views",       val:totalEvents["tour_viewed"]??0,        color:"text-cyan-600",   bg:"bg-cyan-50"   },
                            { label:"Destination views", val:totalEvents["destination_viewed"]??0, color:"text-teal-600",   bg:"bg-teal-50"   },
                            { label:"Guide views",       val:totalEvents["guide_viewed"]??0,       color:"text-violet-600", bg:"bg-violet-50" },
                        ].map(s=>(
                            <div key={s.label} className={`${s.bg} rounded-2xl border border-slate-100 px-5 py-4`}>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{s.label}</p>
                                <p className={`text-3xl font-bold mt-1 ${s.color}`}>{fmt(s.val)}</p>
                            </div>
                        ))}
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <SectionHeader title="Tour views — last 30 days"/>
                        <BarChart data={counters.slice().reverse().map(c=>({date:c.date,views:c.events["tour_viewed"]??0}))} valueKey="views" labelKey="date" color="#0A6A94"/>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <SectionHeader title="Sign-ups — last 30 days"/>
                        <BarChart data={counters.slice().reverse().map(c=>({date:c.date,signups:c.events["user_signed_up"]??0}))} valueKey="signups" labelKey="date" color="#8B5CF6"/>
                    </div>
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 flex items-start justify-between gap-6">
                        <div><p className="text-sm font-semibold text-white mb-1">Full traffic analytics</p><p className="text-xs text-slate-400 leading-relaxed max-w-sm">Sessions, bounce rate, and traffic sources in GA4 and Plausible.</p></div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                            <a href="https://analytics.google.com" target="_blank" rel="noopener" className="px-4 py-2 bg-white rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors">Open Google Analytics</a>
                            <a href="https://plausible.io" target="_blank" rel="noopener" className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm font-semibold text-white transition-colors">Open Plausible</a>
                        </div>
                    </div>
                </div>
            )}

            {/* ── REVENUE ──────────────────────────────────────────────────────── */}
            {tab === "revenue" && (
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-3 gap-4">
                        <KpiCard label="Revenue collected"  value={fmtMoney(bookings.revenueCollected)} sub="All confirmed bookings" color="#10B981"/>
                        <KpiCard label="Last 30 days"       value={fmtMoney(bookings.last30Revenue)}    sub={`${bookings.last30} bookings`} color="#1E9DC8"/>
                        <KpiCard label="Avg booking value"  value={bookings.confirmed>0?fmtMoney(Math.round(bookings.revenueCollected/bookings.confirmed)):"—"} sub="Per confirmed booking" color="#F59E0B"/>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <SectionHeader title="Daily booking value — last 30 days"/>
                        <BarChart data={daily} valueKey="revenue" labelKey="date" color="#10B981"/>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100"><SectionHeader title="Revenue by tour"/></div>
                        <div className="p-5 flex flex-col gap-3">
                            {topTours.map(t=>(
                                <div key={t.tourId}>
                                    <div className="flex items-center justify-between mb-1"><span className="text-sm font-medium text-slate-700 truncate max-w-[280px]">{t.title}</span><span className="text-sm font-bold text-emerald-600 ml-2 flex-shrink-0">{fmtMoney(t.revenue)}</span></div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" style={{width:`${(t.revenue/(topTours[0]?.revenue||1))*100}%`}}/></div>
                                </div>
                            ))}
                            {topTours.length===0&&<p className="text-sm text-slate-400 text-center py-6">No revenue data yet</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* ── TOURS ────────────────────────────────────────────────────────── */}
            {tab === "tours" && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100"><SectionHeader title="Top tours by bookings"/></div>
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-slate-100">
                            {["#","Tour","Bookings","Revenue","Share"].map(h=><th key={h} className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">{h}</th>)}
                        </tr></thead>
                        <tbody className="divide-y divide-slate-50">
                        {topTours.map((t,i)=>(
                            <tr key={t.tourId} className="hover:bg-slate-50/60 transition-colors">
                                <td className="px-5 py-3.5"><span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center">{i+1}</span></td>
                                <td className="px-5 py-3.5 font-medium text-slate-700 max-w-[200px] truncate">{t.title}</td>
                                <td className="px-5 py-3.5"><div className="flex items-center gap-2"><span className="font-bold text-slate-700">{t.bookings}</span><div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-cyan-500 rounded-full" style={{width:`${(t.bookings/(topTours[0]?.bookings||1))*100}%`}}/></div></div></td>
                                <td className="px-5 py-3.5 font-semibold text-emerald-600">{fmtMoney(t.revenue)}</td>
                                <td className="px-5 py-3.5 text-slate-400 text-xs">{bookings.confirmed>0?`${((t.bookings/bookings.confirmed)*100).toFixed(1)}%`:"—"}</td>
                            </tr>
                        ))}
                        {topTours.length===0&&<tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-400">No booking data yet</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}