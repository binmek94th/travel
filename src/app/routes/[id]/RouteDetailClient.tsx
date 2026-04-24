// src/app/routes/[id]/RouteDetailClient.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import DestinationRouteMap from "../DestinationRouteMap";

type Stop        = { destinationId: string; days: number; notes: string };
type Route       = { id: string; name: string; description: string; stops: Stop[]; totalDays: number; status: string; recommendedTourIds: string[] };
type Destination = { id: string; name: string; images?: string[]; region?: string; latitude?: number | null; longitude?: number | null };
type Tour        = { id: string; title: string; priceUSD?: number | null; durationDays?: number | null; images?: string[] };

export default function RouteDetailClient({ route, destinations, recommendedTours }: {
    route: Route; destinations: Destination[]; recommendedTours: Tour[];
}) {
    const router = useRouter();

    const stopsWithDest = route.stops.map((s, i) => ({
        ...s, dest: destinations.find(d => d.id === s.destinationId), idx: i,
    }));

    const cumulativeDays = stopsWithDest.reduce<number[]>((acc, s, i) => {
        acc.push((acc[i - 1] ?? 0) + s.days);
        return acc;
    }, []);

    const coverImage = stopsWithDest.find(s => s.dest?.images?.[0])?.dest?.images?.[0];

    return (
        <div className="min-h-screen bg-white" style={{ paddingTop: 64 }}>

            {/* ── HERO ── */}
            <div className="relative h-[45vh] min-h-[320px] overflow-hidden bg-gradient-to-br from-[#EBF8FF] to-[#D6F0FA]">
                {coverImage ? (
                    <img src={coverImage} alt={route.name} className="absolute inset-0 w-full h-full object-cover"/>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-10">🗺</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-[rgba(6,30,50,0.25)] via-transparent to-[rgba(6,30,50,0.75)]"/>

                {/* Back button */}
                <button onClick={() => router.back()}
                        className="absolute left-6 top-6 flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/30">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M9 2L4 7l5 5"/>
                    </svg>
                    Back to routes
                </button>

                {/* Hero content */}
                <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 md:px-16">
                    <div className="mx-auto max-w-6xl">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="rounded-full bg-white/15 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                Route
              </span>
                            {route.status === "draft" && (
                                <span className="rounded-full bg-amber-400/90 px-3 py-0.5 text-xs font-bold text-white">Draft</span>
                            )}
                        </div>
                        <h1 className="text-4xl font-bold text-white md:text-5xl mb-3"
                            style={{ fontFamily:"'Playfair Display',serif", letterSpacing:"-0.025em" }}>
                            {route.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
              <span className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="7" cy="7" r="5.5"/><path d="M7 4v3l2 2"/>
                </svg>
                  {route.totalDays} days total
              </span>
                            <span className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M7 1C4.79 1 3 2.79 3 5c0 3.18 4 8 4 8s4-4.82 4-8c0-2.21-1.79-4-4-4z"/><circle cx="7" cy="5" r="1.2"/>
                </svg>
                                {route.stops.length} stops
              </span>
                            {recommendedTours.length > 0 && (
                                <span className="flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <circle cx="7" cy="7" r="5.5"/><path d="M7 4v3l2 2"/>
                  </svg>
                                    {recommendedTours.length} tour{recommendedTours.length !== 1 ? "s" : ""}
                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── BODY ── */}
            <div className="mx-auto max-w-6xl px-6 py-12">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">

                    {/* ── LEFT: main content ── */}
                    <div className="lg:col-span-2 flex flex-col gap-10">

                        {/* Description */}
                        {route.description && (
                            <section>
                                <h2 className="mb-3 text-2xl font-semibold text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif" }}>
                                    About this route
                                </h2>
                                <p className="text-base font-light leading-relaxed text-[#1A6A8A] whitespace-pre-line">
                                    {route.description}
                                </p>
                            </section>
                        )}

                        {/* Map */}
                        <DestinationRouteMap
                            stops={route.stops}
                            destinations={destinations}
                            routeName={route.name}
                        />

                        {/* Itinerary */}
                        <section>
                            <h2 className="mb-5 text-2xl font-semibold text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif" }}>
                                Itinerary
                            </h2>
                            <div className="flex flex-col gap-0">
                                {stopsWithDest.map((s, i) => {
                                    const isFirst  = i === 0;
                                    const isLast   = i === stopsWithDest.length - 1;
                                    const dotColor = isFirst ? "#10B981" : isLast ? "#EF4444" : "#1E9DC8";
                                    const dayStart = (cumulativeDays[i - 1] ?? 0) + 1;
                                    const dayEnd   = cumulativeDays[i];
                                    const coverImg = s.dest?.images?.[0];

                                    return (
                                        <div key={i} className="flex gap-4">
                                            {/* Spine */}
                                            <div className="flex flex-col items-center flex-shrink-0" style={{ width: 32 }}>
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold bg-white"
                                                     style={{ borderColor: dotColor, color: dotColor, flexShrink: 0 }}>
                                                    {i + 1}
                                                </div>
                                                {!isLast && (
                                                    <div className="w-0.5 flex-1 min-h-[2.5rem]" style={{ background: "rgba(14,133,178,0.15)", marginTop: 4 }}/>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 pb-6">
                                                <div className="flex items-start gap-4">
                                                    {coverImg && (
                                                        <div className="h-16 w-24 flex-shrink-0 rounded-xl overflow-hidden shadow-sm">
                                                            <img src={coverImg} alt={s.dest?.name} className="w-full h-full object-cover"/>
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                                            <p className="text-base font-bold text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif" }}>
                                                                {s.dest?.name ?? s.destinationId}
                                                            </p>
                                                            {s.dest?.region && (
                                                                <span className="text-[0.65rem] text-[#1A6A8A] bg-[#F0F9FF] px-2 py-0.5 rounded-full border border-[rgba(14,133,178,0.12)]">
                                  {s.dest.region}
                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 mb-1.5">
                              <span className="text-sm font-bold text-[#1E9DC8]">
                                Day{dayStart === dayEnd ? ` ${dayStart}` : `s ${dayStart}–${dayEnd}`}
                              </span>
                                                            <span className="text-sm text-[#1A6A8A]">
                                {s.days} night{s.days !== 1 ? "s" : ""}
                              </span>
                                                        </div>
                                                        {s.notes && (
                                                            <p className="text-sm text-[#1A6A8A] leading-relaxed">{s.notes}</p>
                                                        )}
                                                        {s.dest && (
                                                            <Link href={`/destinations/${s.dest.id}`}
                                                                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-[#1E9DC8] hover:underline">
                                                                Explore destination
                                                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                    <path d="M2 6h8M6 2l4 4-4 4"/>
                                                                </svg>
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Recommended tours */}
                        {recommendedTours.length > 0 && (
                            <section>
                                <h2 className="mb-4 text-2xl font-semibold text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif" }}>
                                    Recommended tours
                                </h2>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {recommendedTours.map(t => (
                                        <Link key={t.id} href={`/tours/${t.id}`}
                                              className="flex items-center gap-3 rounded-xl border border-[rgba(14,133,178,0.12)] bg-white p-3 no-underline transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(14,133,178,0.12)]">
                                            <div className="h-14 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-[#EBF8FF] to-[#D6F0FA]">
                                                {t.images?.[0]
                                                    ? <img src={t.images[0]} alt={t.title} className="w-full h-full object-cover"/>
                                                    : <div className="w-full h-full flex items-center justify-center text-2xl">🧭</div>
                                                }
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-[#0A3D52] line-clamp-2 leading-snug" style={{ fontFamily:"'Playfair Display',serif" }}>
                                                    {t.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {t.durationDays && <span className="text-xs text-[#1A6A8A]">{t.durationDays}d</span>}
                                                    {t.priceUSD && <span className="text-xs font-bold text-[#1E9DC8]">${t.priceUSD.toLocaleString()}</span>}
                                                </div>
                                            </div>
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#1E9DC8" strokeWidth="2" strokeLinecap="round">
                                                <path d="M2 7h10M8 3l4 4-4 4"/>
                                            </svg>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* ── RIGHT: sidebar ── */}
                    <div className="flex flex-col gap-5">

                        {/* Quick facts */}
                        <div className="rounded-2xl border border-[rgba(14,133,178,0.12)] bg-white p-5 shadow-[0_4px_24px_rgba(14,133,178,0.07)]">
                            <h3 className="mb-4 text-lg font-semibold text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif" }}>
                                Route overview
                            </h3>
                            <div className="flex flex-col gap-3">
                                {[
                                    { label: "Total duration",  value: `${route.totalDays} days` },
                                    { label: "Total stops",     value: `${route.stops.length} destinations` },
                                    ...(recommendedTours.length > 0 ? [{ label: "Suggested tours", value: `${recommendedTours.length} available` }] : []),
                                    { label: "Start",           value: stopsWithDest[0]?.dest?.name ?? "—" },
                                    { label: "End",             value: stopsWithDest[stopsWithDest.length - 1]?.dest?.name ?? "—" },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex items-center justify-between border-b border-[#EBF8FF] pb-3 last:border-0 last:pb-0">
                                        <span className="text-sm text-[#1A6A8A]">{label}</span>
                                        <span className="text-sm font-semibold text-[#0A3D52]">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="rounded-2xl bg-gradient-to-br from-[#0A3D52] to-[#0E85B2] p-5 text-white">
                            <h3 className="mb-2 text-lg font-semibold" style={{ fontFamily:"'Playfair Display',serif" }}>
                                Ready to follow this route?
                            </h3>
                            <p className="mb-4 text-sm font-light leading-relaxed text-white/80">
                                Book a guided tour or plan your own itinerary with our AI planner.
                            </p>
                            {recommendedTours[0] ? (
                                <Link href={`/tours/${recommendedTours[0].id}`}
                                      className="mb-2 flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#0A3D52] transition-all hover:bg-[#EBF8FF]">
                                    Book a tour
                                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <path d="M2 6.5h9M7 3l3.5 3.5L7 10"/>
                                    </svg>
                                </Link>
                            ) : (
                                <Link href="/tours"
                                      className="mb-2 flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#0A3D52] transition-all hover:bg-[#EBF8FF]">
                                    Browse tours
                                </Link>
                            )}
                            <Link href="/ai-planner"
                                  className="flex items-center justify-center gap-2 rounded-xl border border-white/25 px-4 py-2.5 text-sm font-medium text-white/90 transition-all hover:bg-white/10">
                                🤖 AI journey planner
                            </Link>
                        </div>

                        {/* All routes link */}
                        <Link href="/routes"
                              className="flex items-center justify-center gap-2 rounded-xl border border-[rgba(14,133,178,0.18)] bg-white px-4 py-3 text-sm font-medium text-[#1A6A8A] transition-all hover:bg-[#EBF8FF] hover:text-[#0A3D52]">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                <path d="M9 2L4 7l5 5"/>
                            </svg>
                            All routes
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}