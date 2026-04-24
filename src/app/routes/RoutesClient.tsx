// src/app/routes/RoutesClient.tsx
"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";

type Stop = { destinationId: string; days: number; notes: string };
type Route = {
    id: string; name: string; description: string;
    stops: Stop[]; totalDays: number; status: string;
    recommendedTourIds: string[];
};
type Destination = { id: string; name: string; images?: string[]; region?: string; latitude?: number | null; longitude?: number | null };
type Tour        = { id: string; title: string; priceUSD?: number; durationDays?: number; images?: string[] };

function useReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const [v, setV] = useState(false);
    useEffect(() => {
        const el = ref.current; if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect(); } }, { threshold: 0.06 });
        obs.observe(el); return () => obs.disconnect();
    }, []);
    return { ref, visible: v };
}

function RouteCard({ route, destinations }: { route: Route; destinations: Destination[] }) {
    const { ref, visible } = useReveal();
    const [hovered, setHovered] = useState(false);

    const stopsWithDest = route.stops.map(s => ({
        ...s, dest: destinations.find(d => d.id === s.destinationId),
    }));
    const coverImage = stopsWithDest.find(s => s.dest?.images?.[0])?.dest?.images?.[0];

    return (
        <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)" }}>
            <Link
                href={`/routes/${route.id}`}
                className="rounded-2xl bg-white overflow-hidden block no-underline"
                style={{
                    border:      hovered ? "1px solid rgba(14,133,178,0.30)" : "1px solid rgba(14,133,178,0.10)",
                    boxShadow:   hovered ? "0 20px 48px rgba(14,133,178,0.14)" : "0 2px 10px rgba(14,133,178,0.06)",
                    transform:   hovered ? "translateY(-6px)" : "none",
                    transition:  "all 0.25s cubic-bezier(0.22,1,0.36,1)",
                }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                {/* Cover image */}
                <div className="relative h-44 overflow-hidden bg-gradient-to-br from-[#EBF8FF] to-[#D6F0FA]">
                    {coverImage ? (
                        <img src={coverImage} alt={route.name}
                             className="absolute inset-0 w-full h-full object-cover"
                             style={{ transform: hovered ? "scale(1.06)" : "scale(1)", transition: "transform 0.5s cubic-bezier(0.22,1,0.36,1)" }}
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-20">🗺</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(6,30,50,0.65)]"/>

                    <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-[rgba(6,30,50,0.65)] px-2.5 py-1 backdrop-blur-sm">
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                            <circle cx="6" cy="6" r="4.5"/><path d="M6 3.5V6l1.5 1.5"/>
                        </svg>
                        <span className="text-[0.65rem] font-bold text-white">{route.totalDays} days</span>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-base font-bold text-white leading-tight mb-1.5" style={{ fontFamily: "'Playfair Display',serif" }}>
                            {route.name}
                        </h3>
                        <div className="flex items-center gap-1 overflow-hidden">
                            {stopsWithDest.slice(0, 4).map((s, i) => (
                                <span key={i} className="text-[0.6rem] text-white/80 whitespace-nowrap flex items-center">
                  {i > 0 && <span className="text-white/40 mx-0.5">→</span>}
                                    {s.dest?.name ?? "Unknown"}
                </span>
                            ))}
                            {stopsWithDest.length > 4 && (
                                <span className="text-[0.6rem] text-white/60 ml-1">+{stopsWithDest.length - 4} more</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-4">
                    {route.description && (
                        <p className="text-sm font-light text-[#1A6A8A] leading-relaxed line-clamp-2 mb-3">
                            {route.description}
                        </p>
                    )}

                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-1.5 text-xs text-[#1A6A8A]">
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                <path d="M7 1C4.79 1 3 2.79 3 5c0 3.18 4 8 4 8s4-4.82 4-8c0-2.21-1.79-4-4-4z"/><circle cx="7" cy="5" r="1.2"/>
                            </svg>
                            {route.stops.length} stop{route.stops.length !== 1 ? "s" : ""}
                        </div>
                        {route.recommendedTourIds.length > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-[#1A6A8A]">
                                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                    <circle cx="7" cy="7" r="5.5"/><path d="M7 4v3l2 2"/>
                                </svg>
                                {route.recommendedTourIds.length} tour{route.recommendedTourIds.length !== 1 ? "s" : ""}
                            </div>
                        )}
                    </div>

                    {/* Stop timeline preview */}
                    <div className="flex items-center gap-1 overflow-x-hidden">
                        {stopsWithDest.slice(0, 5).map((s, i) => (
                            <div key={i} className="flex items-center gap-1 flex-shrink-0">
                                {i > 0 && <div className="h-px w-4 bg-[rgba(14,133,178,0.20)] flex-shrink-0"/>}
                                <div className="flex flex-col items-center">
                                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[0.5rem] font-bold flex-shrink-0"
                                         style={{
                                             borderColor: i === 0 ? "#10B981" : i === stopsWithDest.length - 1 ? "#EF4444" : "#1E9DC8",
                                             color:       i === 0 ? "#10B981" : i === stopsWithDest.length - 1 ? "#EF4444" : "#1E9DC8",
                                         }}>
                                        {i + 1}
                                    </div>
                                    <span className="text-[0.55rem] text-[#1A6A8A] mt-0.5 whitespace-nowrap max-w-[48px] overflow-hidden text-ellipsis text-center">
                    {s.days}d
                  </span>
                                </div>
                            </div>
                        ))}
                        {stopsWithDest.length > 5 && <span className="text-[0.6rem] text-[#1A6A8A] ml-1">…</span>}
                    </div>

                    <div className="mt-3 pt-3 border-t border-[rgba(14,133,178,0.07)] flex items-center justify-between">
                        <span className="text-[0.7rem] text-[#1A6A8A]">{route.totalDays} day itinerary</span>
                        <span className="flex items-center gap-1 text-xs font-bold text-[#1E9DC8]">
              View route
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M2 6h8M6 2l4 4-4 4"/>
              </svg>
            </span>
                    </div>
                </div>
            </Link>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center py-24 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#EBF8FF] to-[#D6F0FA] text-4xl shadow-[0_8px_32px_rgba(14,133,178,0.12)]"
                 style={{ animation: "float 3s ease-in-out infinite" }}>
                🗺
            </div>
            <p className="mb-2 text-xl font-semibold text-[#0A3D52]" style={{ fontFamily: "'Playfair Display',serif" }}>
                No routes yet
            </p>
            <p className="mb-6 text-sm font-light text-[#1A6A8A] max-w-xs">
                Curated multi-stop routes are coming soon. Browse individual destinations in the meantime.
            </p>
            <Link href="/destinations"
                  className="rounded-xl bg-gradient-to-r from-[#28B8E8] to-[#0A6A94] px-6 py-3 text-sm font-bold text-white shadow-[0_4px_16px_rgba(14,133,178,0.35)] transition-all hover:-translate-y-0.5">
                Browse destinations
            </Link>
        </div>
    );
}

export default function RoutesClient({ routes, total, destinations, tours }: {
    routes: Route[]; total: number; destinations: Destination[]; tours: Tour[];
}) {
    return (
        <div className="min-h-screen bg-white" style={{ paddingTop: 64 }}>
            <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
      `}</style>

            {/* ── HERO ── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#EBF8FF] via-white to-[#EBF8FF] px-6 pb-16 pt-24 border-b border-[rgba(14,133,178,0.08)]">
                {[
                    { l:"8%",  t:"20%", s:340, c:"rgba(40,184,232,0.10)" },
                    { l:"80%", t:"10%", s:420, c:"rgba(14,133,178,0.08)" },
                    { l:"55%", t:"65%", s:280, c:"rgba(40,184,232,0.07)" },
                ].map((o, i) => (
                    <div key={i} style={{ position:"absolute", left:o.l, top:o.t, width:o.s, height:o.s, borderRadius:"50%", background:`radial-gradient(circle,${o.c} 0%,transparent 70%)`, transform:"translate(-50%,-50%)", pointerEvents:"none" }}/>
                ))}
                <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle,rgba(14,133,178,0.10) 1px,transparent 1px)", backgroundSize:"32px 32px", WebkitMaskImage:"radial-gradient(ellipse 80% 100% at 50% 0%,black 30%,transparent 100%)", maskImage:"radial-gradient(ellipse 80% 100% at 50% 0%,black 30%,transparent 100%)", pointerEvents:"none" }}/>

                <div className="relative mx-auto max-w-6xl">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(14,133,178,0.18)] bg-[#EBF8FF] px-4 py-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#1E9DC8] inline-block" style={{ animation:"pulse 2s infinite" }}/>
                        <span className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#1E9DC8]">Curated routes</span>
                    </div>
                    <h1 className="mb-4 text-[#0A3D52] leading-tight"
                        style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(2.2rem,4.5vw,3.4rem)", fontWeight:700, letterSpacing:"-0.025em" }}>
                        Follow a <em className="italic text-[#1E9DC8]">story</em><br/>through Ethiopia
                    </h1>
                    <p className="max-w-lg text-base font-light leading-relaxed text-[#1A6A8A]">
                        Multi-day journeys connecting Ethiopia's most compelling places — each stop chosen for depth, not just distance.
                    </p>

                    <div className="mt-8 flex flex-wrap gap-3">
                        {[
                            { icon:"🗺", label:"Curated routes",     val: routes.length },
                            { icon:"📍", label:"Destinations linked", val: destinations.length },
                            { icon:"🧭", label:"Suggested tours",     val: tours.length },
                        ].map(({ icon, label, val }) => (
                            <div key={label} className="flex items-center gap-2.5 rounded-2xl border border-[rgba(14,133,178,0.14)] bg-white/80 px-4 py-2.5 backdrop-blur-sm shadow-[0_4px_16px_rgba(14,133,178,0.08)]">
                                <span className="text-lg">{icon}</span>
                                <div>
                                    <div className="text-sm font-bold text-[#0A3D52] leading-tight">{val}</div>
                                    <div className="text-[0.63rem] font-light text-[#1A6A8A] uppercase tracking-wide">{label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── GRID ── */}
            <div className="mx-auto max-w-6xl px-6 py-12">
                {routes.length === 0 ? (
                    <EmptyState/>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {routes.map(r => (
                            <RouteCard key={r.id} route={r} destinations={destinations}/>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}