// src/app/routes/RoutesClient.tsx
"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";

type Stop        = { destinationId: string; days: number; notes: string };
type Route       = { id: string; name: string; description: string; stops: Stop[]; totalDays: number; status: string; recommendedTourIds: string[] };
type Destination = { id: string; name: string; images?: string[]; region?: string; latitude?: number | null; longitude?: number | null };
type Tour        = { id: string; title: string; priceUSD?: number; durationDays?: number; images?: string[] };

// ─── Intersection reveal hook ─────────────────────────────────────────────────

function useReveal(delay = 0) {
    const ref = useRef<HTMLDivElement>(null);
    const [v, setV] = useState(false);
    useEffect(() => {
        const el = ref.current; if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setTimeout(() => setV(true), delay); obs.disconnect(); } },
            { threshold: 0.05 }
        );
        obs.observe(el); return () => obs.disconnect();
    }, [delay]);
    return { ref, visible: v };
}

// ─── Route card ───────────────────────────────────────────────────────────────

function RouteCard({ route, destinations, index }: { route: Route; destinations: Destination[]; index: number }) {
    const { ref, visible } = useReveal(index * 80);
    const [hovered, setHovered] = useState(false);

    const stopsWithDest = route.stops.map(s => ({
        ...s, dest: destinations.find(d => d.id === s.destinationId),
    }));

    // Use multiple stop images for a collage feel
    const images = stopsWithDest
        .map(s => s.dest?.images?.[0])
        .filter(Boolean) as string[];

    const isLarge  = index % 5 === 0; // every 5th card is large
    const accentColors = [
        { from: "#0A6A94", to: "#28B8E8", text: "#EBF8FF" },
        { from: "#065F46", to: "#10B981", text: "#D1FAE5" },
        { from: "#4C1D95", to: "#8B5CF6", text: "#EDE9FE" },
        { from: "#92400E", to: "#F59E0B", text: "#FEF3C7" },
        { from: "#9B1C1C", to: "#EF4444", text: "#FEE2E2" },
    ];
    const accent = accentColors[index % accentColors.length];

    return (
        <div
            ref={ref}
            style={{
                opacity:    visible ? 1 : 0,
                transform:  visible ? "translateY(0) scale(1)" : "translateY(32px) scale(0.98)",
                transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)",
                gridColumn: isLarge ? "span 2" : "span 1",
            }}
        >
            <Link
                href={`/routes/${route.id}`}
                style={{
                    display:    "block",
                    textDecoration: "none",
                    borderRadius: 24,
                    overflow: "hidden",
                    background: "#fff",
                    border: hovered ? "1.5px solid rgba(14,133,178,0.35)" : "1.5px solid rgba(14,133,178,0.08)",
                    boxShadow: hovered
                        ? "0 28px 64px rgba(14,133,178,0.20), 0 4px 16px rgba(14,133,178,0.08)"
                        : "0 2px 12px rgba(14,133,178,0.06)",
                    transform:  hovered ? "translateY(-8px)" : "translateY(0)",
                    transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
                }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                {/* ── Image area ─────────────────────────────────────────────────── */}
                <div style={{ position: "relative", height: isLarge ? 300 : 220, overflow: "hidden", background: `linear-gradient(135deg, ${accent.from}, ${accent.to})` }}>

                    {images.length >= 3 && isLarge ? (
                        // Collage for large cards
                        <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "2fr 1fr", gridTemplateRows: "1fr 1fr", gap: 2 }}>
                            <img src={images[0]} alt="" style={{ gridRow: "span 2", width: "100%", height: "100%", objectFit: "cover", transform: hovered ? "scale(1.05)" : "scale(1)", transition: "transform 0.6s cubic-bezier(0.22,1,0.36,1)" }}/>
                            <img src={images[1]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transform: hovered ? "scale(1.05)" : "scale(1)", transition: "transform 0.6s cubic-bezier(0.22,1,0.36,1) 0.05s" }}/>
                            <img src={images[2]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transform: hovered ? "scale(1.05)" : "scale(1)", transition: "transform 0.6s cubic-bezier(0.22,1,0.36,1) 0.1s" }}/>
                        </div>
                    ) : images[0] ? (
                        <img src={images[0]} alt={route.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: hovered ? "scale(1.07)" : "scale(1)", transition: "transform 0.6s cubic-bezier(0.22,1,0.36,1)" }}/>
                    ) : (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "4rem", opacity: 0.15 }}>🗺</div>
                    )}

                    {/* Gradient overlay */}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(6,20,40,0.15) 0%, transparent 40%, rgba(6,20,40,0.80) 100%)" }}/>

                    {/* Top badges */}
                    <div style={{ position: "absolute", top: 14, left: 14, right: 14, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                        {/* Days badge */}
                        <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.18)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 30, padding: "0.3rem 0.85rem" }}>
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                                <circle cx="6" cy="6" r="4.5"/><path d="M6 3.5V6l1.5 1.5"/>
                            </svg>
                            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#fff", letterSpacing: "0.05em" }}>
                {route.totalDays} DAYS
              </span>
                        </div>

                        {/* Stops count */}
                        <div style={{ display: "flex", alignItems: "center", gap: 5, background: `linear-gradient(135deg,${accent.from},${accent.to})`, borderRadius: 30, padding: "0.3rem 0.85rem", boxShadow: "0 2px 12px rgba(0,0,0,0.25)" }}>
                            <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                                <path d="M6 1C4.343 1 3 2.343 3 4c0 2.5 3 6 3 6s3-3.5 3-6c0-1.657-1.343-3-3-3z"/>
                            </svg>
                            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#fff" }}>
                {route.stops.length} stops
              </span>
                        </div>
                    </div>

                    {/* Bottom content */}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "1.25rem" }}>
                        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: isLarge ? "1.4rem" : "1.05rem", fontWeight: 700, color: "#fff", lineHeight: 1.25, marginBottom: "0.5rem", textShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>
                            {route.name}
                        </h3>

                        {/* Route path */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexWrap: "wrap" }}>
                            {stopsWithDest.slice(0, isLarge ? 6 : 4).map((s, i) => (
                                <span key={i} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  {i > 0 && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M1 4h6M4 1l3 3-3 3"/>
                      </svg>
                  )}
                                    <span style={{ fontSize: "0.65rem", fontWeight: i === 0 || i === stopsWithDest.length - 1 ? 700 : 400, color: i === 0 ? "#6EE7B7" : i === stopsWithDest.length - 1 ? "#FCA5A5" : "rgba(255,255,255,0.85)", whiteSpace: "nowrap" }}>
                    {s.dest?.name ?? "—"}
                  </span>
                </span>
                            ))}
                            {stopsWithDest.length > (isLarge ? 6 : 4) && (
                                <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.5)" }}>
                  +{stopsWithDest.length - (isLarge ? 6 : 4)} more
                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Body ───────────────────────────────────────────────────────── */}
                <div style={{ padding: "1.25rem" }}>

                    {route.description && (
                        <p style={{ fontSize: "0.83rem", color: "#1A6A8A", lineHeight: 1.7, fontWeight: 300, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: "1rem" }}>
                            {route.description}
                        </p>
                    )}

                    {/* Visual stop timeline */}
                    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: "1rem", overflowX: "hidden" }}>
                        {stopsWithDest.map((s, i) => {
                            const isFirst = i === 0;
                            const isLast  = i === stopsWithDest.length - 1;
                            const dotColor = isFirst ? "#10B981" : isLast ? "#EF4444" : "#1E9DC8";
                            const showStop = i < (isLarge ? 8 : 5);
                            if (!showStop && i === (isLarge ? 8 : 5)) {
                                return (
                                    <span key="more" style={{ fontSize: "0.6rem", color: "#94A3B8", marginLeft: 4 }}>
                    +{stopsWithDest.length - (isLarge ? 8 : 5)}
                  </span>
                                );
                            }
                            if (!showStop) return null;
                            return (
                                <div key={i} style={{ display: "flex", alignItems: "center", flex: i < stopsWithDest.length - 1 ? 1 : 0 }}>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                                        <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${dotColor}`, background: isFirst || isLast ? dotColor : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            {isFirst ? (
                                                <svg width="8" height="8" viewBox="0 0 8 8" fill="white"><circle cx="4" cy="4" r="2"/></svg>
                                            ) : isLast ? (
                                                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"><path d="M2 4h4M4 2l2 2-2 2"/></svg>
                                            ) : (
                                                <span style={{ fontSize: "0.45rem", fontWeight: 800, color: dotColor }}>{i + 1}</span>
                                            )}
                                        </div>
                                        <span style={{ fontSize: "0.52rem", color: "#94A3B8", marginTop: 2, whiteSpace: "nowrap", maxWidth: 44, overflow: "hidden", textOverflow: "ellipsis", textAlign: "center" }}>
                      {s.days}d
                    </span>
                                    </div>
                                    {i < stopsWithDest.length - 1 && showStop && (
                                        <div style={{ flex: 1, height: 1.5, background: `linear-gradient(90deg, ${dotColor}50, #1E9DC830)`, minWidth: 8 }}/>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "0.85rem", borderTop: "1px solid rgba(14,133,178,0.07)" }}>
                        <div style={{ display: "flex", gap: "0.6rem" }}>
                            {route.recommendedTourIds.length > 0 && (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(14,133,178,0.06)", borderRadius: 8, padding: "0.22rem 0.6rem", fontSize: "0.68rem", color: "#1A6A8A", fontWeight: 500 }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="6" cy="5" r="2"/><path d="M1.5 11c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4"/></svg>
                                    {route.recommendedTourIds.length} tours
                </span>
                            )}
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(14,133,178,0.06)", borderRadius: 8, padding: "0.22rem 0.6rem", fontSize: "0.68rem", color: "#1A6A8A", fontWeight: 500 }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="6" cy="6" r="4.5"/><path d="M6 3.5V6l1.5 1.5"/></svg>
                                {route.totalDays} days
              </span>
                        </div>

                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.78rem", fontWeight: 700, color: "#1E9DC8", opacity: hovered ? 1 : 0.7, transition: "opacity 0.2s" }}>
              Explore route
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M2 7h10M7 3l4 4-4 4"/>
              </svg>
            </span>
                    </div>
                </div>
            </Link>
        </div>
    );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "6rem 1rem", textAlign: "center" }}>
            <div style={{ width: 88, height: 88, borderRadius: "50%", background: "linear-gradient(135deg,#EBF8FF,#D6F0FA)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", marginBottom: "1.5rem", boxShadow: "0 12px 40px rgba(14,133,178,0.14)", animation: "float 3s ease-in-out infinite" }}>
                🗺
            </div>
            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.4rem", fontWeight: 700, color: "#0A3D52", marginBottom: "0.5rem" }}>
                Routes coming soon
            </p>
            <p style={{ fontSize: "0.88rem", color: "#1A6A8A", fontWeight: 300, marginBottom: "1.75rem", maxWidth: 300, lineHeight: 1.6 }}>
                Curated multi-stop journeys are on their way. Explore individual destinations in the meantime.
            </p>
            <Link href="/destinations" style={{ background: "linear-gradient(135deg,#28B8E8,#0A6A94)", color: "#fff", padding: "0.75rem 1.75rem", borderRadius: 12, textDecoration: "none", fontWeight: 700, fontSize: "0.85rem", boxShadow: "0 4px 18px rgba(14,133,178,0.35)" }}>
                Browse destinations
            </Link>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function RoutesClient({ routes, total, destinations, tours }: {
    routes: Route[]; total: number; destinations: Destination[]; tours: Tour[];
}) {
    const [filter, setFilter] = useState<"all" | "short" | "long">("all");

    const filtered = routes.filter(r => {
        if (filter === "short") return r.totalDays <= 7;
        if (filter === "long")  return r.totalDays > 7;
        return true;
    });

    return (
        <div style={{ minHeight: "100vh", background: "#F8FBFF", paddingTop: 64 }}>
            <style>{`
        @keyframes float   { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-10px)} }
        @keyframes pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

            {/* ── HERO ──────────────────────────────────────────────────────────── */}
            <div style={{ position: "relative", overflow: "hidden", background: "linear-gradient(140deg,#061E32 0%,#0A3D52 50%,#0A6A94 100%)", padding: "6rem 2rem 5rem" }}>

                {/* Decorative orbs */}
                {[
                    { left: "5%",  top: "10%", size: 400, color: "rgba(40,184,232,0.12)"  },
                    { left: "75%", top: "-20%", size: 500, color: "rgba(14,133,178,0.10)" },
                    { left: "40%", top: "60%",  size: 300, color: "rgba(30,157,200,0.08)" },
                ].map((o, i) => (
                    <div key={i} style={{ position: "absolute", left: o.left, top: o.top, width: o.size, height: o.size, borderRadius: "50%", background: `radial-gradient(circle,${o.color} 0%,transparent 70%)`, transform: "translate(-50%,-50%)", pointerEvents: "none" }}/>
                ))}

                {/* Dot grid */}
                <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.06) 1px,transparent 1px)", backgroundSize: "28px 28px", WebkitMaskImage: "radial-gradient(ellipse 90% 100% at 50% 0%,black 40%,transparent 100%)", maskImage: "radial-gradient(ellipse 90% 100% at 50% 0%,black 40%,transparent 100%)", pointerEvents: "none" }}/>

                {/* Animated route line decoration */}
                <div style={{ position: "absolute", right: "8%", top: "50%", transform: "translateY(-50%)", opacity: 0.12, display: "flex", alignItems: "center", gap: 12 }}>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #fff", background: i === 0 ? "#10B981" : i === 5 ? "#EF4444" : "transparent" }}/>
                            {i < 5 && <div style={{ width: 40, height: 1.5, background: "rgba(255,255,255,0.4)" }}/>}
                        </div>
                    ))}
                </div>

                <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
                    {/* Pill badge */}
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.10)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 30, padding: "0.4rem 1rem", marginBottom: "1.5rem", animation: "fadeIn 0.5s ease both" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", display: "inline-block", animation: "pulse 2s infinite" }}/>
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.18em", color: "rgba(255,255,255,0.85)", textTransform: "uppercase" }}>Curated routes</span>
                    </div>

                    <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(2.4rem,5vw,3.8rem)", fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: "1.25rem", animation: "fadeIn 0.5s 0.1s ease both", animationFillMode: "both" }}>
                        Follow a <em style={{ fontStyle: "italic", color: "#28B8E8" }}>story</em><br/>
                        through Ethiopia
                    </h1>

                    <p style={{ fontSize: "1rem", fontWeight: 300, color: "rgba(235,248,255,0.75)", maxWidth: 520, lineHeight: 1.75, marginBottom: "2.5rem", animation: "fadeIn 0.5s 0.2s ease both", animationFillMode: "both" }}>
                        Multi-day journeys connecting Ethiopia's most compelling places — each stop chosen for depth, not just distance.
                    </p>

                    {/* Stats row */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", animation: "fadeIn 0.5s 0.3s ease both", animationFillMode: "both" }}>
                        {[
                            { icon: "🗺", label: "Routes",       val: routes.length },
                            { icon: "📍", label: "Destinations", val: destinations.length },
                            { icon: "🧭", label: "Tours linked", val: tours.length },
                        ].map(({ icon, label, val }) => (
                            <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: "0.65rem 1.1rem" }}>
                                <span style={{ fontSize: "1.1rem" }}>{icon}</span>
                                <div>
                                    <div style={{ fontSize: "1rem", fontWeight: 800, color: "#fff", lineHeight: 1 }}>{val}</div>
                                    <div style={{ fontSize: "0.62rem", fontWeight: 500, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── FILTER BAR ──────────────────────────────────────────────────────── */}
            <div style={{ position: "sticky", top: 64, zIndex: 30, background: "rgba(248,251,255,0.95)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(14,133,178,0.08)", padding: "0.85rem 2rem" }}>
                <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94A3B8", marginRight: "0.5rem" }}>Filter:</span>
                    {[
                        { key: "all",   label: "All routes"   },
                        { key: "short", label: "≤ 7 days"     },
                        { key: "long",  label: "8+ days"       },
                    ].map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key as typeof filter)}
                            style={{
                                padding: "0.4rem 1rem", borderRadius: 30, fontSize: "0.78rem", fontWeight: 600,
                                border: filter === f.key ? "none" : "1px solid rgba(14,133,178,0.18)",
                                background: filter === f.key ? "linear-gradient(135deg,#28B8E8,#0A6A94)" : "transparent",
                                color:      filter === f.key ? "#fff" : "#1A6A8A",
                                cursor: "pointer", transition: "all 0.2s",
                                boxShadow: filter === f.key ? "0 2px 10px rgba(14,133,178,0.30)" : "none",
                            }}
                        >
                            {f.label}
                        </button>
                    ))}
                    <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#94A3B8" }}>
            {filtered.length} route{filtered.length !== 1 ? "s" : ""}
          </span>
                </div>
            </div>

            {/* ── GRID ─────────────────────────────────────────────────────────────── */}
            <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2.5rem 2rem 5rem" }}>
                {filtered.length === 0 ? (
                    <EmptyState/>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.5rem", alignItems: "start" }}>
                        {filtered.map((r, i) => (
                            <RouteCard key={r.id} route={r} destinations={destinations} index={i}/>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}