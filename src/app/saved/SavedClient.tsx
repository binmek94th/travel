"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";

type Destination = {
    id: string; name: string; region: string;
    categories: string[]; avgRating: number; reviewCount: number;
    isHiddenGem: boolean; images: string[];
    description: string; bestTimeToVisit: string;
};

type Tour = {
    id: string; title: string;
    priceUSD: number; durationDays: number;
    avgRating: number; reviewCount: number; bookingCount: number;
    isFeatured: boolean; categories: string; images: string[];
    description: string;
};

const CAT_ICONS: Record<string, string> = {
    culture: "🏛", nature: "🌿", adventure: "⛰", religious: "⛪",
};

const CAT_COLORS: Record<string, string> = {
    culture:   "#3B82F6",
    nature:    "#10B981",
    adventure: "#F59E0B",
    religious: "#8B5CF6",
};

function useReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current; if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
            { threshold: 0.06 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return { ref, visible };
}

// ── DESTINATION CARD ──────────────────────────────────────────────────────────
function DestinationCard({ dest, onRemove }: { dest: Destination; onRemove: (id: string) => void }) {
    const { ref, visible } = useReveal();
    const [hovered, setHovered]   = useState(false);
    const [removing, setRemoving] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
    const cardRef = useRef<HTMLDivElement>(null);

    const onMouseMove = (e: React.MouseEvent) => {
        const el = cardRef.current; if (!el) return;
        const r = el.getBoundingClientRect();
        setMousePos({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
    };

    const catColor = CAT_COLORS[dest.categories[0]] ?? "#1E9DC8";
    const tiltX = hovered ? (mousePos.y - 0.5) * -8 : 0;
    const tiltY = hovered ? (mousePos.x - 0.5) * 8 : 0;

    async function remove(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        setRemoving(true);
        try {
            await fetch("/api/user/saved-destinations", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ destinationId: dest.id }),
            });
            onRemove(dest.id);
            toast.success(`${dest.name} removed from saved`);
        } catch {
            toast.error("Failed to remove");
        } finally {
            setRemoving(false);
        }
    }

    return (
        <div ref={ref} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(28px)",
            transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)",
            perspective: 1000,
        }}>
            <div
                ref={cardRef}
                className="relative rounded-2xl overflow-hidden bg-white cursor-pointer"
                style={{
                    border: hovered ? "1px solid rgba(14,133,178,0.30)" : "1px solid rgba(14,133,178,0.10)",
                    boxShadow: hovered ? "0 24px 56px rgba(14,133,178,0.16), 0 6px 16px rgba(14,133,178,0.08)" : "0 2px 10px rgba(14,133,178,0.06)",
                    transform: hovered ? `translateY(-8px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)` : "none",
                    transformStyle: "preserve-3d",
                    transition: "transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s, border-color 0.25s",
                }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => { setHovered(false); setMousePos({ x:0.5, y:0.5 }); }}
                onMouseMove={onMouseMove}
            >
                <Link href={`/destinations/${dest.id}`} className="block no-underline">
                    {/* Image */}
                    <div className="relative h-44 overflow-hidden" style={{ background: `linear-gradient(135deg, ${catColor}18, ${catColor}30)` }}>
                        {dest.images?.[0] ? (
                            <img src={dest.images[0]} alt={dest.name}
                                 className="absolute inset-0 w-full h-full object-cover"
                                 style={{ transform: hovered ? "scale(1.07)" : "scale(1)", transition: "transform 0.5s cubic-bezier(0.22,1,0.36,1)" }}/>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-40">
                                {CAT_ICONS[dest.categories[0]] ?? "📍"}
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(6,30,50,0.60)]"/>

                        {/* Mouse glare */}
                        {hovered && (
                            <div style={{
                                position:"absolute", inset:0, pointerEvents:"none",
                                background:`radial-gradient(circle at ${mousePos.x*100}% ${mousePos.y*100}%, rgba(255,255,255,0.14) 0%, transparent 55%)`,
                            }}/>
                        )}

                        {/* Category dot */}
                        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 backdrop-blur-sm"
                             style={{ background: "rgba(0,0,0,0.28)" }}>
                            <span className="text-xs">{CAT_ICONS[dest.categories[0]] ?? "📍"}</span>
                            <span className="text-[0.6rem] font-bold uppercase tracking-wider text-white">{dest.categories[0]}</span>
                        </div>

                        {dest.isHiddenGem && (
                            <div className="absolute right-10 top-3 flex items-center gap-1 rounded-full bg-amber-400/90 px-2.5 py-0.5 text-[0.62rem] font-bold text-white backdrop-blur-sm">
                                💎
                            </div>
                        )}

                        {/* Name on image */}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h3 className="text-base font-bold text-white leading-tight"
                                style={{ fontFamily:"'Playfair Display',serif", letterSpacing:"-0.01em" }}>
                                {dest.name}
                            </h3>
                            {dest.region && (
                                <p className="text-[0.65rem] font-medium text-white/75 mt-0.5 flex items-center gap-1">
                                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                        <path d="M5 1C3.34 1 2 2.34 2 4c0 2.54 3 6 3 6s3-3.46 3-6c0-1.66-1.34-3-3-3z"/><circle cx="5" cy="4" r="1"/>
                                    </svg>
                                    {dest.region}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-4">
                        <p className="text-sm font-light leading-relaxed text-[#1A6A8A] line-clamp-2 mb-3">{dest.description}</p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-sm">
                                {dest.avgRating > 0 ? (
                                    <>
                                        {[1,2,3,4,5].map(s=>(
                                            <span key={s} className="text-xs" style={{ color: s<=Math.round(dest.avgRating)?"#F59E0B":"rgba(14,133,178,0.2)" }}>★</span>
                                        ))}
                                        <span className="ml-1 text-xs font-bold text-[#0A3D52]">{dest.avgRating.toFixed(1)}</span>
                                        <span className="text-xs font-light text-[#1A6A8A]">({dest.reviewCount})</span>
                                    </>
                                ) : (
                                    <span className="text-xs text-[#1A6A8A]">No reviews yet</span>
                                )}
                            </div>
                            {dest.bestTimeToVisit && (
                                <span className="text-[0.62rem] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  🗓 {dest.bestTimeToVisit}
                </span>
                            )}
                        </div>
                    </div>
                </Link>

                {/* Remove button */}
                <button
                    onClick={remove}
                    disabled={removing}
                    title="Remove from saved"
                    className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all disabled:opacity-50"
                    style={{
                        background: "rgba(239,68,68,0.90)",
                        boxShadow: "0 2px 10px rgba(239,68,68,0.35)",
                        transform: hovered ? "scale(1.1)" : "scale(1)",
                        transition: "transform 0.2s, box-shadow 0.2s",
                    }}
                >
                    {removing ? (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border border-white/40 border-t-white"/>
                    ) : (
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                            <path d="M2 2l10 10M12 2L2 12"/>
                        </svg>
                    )}
                </button>

                {/* Hover bottom bar */}
                <div className="h-[3px] w-full" style={{
                    background: `linear-gradient(90deg, ${catColor}, ${catColor}88)`,
                    transform: hovered ? "scaleX(1)" : "scaleX(0)",
                    transformOrigin: "left",
                    transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1)",
                }}/>
            </div>
        </div>
    );
}

// ── TOUR CARD ─────────────────────────────────────────────────────────────────
function TourCard({ tour, onRemove }: { tour: Tour; onRemove: (id: string) => void }) {
    const { ref, visible } = useReveal();
    const [hovered, setHovered]   = useState(false);
    const [removing, setRemoving] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
    const cardRef = useRef<HTMLDivElement>(null);

    const onMouseMove = (e: React.MouseEvent) => {
        const el = cardRef.current; if (!el) return;
        const r = el.getBoundingClientRect();
        setMousePos({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
    };


    const catColor = CAT_COLORS[tour?.categories] ?? "#1E9DC8";
    const tiltX = hovered ? (mousePos.y - 0.5) * -8 : 0;
    const tiltY = hovered ? (mousePos.x - 0.5) * 8 : 0;

    async function remove(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        setRemoving(true);
        try {
            await fetch("/api/user/saved-tours", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tourId: tour.id }),
            });
            onRemove(tour.id);
            toast.success(`${tour.title} removed from saved`);
        } catch {
            toast.error("Failed to remove");
        } finally {
            setRemoving(false);
        }
    }

    return (
        <div ref={ref} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(28px)",
            transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)",
            perspective: 1000,
        }}>
            <div
                ref={cardRef}
                className="relative rounded-2xl overflow-hidden bg-white cursor-pointer"
                style={{
                    border: hovered ? "1px solid rgba(14,133,178,0.30)" : "1px solid rgba(14,133,178,0.10)",
                    boxShadow: hovered ? "0 24px 56px rgba(14,133,178,0.16), 0 6px 16px rgba(14,133,178,0.08)" : "0 2px 10px rgba(14,133,178,0.06)",
                    transform: hovered ? `translateY(-8px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)` : "none",
                    transformStyle: "preserve-3d",
                    transition: "transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s, border-color 0.25s",
                }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => { setHovered(false); setMousePos({ x:0.5, y:0.5 }); }}
                onMouseMove={onMouseMove}
            >
                <Link href={`/tours/${tour.id}`} className="block no-underline">
                    {/* Image */}
                    <div className="relative h-44 overflow-hidden" style={{ background: `linear-gradient(135deg, ${catColor}18, ${catColor}30)` }}>
                        {tour.images?.[0] ? (
                            <img src={tour.images[0]} alt={tour.title}
                                 className="absolute inset-0 w-full h-full object-cover"
                                 style={{ transform: hovered ? "scale(1.07)" : "scale(1)", transition: "transform 0.5s cubic-bezier(0.22,1,0.36,1)" }}/>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-40">
                                {CAT_ICONS[tour.categories[0]] ?? "🧭"}
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(6,30,50,0.60)]"/>

                        {hovered && (
                            <div style={{
                                position:"absolute", inset:0, pointerEvents:"none",
                                background:`radial-gradient(circle at ${mousePos.x*100}% ${mousePos.y*100}%, rgba(255,255,255,0.14) 0%, transparent 55%)`,
                            }}/>
                        )}

                        {/* Featured */}
                        {tour.isFeatured && (
                            <div className="absolute left-3 top-3 rounded-full bg-amber-400/90 px-2.5 py-0.5 text-[0.62rem] font-bold text-white backdrop-blur-sm">⭐ Featured</div>
                        )}

                        {/* Duration + bookings */}
                        <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                            {tour.bookingCount > 0 && (
                                <div className="flex items-center gap-1 rounded-md bg-amber-500/80 px-2 py-0.5 text-[0.6rem] font-bold text-white backdrop-blur-sm">
                                    🔥 {tour.bookingCount}
                                </div>
                            )}
                            <div className="flex items-center gap-1 rounded-md bg-[rgba(6,30,50,0.70)] px-2 py-0.5 text-[0.62rem] font-bold text-white backdrop-blur-sm">
                                <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                    <circle cx="6" cy="6" r="4.5"/><path d="M6 3.5V6l1.5 1.5"/>
                                </svg>
                                {tour.durationDays}d
                            </div>
                        </div>

                        {/* Title */}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h3 className="text-base font-bold text-white leading-tight"
                                style={{ fontFamily:"'Playfair Display',serif", letterSpacing:"-0.01em" }}>
                                {tour.title}
                            </h3>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-4">
                        <p className="text-sm font-light leading-relaxed text-[#1A6A8A] line-clamp-2 mb-3">{tour.description}</p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-sm">
                                {tour.avgRating > 0 ? (
                                    <>
                                        {[1,2,3,4,5].map(s=>(
                                            <span key={s} className="text-xs" style={{ color: s<=Math.round(tour.avgRating)?"#F59E0B":"rgba(14,133,178,0.2)" }}>★</span>
                                        ))}
                                        <span className="ml-1 text-xs font-bold text-[#0A3D52]">{tour.avgRating.toFixed(1)}</span>
                                        <span className="text-xs font-light text-[#1A6A8A]">({tour.reviewCount})</span>
                                    </>
                                ) : (
                                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">✨ New</span>
                                )}
                            </div>
                            <span className="text-base font-bold text-[#1E9DC8]">${tour.priceUSD.toLocaleString()}</span>
                        </div>
                    </div>
                </Link>

                {/* Remove button */}
                <button
                    onClick={remove}
                    disabled={removing}
                    title="Remove from saved"
                    className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all disabled:opacity-50"
                    style={{
                        background: "rgba(239,68,68,0.90)",
                        boxShadow: "0 2px 10px rgba(239,68,68,0.35)",
                        transform: hovered ? "scale(1.1)" : "scale(1)",
                        transition: "transform 0.2s, box-shadow 0.2s",
                    }}
                >
                    {removing ? (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border border-white/40 border-t-white"/>
                    ) : (
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                            <path d="M2 2l10 10M12 2L2 12"/>
                        </svg>
                    )}
                </button>

                <div className="h-[3px] w-full" style={{
                    background: `linear-gradient(90deg, ${catColor}, ${catColor}88)`,
                    transform: hovered ? "scaleX(1)" : "scaleX(0)",
                    transformOrigin: "left",
                    transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1)",
                }}/>
            </div>
        </div>
    );
}

// ── EMPTY STATE ───────────────────────────────────────────────────────────────
function EmptyState({ tab }: { tab: "destinations" | "tours" | "all" }) {
    const msgs = {
        destinations: { icon: "📍", title: "No saved destinations", sub: "Explore Ethiopia and save the places you want to visit.", href: "/destinations", cta: "Browse destinations" },
        tours:        { icon: "🧭", title: "No saved tours",        sub: "Find your perfect tour and save it for later.",            href: "/tours",        cta: "Browse tours"        },
        all:          { icon: "❤️", title: "Nothing saved yet",     sub: "Save destinations and tours to find them here.",           href: "/destinations", cta: "Start exploring"     },
    };
    const m = msgs[tab];
    return (
        <div className="flex flex-col items-center py-24 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#EBF8FF] to-[#D6F0FA] text-4xl shadow-[0_8px_32px_rgba(14,133,178,0.12)]"
                 style={{ animation: "float 3s ease-in-out infinite" }}>
                {m.icon}
            </div>
            <p className="mb-2 text-xl font-semibold text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif" }}>{m.title}</p>
            <p className="mb-8 text-sm font-light text-[#1A6A8A] max-w-xs">{m.sub}</p>
            <Link href={m.href}
                  className="rounded-xl bg-gradient-to-r from-[#28B8E8] to-[#0A6A94] px-6 py-3 text-sm font-bold text-white shadow-[0_4px_16px_rgba(14,133,178,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(14,133,178,0.45)]">
                {m.cta}
            </Link>
        </div>
    );
}

// ── MAIN CLIENT ───────────────────────────────────────────────────────────────
export default function SavedClient({
                                        destinations: initialDests,
                                        tours: initialTours,
                                    }: {
    destinations: Destination[];
    tours: Tour[];
}) {
    const [tab, setTab]   = useState<"all" | "destinations" | "tours">("all");
    const [dests, setDests] = useState(initialDests);
    const [tours, setTours] = useState(initialTours);

    const removeDest = (id: string) => setDests(d => d.filter(x => x.id !== id));
    const removeTour = (id: string) => setTours(d => d.filter(x => x.id !== id));

    const totalCount = dests.length + tours.length;

    const tabs = [
        { key: "all",          label: "All saved",    count: totalCount },
        { key: "destinations", label: "Destinations", count: dests.length },
        { key: "tours",        label: "Tours",         count: tours.length },
    ] as const;

    return (
        <div className="min-h-screen bg-white" style={{ paddingTop: 64 }}>
            <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>

            {/* ── HEADER ── */}
            <div className="relative overflow-hidden border-b border-[rgba(14,133,178,0.08)]"
                 style={{ background: "linear-gradient(160deg,#EBF8FF 0%,#fff 50%,#EBF8FF 100%)" }}>

                {/* Background orbs */}
                <div style={{ position:"absolute", top:-100, right:-100, width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(40,184,232,0.10) 0%,transparent 70%)", pointerEvents:"none" }}/>
                <div style={{ position:"absolute", bottom:-150, left:-80, width:350, height:350, borderRadius:"50%", background:"radial-gradient(circle,rgba(14,133,178,0.08) 0%,transparent 70%)", pointerEvents:"none" }}/>

                <div className="relative mx-auto max-w-6xl px-6 py-12">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(14,133,178,0.18)] bg-[#EBF8FF] px-4 py-1.5">
                                <svg width="12" height="12" viewBox="0 0 14 14" fill="#EF4444" stroke="#EF4444" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M7 12S1 8 1 4.5a3 3 0 0 1 6-1A3 3 0 0 1 13 4.5C13 8 7 12 7 12z"/>
                                </svg>
                                <span className="text-[0.72rem] font-bold uppercase tracking-[0.15em] text-[#1E9DC8]">Your saved collection</span>
                            </div>
                            <h1 className="text-4xl font-bold text-[#0A3D52] mb-2"
                                style={{ fontFamily:"'Playfair Display',serif", letterSpacing:"-0.025em" }}>
                                Saved places
                            </h1>
                            <p className="text-base font-light text-[#1A6A8A]">
                                {totalCount === 0
                                    ? "Your wishlist is empty — start exploring"
                                    : `${totalCount} saved item${totalCount !== 1 ? "s" : ""} · ${dests.length} destination${dests.length !== 1 ? "s" : ""}, ${tours.length} tour${tours.length !== 1 ? "s" : ""}`
                                }
                            </p>
                        </div>

                        {/* Quick actions */}
                        <div className="flex items-center gap-2">
                            <Link href="/destinations"
                                  className="flex items-center gap-1.5 rounded-xl border border-[rgba(14,133,178,0.18)] bg-white px-4 py-2 text-sm font-medium text-[#1A6A8A] transition-all hover:bg-[#EBF8FF]">
                                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M7 1C4.79 1 3 2.79 3 5c0 3.18 4 8 4 8s4-4.82 4-8c0-2.21-1.79-4-4-4z"/><circle cx="7" cy="5" r="1.2"/></svg>
                                Destinations
                            </Link>
                            <Link href="/tours"
                                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#28B8E8] to-[#0A6A94] px-4 py-2 text-sm font-bold text-white shadow-[0_3px_12px_rgba(14,133,178,0.35)] transition-all hover:-translate-y-0.5">
                                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="5.5"/><path d="M7 4v3l2 2"/></svg>
                                Browse tours
                            </Link>
                        </div>
                    </div>

                    {/* ── TABS ── */}
                    <div className="mt-8 flex items-center gap-1">
                        {tabs.map(t => {
                            const isActive = tab === t.key;
                            return (
                                <button key={t.key} onClick={() => setTab(t.key)}
                                        className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all"
                                        style={{
                                            background: isActive ? "linear-gradient(135deg,#28B8E8,#0A6A94)" : "transparent",
                                            color:      isActive ? "#fff" : "#1A6A8A",
                                            boxShadow:  isActive ? "0 4px 14px rgba(14,133,178,0.35)" : "none",
                                        }}>
                                    {t.label}
                                    <span className="rounded-full px-2 py-0.5 text-[0.65rem] font-bold"
                                          style={{
                                              background: isActive ? "rgba(255,255,255,0.22)" : "rgba(14,133,178,0.10)",
                                              color:      isActive ? "#fff" : "#1E9DC8",
                                          }}>
                    {t.count}
                  </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── CONTENT ── */}
            <div className="mx-auto max-w-6xl px-6 py-10">

                {/* ALL tab */}
                {tab === "all" && (
                    <>
                        {totalCount === 0 ? (
                            <EmptyState tab="all"/>
                        ) : (
                            <div className="flex flex-col gap-12">
                                {dests.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#28B8E8] to-[#0A6A94]">
                                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round"><path d="M7 1C4.79 1 3 2.79 3 5c0 3.18 4 8 4 8s4-4.82 4-8c0-2.21-1.79-4-4-4z"/><circle cx="7" cy="5" r="1.2"/></svg>
                                                </div>
                                                <h2 className="text-lg font-semibold text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif" }}>
                                                    Destinations <span className="text-sm font-light text-[#1A6A8A]">({dests.length})</span>
                                                </h2>
                                            </div>
                                            <button onClick={() => setTab("destinations")} className="text-xs font-medium text-[#1E9DC8] hover:underline">View all</button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                            {dests.slice(0, 3).map(d => <DestinationCard key={d.id} dest={d} onRemove={removeDest}/>)}
                                        </div>
                                        {dests.length > 3 && (
                                            <button onClick={() => setTab("destinations")}
                                                    className="mt-4 w-full rounded-xl border border-[rgba(14,133,178,0.15)] bg-[#F8FCFF] py-2.5 text-sm font-medium text-[#1E9DC8] transition-all hover:bg-[#EBF8FF]">
                                                + {dests.length - 3} more destination{dests.length - 3 !== 1 ? "s" : ""}
                                            </button>
                                        )}
                                    </div>
                                )}

                                {tours.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#28B8E8] to-[#0A6A94]">
                                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="5.5"/><path d="M7 4v3l2 2"/></svg>
                                                </div>
                                                <h2 className="text-lg font-semibold text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif" }}>
                                                    Tours <span className="text-sm font-light text-[#1A6A8A]">({tours.length})</span>
                                                </h2>
                                            </div>
                                            <button onClick={() => setTab("tours")} className="text-xs font-medium text-[#1E9DC8] hover:underline">View all</button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                            {tours.slice(0, 3).map(t => <TourCard key={t.id} tour={t} onRemove={removeTour}/>)}
                                        </div>
                                        {tours.length > 3 && (
                                            <button onClick={() => setTab("tours")}
                                                    className="mt-4 w-full rounded-xl border border-[rgba(14,133,178,0.15)] bg-[#F8FCFF] py-2.5 text-sm font-medium text-[#1E9DC8] transition-all hover:bg-[#EBF8FF]">
                                                + {tours.length - 3} more tour{tours.length - 3 !== 1 ? "s" : ""}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* DESTINATIONS tab */}
                {tab === "destinations" && (
                    dests.length === 0 ? (
                        <EmptyState tab="destinations"/>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {dests.map(d => <DestinationCard key={d.id} dest={d} onRemove={removeDest}/>)}
                        </div>
                    )
                )}

                {/* TOURS tab */}
                {tab === "tours" && (
                    tours.length === 0 ? (
                        <EmptyState tab="tours"/>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {tours.map(t => <TourCard key={t.id} tour={t} onRemove={removeTour}/>)}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}