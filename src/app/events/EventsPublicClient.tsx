// src/app/events/EventsPublicClient.tsx
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";

type EventItem = {
    id: string; name: string; type: string; destinationId: string;
    startDate: string; endDate: string; description: string;
    location: string; capacity: number | null; images: string[];
    isBookable: boolean; linkedTourId: string | null; isPast: boolean;
};
type Destination = { id: string; name: string; region: string; images: string[] };
type Tour        = { id: string; title: string; priceUSD: number; durationDays: number; images: string[] };

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string; border: string }> = {
    festival:  { label:"Festival",  icon:"🎉", color:"#0A6A94", bg:"#EBF8FF", border:"rgba(14,133,178,0.20)" },
    religious: { label:"Religious", icon:"⛪", color:"#6D28D9", bg:"#EDE9FE", border:"rgba(109,40,217,0.20)" },
    food:      { label:"Food",      icon:"🍽", color:"#92400E", bg:"#FEF3C7", border:"rgba(146,64,14,0.20)"  },
    ceremony:  { label:"Ceremony",  icon:"🎊", color:"#065F46", bg:"#D1FAE5", border:"rgba(6,95,70,0.20)"   },
};

function tc(type: string) {
    return TYPE_CONFIG[type] ?? { label: type, icon:"📅", color:"#1A6A8A", bg:"#F0F9FF", border:"rgba(14,133,178,0.18)" };
}

function fmtDate(iso: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
}

function fmtDateLong(iso: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric" });
}

function daysUntil(iso: string) {
    const diff = new Date(iso).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

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

// ── Event detail modal ────────────────────────────────────────────────────────
function EventModal({ event, destinations, tours, onClose }: {
    event: EventItem; destinations: Destination[]; tours: Tour[]; onClose: () => void;
}) {
    const [activeImg, setActiveImg] = useState(0);
    const dest = destinations.find(d => d.id === event.destinationId);
    const tour = tours.find(t => t.id === event.linkedTourId);
    const cfg  = tc(event.type);
    const days = daysUntil(event.startDate);
    const multiDay = event.endDate && event.endDate !== event.startDate;

    useEffect(() => {
        document.body.style.overflow = "hidden";
        const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", fn);
        return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", fn); };
    }, [onClose]);

    const allImages = event.images?.length ? event.images : dest?.images?.slice(0, 1) ?? [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="absolute inset-0 bg-[rgba(10,61,82,0.55)] backdrop-blur-[6px]"/>
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-[0_32px_80px_rgba(14,133,178,0.22)]"
                 style={{ animation:"modal-pop 0.25s cubic-bezier(0.22,1,0.36,1) both" }}>
                <style>{`@keyframes modal-pop{from{opacity:0;transform:scale(0.95) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>

                {/* Hero image */}
                <div className="relative h-52 overflow-hidden rounded-t-2xl bg-gradient-to-br from-[#EBF8FF] to-[#D6F0FA]">
                    {allImages.length > 0 ? (
                        <img src={allImages[activeImg]} alt={event.name} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"/>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-20">{cfg.icon}</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(6,30,50,0.70)]"/>

                    {/* Type badge */}
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white backdrop-blur-sm"
                         style={{ background: cfg.color + "CC" }}>
                        {cfg.icon} {cfg.label}
                    </div>

                    {/* Countdown */}
                    {!event.isPast && days > 0 && days <= 90 && (
                        <div className="absolute top-4 right-12 rounded-full bg-white/90 px-2.5 py-0.5 text-[0.65rem] font-bold text-[#0A3D52] backdrop-blur-sm">
                            {days === 1 ? "Tomorrow" : `In ${days} days`}
                        </div>
                    )}

                    {/* Past badge */}
                    {event.isPast && (
                        <div className="absolute top-4 right-12 rounded-full bg-black/40 px-2.5 py-0.5 text-[0.65rem] font-bold text-white backdrop-blur-sm">
                            Past event
                        </div>
                    )}

                    <button onClick={onClose}
                            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors backdrop-blur-sm">
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M2 2l10 10M12 2L2 12"/>
                        </svg>
                    </button>

                    {/* Title */}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                        <h2 className="text-2xl font-bold text-white" style={{ fontFamily:"'Playfair Display',serif", letterSpacing:"-0.02em" }}>
                            {event.name}
                        </h2>
                        {dest && (
                            <p className="text-sm text-white/75 mt-0.5 flex items-center gap-1.5">
                                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                    <path d="M6 1C4.34 1 3 2.34 3 4c0 2.54 3 7 3 7s3-4.46 3-7c0-1.66-1.34-3-3-3z"/><circle cx="6" cy="4" r="1"/>
                                </svg>
                                {dest.name}{dest.region ? ` · ${dest.region}` : ""}
                            </p>
                        )}
                    </div>
                </div>

                {/* Thumbnails */}
                {allImages.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto px-5 py-2 border-b border-[rgba(14,133,178,0.08)] bg-[#F8FCFF]">
                        {allImages.map((img, i) => (
                            <button key={i} onClick={() => setActiveImg(i)}
                                    className={`h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${i === activeImg ? "border-[#1E9DC8] opacity-100" : "border-transparent opacity-60 hover:opacity-100"}`}>
                                <img src={img} alt="" className="h-full w-full object-cover"/>
                            </button>
                        ))}
                    </div>
                )}

                <div className="p-5 flex flex-col gap-5">

                    {/* Key info grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            {
                                icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="3" width="12" height="11" rx="2"/><path d="M5 3V1.5M11 3V1.5M2 7h12"/></svg>,
                                label: "Date",
                                value: multiDay ? `${fmtDate(event.startDate)} → ${fmtDate(event.endDate)}` : fmtDateLong(event.startDate),
                            },
                            ...(event.location ? [{
                                icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 1C5.79 1 4 2.79 4 5c0 3.5 4 9 4 9s4-5.5 4-9c0-2.21-1.79-4-4-4z"/><circle cx="8" cy="5" r="1.5"/></svg>,
                                label: "Location",
                                value: event.location,
                            }] : []),
                            ...(event.capacity != null ? [{
                                icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 14c0-3 2.5-5 6-5s6 2 6 5"/><circle cx="8" cy="6" r="3"/></svg>,
                                label: "Capacity",
                                value: `${event.capacity.toLocaleString()} people`,
                            }] : []),
                            ...(event.isBookable ? [{
                                icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 6l5 5 7-7"/></svg>,
                                label: "Bookable",
                                value: "Bookings available",
                            }] : []),
                        ].map(({ icon, label, value }) => (
                            <div key={label} className="flex items-start gap-2.5 rounded-xl border border-[rgba(14,133,178,0.10)] bg-[#F8FCFF] p-3">
                                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#EBF8FF] text-[#1E9DC8]">
                                    {icon}
                                </div>
                                <div>
                                    <p className="text-[0.62rem] font-bold uppercase tracking-wider text-[#1A6A8A]">{label}</p>
                                    <p className="text-sm font-semibold text-[#0A3D52] mt-0.5 leading-snug">{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Description */}
                    <section>
                        <h3 className="text-base font-bold text-[#0A3D52] mb-2" style={{ fontFamily:"'Playfair Display',serif" }}>About</h3>
                        <p className="text-sm font-light leading-relaxed text-[#1A6A8A] whitespace-pre-line">{event.description}</p>
                    </section>

                    {/* Linked tour CTA */}
                    {tour && event.isBookable && (
                        <div className="rounded-2xl bg-gradient-to-br from-[#0A3D52] to-[#0E85B2] p-5 text-white">
                            <p className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1">Book this experience</p>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-12 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-white/10">
                                    {tour.images?.[0]
                                        ? <img src={tour.images[0]} alt={tour.title} className="w-full h-full object-cover"/>
                                        : <div className="w-full h-full flex items-center justify-center text-xl">🧭</div>
                                    }
                                </div>
                                <div>
                                    <p className="text-sm font-bold" style={{ fontFamily:"'Playfair Display',serif" }}>{tour.title}</p>
                                    <p className="text-xs text-white/70">{tour.durationDays}d · from ${tour.priceUSD.toLocaleString()}</p>
                                </div>
                            </div>
                            <Link href={`/tours/${tour.id}`}
                                  className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#0A3D52] transition-all hover:bg-[#EBF8FF]">
                                Book tour
                                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M2 6.5h9M7 3l3.5 3.5L7 10"/>
                                </svg>
                            </Link>
                        </div>
                    )}

                    {/* Destination link */}
                    {dest && (
                        <Link href={`/destinations/${dest.id}`}
                              className="flex items-center justify-between rounded-xl border border-[rgba(14,133,178,0.12)] bg-white p-3.5 no-underline transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(14,133,178,0.12)]">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-14 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-[#EBF8FF] to-[#D6F0FA]">
                                    {dest.images?.[0]
                                        ? <img src={dest.images[0]} alt={dest.name} className="w-full h-full object-cover"/>
                                        : <div className="w-full h-full flex items-center justify-center text-lg">📍</div>
                                    }
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-[#0A3D52]">{dest.name}</p>
                                    {dest.region && <p className="text-xs text-[#1A6A8A]">{dest.region}</p>}
                                </div>
                            </div>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#1E9DC8" strokeWidth="2" strokeLinecap="round">
                                <path d="M2 7h10M8 3l4 4-4 4"/>
                            </svg>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Event card ────────────────────────────────────────────────────────────────
function EventCard({ event, destinations, onSelect }: {
    event: EventItem; destinations: Destination[]; onSelect: () => void;
}) {
    const { ref, visible } = useReveal();
    const [hovered, setHovered] = useState(false);
    const cfg  = tc(event.type);
    const dest = destinations.find(d => d.id === event.destinationId);
    const img  = event.images?.[0] ?? dest?.images?.[0];
    const days = daysUntil(event.startDate);
    const multiDay = event.endDate && event.endDate !== event.startDate;

    return (
        <div ref={ref} style={{ opacity:visible?1:0, transform:visible?"translateY(0)":"translateY(24px)", transition:"opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)" }}>
            <div onClick={onSelect} className="rounded-2xl bg-white overflow-hidden cursor-pointer"
                 style={{ border: hovered ? "1px solid rgba(14,133,178,0.30)" : "1px solid rgba(14,133,178,0.10)", boxShadow: hovered ? "0 20px 48px rgba(14,133,178,0.14)" : "0 2px 10px rgba(14,133,178,0.06)", transform: hovered ? "translateY(-6px)" : "none", transition:"all 0.25s cubic-bezier(0.22,1,0.36,1)" }}
                 onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>

                {/* Image */}
                <div className="relative h-44 overflow-hidden bg-gradient-to-br from-[#EBF8FF] to-[#D6F0FA]">
                    {img ? (
                        <img src={img} alt={event.name} className="absolute inset-0 w-full h-full object-cover"
                             style={{ transform: hovered ? "scale(1.06)" : "scale(1)", filter: event.isPast ? "grayscale(30%)" : "none", transition:"transform 0.5s cubic-bezier(0.22,1,0.36,1), filter 0.3s" }}/>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-25">{cfg.icon}</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(6,30,50,0.65)]"/>

                    {/* Type badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.62rem] font-bold text-white backdrop-blur-sm"
                         style={{ background: cfg.color + "BB" }}>
                        {cfg.icon} {cfg.label}
                    </div>

                    {/* Countdown / past */}
                    {event.isPast ? (
                        <div className="absolute top-3 right-3 rounded-full bg-black/35 px-2 py-0.5 text-[0.6rem] font-bold text-white/80 backdrop-blur-sm">Past</div>
                    ) : days <= 30 && days > 0 ? (
                        <div className="absolute top-3 right-3 rounded-full bg-[#1E9DC8]/90 px-2.5 py-0.5 text-[0.62rem] font-bold text-white backdrop-blur-sm">
                            {days === 1 ? "Tomorrow!" : `${days}d away`}
                        </div>
                    ) : null}

                    {/* Bookable pill */}
                    {event.isBookable && (
                        <div className="absolute bottom-3 right-3 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[0.58rem] font-bold text-white backdrop-blur-sm">✓ Bookable</div>
                    )}

                    {/* Title */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-base font-bold text-white leading-tight" style={{ fontFamily:"'Playfair Display',serif" }}>
                            {event.name}
                        </h3>
                    </div>
                </div>

                {/* Body */}
                <div className="p-4">
                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-xs text-[#1A6A8A] mb-2">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                            <rect x="1" y="2" width="10" height="9" rx="1.5"/><path d="M4 2V1M8 2V1M1 5h10"/>
                        </svg>
                        <span className="font-semibold text-[#0A3D52]">{fmtDate(event.startDate)}</span>
                        {multiDay && <span>→ {fmtDate(event.endDate)}</span>}
                    </div>

                    {/* Destination + location */}
                    {(dest || event.location) && (
                        <div className="flex items-center gap-1.5 text-xs text-[#1A6A8A] mb-2">
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                <path d="M6 1C4.34 1 3 2.34 3 4c0 2.54 3 7 3 7s3-4.46 3-7c0-1.66-1.34-3-3-3z"/><circle cx="6" cy="4" r="1"/>
                            </svg>
                            {dest?.name}{event.location && dest ? ` · ${event.location}` : event.location}
                        </div>
                    )}

                    {event.description && (
                        <p className="text-sm font-light text-[#1A6A8A] leading-relaxed line-clamp-2 mb-3">{event.description}</p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-[rgba(14,133,178,0.07)]">
                        <div className="flex items-center gap-2">
                            {event.capacity != null && (
                                <span className="text-[0.65rem] text-[#1A6A8A] flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M1 11c0-2.5 2-4 5-4s5 1.5 5 4"/><circle cx="6" cy="4.5" r="2.5"/>
                  </svg>
                                    {event.capacity.toLocaleString()}
                </span>
                            )}
                        </div>
                        <span className="flex items-center gap-1 text-xs font-bold text-[#1E9DC8]">
              Details
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M2 6h8M6 2l4 4-4 4"/>
              </svg>
            </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
const TYPES = ["All", "festival", "religious", "food", "ceremony"];

export default function EventsPublicClient({ events, total, destinations, tours }: {
    events: EventItem[]; total: number; destinations: Destination[]; tours: Tour[];
}) {
    const [tab,      setTab]      = useState("All");
    const [showPast, setShowPast] = useState(false);
    const [selected, setSelected] = useState<EventItem | null>(null);

    const filtered = useMemo(() => events.filter(e => {
        if (!showPast && e.isPast) return false;
        if (tab !== "All" && e.type !== tab) return false;
        return true;
    }), [events, tab, showPast]);

    const upcoming = events.filter(e => !e.isPast);
    const past     = events.filter(e => e.isPast);

    return (
        <div className="min-h-screen bg-white" style={{ paddingTop: 64 }}>
            <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        .hide-scroll::-webkit-scrollbar { display:none }
        .hide-scroll { -ms-overflow-style:none; scrollbar-width:none }
      `}</style>

            {/* ── HERO ── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#EBF8FF] via-white to-[#EBF8FF] px-6 pb-16 pt-24 border-b border-[rgba(14,133,178,0.08)]">
                {/* BG orbs */}
                {[{l:"8%",t:"20%",s:360,c:"rgba(40,184,232,0.10)"},{l:"82%",t:"10%",s:420,c:"rgba(14,133,178,0.08)"},{l:"52%",t:"70%",s:280,c:"rgba(40,184,232,0.07)"}].map((o,i) => (
                    <div key={i} style={{ position:"absolute", left:o.l, top:o.t, width:o.s, height:o.s, borderRadius:"50%", background:`radial-gradient(circle,${o.c} 0%,transparent 70%)`, transform:"translate(-50%,-50%)", pointerEvents:"none" }}/>
                ))}
                <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle,rgba(14,133,178,0.10) 1px,transparent 1px)", backgroundSize:"32px 32px", WebkitMaskImage:"radial-gradient(ellipse 80% 100% at 50% 0%,black 30%,transparent 100%)", maskImage:"radial-gradient(ellipse 80% 100% at 50% 0%,black 30%,transparent 100%)", pointerEvents:"none" }}/>

                <div className="relative mx-auto max-w-6xl">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(14,133,178,0.18)] bg-[#EBF8FF] px-4 py-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#1E9DC8] inline-block" style={{ animation:"pulse 2s infinite" }}/>
                        <span className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#1E9DC8]">Festivals & events</span>
                    </div>
                    <h1 className="mb-4 text-[#0A3D52] leading-tight"
                        style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(2.2rem,4.5vw,3.4rem)", fontWeight:700, letterSpacing:"-0.025em" }}>
                        Experience <em className="italic text-[#1E9DC8]">Ethiopia's</em><br/>living culture
                    </h1>
                    <p className="max-w-lg text-base font-light leading-relaxed text-[#1A6A8A]">
                        From ancient religious ceremonies to vibrant harvest festivals — plan your visit around the moments that define Ethiopian life.
                    </p>

                    {/* Stat pills */}
                    <div className="mt-8 flex flex-wrap gap-3">
                        {[
                            { icon:"🎉", label:"Total events",    val: total         },
                            { icon:"📅", label:"Upcoming events", val: upcoming.length },
                            { icon:"✅", label:"Bookable",         val: events.filter(e => e.isBookable).length },
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

            {/* ── FILTERS ── */}
            <div className="sticky top-16 z-40 border-b border-[rgba(14,133,178,0.08)] bg-white/96 backdrop-blur-lg shadow-[0_2px_16px_rgba(14,133,178,0.06)]">
                <div className="mx-auto max-w-6xl px-6 py-3 flex items-center gap-3 overflow-x-auto hide-scroll">
                    {TYPES.map(type => {
                        const active = tab === type;
                        const cfg    = type === "All" ? { icon:"🌍", label:"All" } : tc(type);
                        return (
                            <button key={type} onClick={() => setTab(type)}
                                    className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium whitespace-nowrap transition-all flex-shrink-0"
                                    style={{ background: active ? "linear-gradient(135deg,#28B8E8,#0A6A94)" : "white", color: active ? "#fff" : "#1A6A8A", border: active ? "none" : "1px solid rgba(14,133,178,0.14)", boxShadow: active ? "0 4px 14px rgba(14,133,178,0.30)" : "none", transform: active ? "translateY(-1px)" : "none" }}>
                                <span>{cfg.icon}</span> {cfg.label}
                            </button>
                        );
                    })}
                    <div className="h-5 w-px bg-[rgba(14,133,178,0.15)] flex-shrink-0"/>
                    <button onClick={() => setShowPast(v => !v)}
                            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium whitespace-nowrap transition-all flex-shrink-0"
                            style={{ background: showPast ? "#F0F9FF" : "white", color: showPast ? "#0A3D52" : "#1A6A8A", border: `1px solid ${showPast ? "#1E9DC8" : "rgba(14,133,178,0.14)"}` }}>
                        {showPast ? "✓ " : ""}Past events
                    </button>
                    <span className="ml-auto text-xs font-light text-[#1A6A8A] flex-shrink-0">{filtered.length} event{filtered.length !== 1 ? "s" : ""}</span>
                </div>
            </div>

            {/* ── GRID ── */}
            <div className="mx-auto max-w-6xl px-6 py-12">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center py-24 text-center">
                        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#EBF8FF] to-[#D6F0FA] text-4xl shadow-[0_8px_32px_rgba(14,133,178,0.12)]"
                             style={{ animation:"float 3s ease-in-out infinite" }}>🎉</div>
                        <p className="mb-2 text-xl font-semibold text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif" }}>No events found</p>
                        <p className="text-sm font-light text-[#1A6A8A]">Try a different filter or check back soon.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map(ev => (
                            <EventCard key={ev.id} event={ev} destinations={destinations} onSelect={() => setSelected(ev)}/>
                        ))}
                    </div>
                )}
            </div>

            {/* ── MODAL ── */}
            {selected && (
                <EventModal
                    event={selected}
                    destinations={destinations}
                    tours={tours}
                    onClose={() => setSelected(null)}
                />
            )}
        </div>
    );
}