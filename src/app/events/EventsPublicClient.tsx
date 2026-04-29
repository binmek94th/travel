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

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string; dark: string; bg: string; border: string }> = {
    festival:  { label:"Festival",  icon:"🎉", color:"#0A6A94", dark:"#28B8E8", bg:"#EBF8FF", border:"rgba(14,133,178,0.20)"   },
    religious: { label:"Religious", icon:"⛪", color:"#6D28D9", dark:"#A78BFA", bg:"#EDE9FE", border:"rgba(109,40,217,0.20)"  },
    food:      { label:"Food",      icon:"🍽", color:"#92400E", dark:"#FCD34D", bg:"#FEF3C7", border:"rgba(146,64,14,0.20)"   },
    ceremony:  { label:"Ceremony",  icon:"🎊", color:"#065F46", dark:"#34D399", bg:"#D1FAE5", border:"rgba(6,95,70,0.20)"     },
};

function tc(type: string) {
    return TYPE_CONFIG[type] ?? { label: type, icon:"📅", color:"#1A6A8A", dark:"#38BDF8", bg:"#F0F9FF", border:"rgba(14,133,178,0.18)" };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
}

function fmtDateLong(iso: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric" });
}

function daysUntil(iso: string) {
    return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

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

// ─── Countdown chip ───────────────────────────────────────────────────────────

function CountdownChip({ startDate, isPast }: { startDate: string; isPast: boolean }) {
    const days = daysUntil(startDate);
    if (isPast) return (
        <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:"rgba(0,0,0,0.45)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:30, padding:"0.25rem 0.7rem", fontSize:"0.6rem", fontWeight:700, color:"rgba(255,255,255,0.7)", letterSpacing:"0.08em", textTransform:"uppercase" }}>
      Past event
    </span>
    );
    if (days <= 0) return null;
    if (days === 1) return (
        <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:"rgba(239,68,68,0.85)", backdropFilter:"blur(8px)", borderRadius:30, padding:"0.25rem 0.7rem", fontSize:"0.62rem", fontWeight:800, color:"#fff", letterSpacing:"0.04em" }}>
      🔥 Tomorrow!
    </span>
    );
    if (days <= 7) return (
        <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:"rgba(245,158,11,0.85)", backdropFilter:"blur(8px)", borderRadius:30, padding:"0.25rem 0.7rem", fontSize:"0.62rem", fontWeight:800, color:"#fff" }}>
      ⚡ {days} days
    </span>
    );
    if (days <= 30) return (
        <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:"rgba(14,133,178,0.80)", backdropFilter:"blur(8px)", borderRadius:30, padding:"0.25rem 0.7rem", fontSize:"0.62rem", fontWeight:700, color:"#fff" }}>
      {days}d away
    </span>
    );
    return null;
}

// ─── Event card ───────────────────────────────────────────────────────────────

function EventCard({ event, destinations, onSelect, index }: {
    event: EventItem; destinations: Destination[]; onSelect: () => void; index: number;
}) {
    const { ref, visible } = useReveal(index * 60);
    const [hovered, setHovered] = useState(false);
    const cfg  = tc(event.type);
    const dest = destinations.find(d => d.id === event.destinationId);
    const img  = event.images?.[0] ?? dest?.images?.[0];
    const multiDay = event.endDate && event.endDate !== event.startDate;
    const isFeature = index % 7 === 0; // every 7th spans 2 cols

    return (
        <div
            ref={ref}
            style={{
                opacity:    visible ? 1 : 0,
                transform:  visible ? "translateY(0) scale(1)" : "translateY(28px) scale(0.97)",
                transition: "opacity 0.55s ease, transform 0.55s cubic-bezier(0.22,1,0.36,1)",
                gridColumn: isFeature ? "span 2" : "span 1",
            }}
        >
            <div
                onClick={onSelect}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    borderRadius: 22, overflow:"hidden", cursor:"pointer", background:"#fff",
                    border: hovered ? "1.5px solid rgba(14,133,178,0.35)" : "1.5px solid rgba(14,133,178,0.08)",
                    boxShadow: hovered
                        ? "0 24px 56px rgba(14,133,178,0.18), 0 4px 16px rgba(14,133,178,0.08)"
                        : "0 2px 12px rgba(14,133,178,0.06)",
                    transform:  hovered ? "translateY(-7px)" : "translateY(0)",
                    transition: "all 0.28s cubic-bezier(0.22,1,0.36,1)",
                }}
            >
                {/* Image */}
                <div style={{ position:"relative", height: isFeature ? 280 : 210, overflow:"hidden", background:`linear-gradient(135deg,${cfg.color}33,${cfg.color}66)` }}>
                    {img ? (
                        <img src={img} alt={event.name} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", transform: hovered ? "scale(1.07)" : "scale(1)", filter: event.isPast ? "grayscale(35%)" : "none", transition:"transform 0.55s cubic-bezier(0.22,1,0.36,1), filter 0.3s" }}/>
                    ) : (
                        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"4rem", opacity:0.2 }}>{cfg.icon}</div>
                    )}

                    {/* Gradient layers */}
                    <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, transparent 35%, rgba(6,20,40,0.78) 100%)" }}/>

                    {/* Top row badges */}
                    <div style={{ position:"absolute", top:14, left:14, right:14, display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
                        {/* Type pill */}
                        <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(255,255,255,0.15)", backdropFilter:"blur(14px)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:30, padding:"0.28rem 0.75rem" }}>
                            <span style={{ fontSize:"0.78rem" }}>{cfg.icon}</span>
                            <span style={{ fontSize:"0.62rem", fontWeight:700, color:"#fff", letterSpacing:"0.06em", textTransform:"uppercase" }}>{cfg.label}</span>
                        </div>

                        <CountdownChip startDate={event.startDate} isPast={event.isPast}/>
                    </div>

                    {/* Bookable badge */}
                    {event.isBookable && (
                        <div style={{ position:"absolute", bottom:56, right:14, display:"flex", alignItems:"center", gap:4, background:"rgba(16,185,129,0.88)", backdropFilter:"blur(8px)", borderRadius:20, padding:"0.22rem 0.65rem" }}>
                            <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M2 5l2.5 2.5L8 2.5"/></svg>
                            <span style={{ fontSize:"0.58rem", fontWeight:800, color:"#fff", letterSpacing:"0.05em" }}>BOOKABLE</span>
                        </div>
                    )}

                    {/* Bottom content */}
                    <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"1.1rem 1.25rem" }}>
                        <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize: isFeature ? "1.25rem" : "1rem", fontWeight:700, color:"#fff", lineHeight:1.25, marginBottom:"0.35rem", textShadow:"0 2px 12px rgba(0,0,0,0.3)" }}>
                            {event.name}
                        </h3>
                        <div style={{ display:"flex", alignItems:"center", gap:"0.4rem", flexWrap:"wrap" }}>
                            {/* Date */}
                            <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:"0.65rem", color:"rgba(255,255,255,0.8)", fontWeight:500 }}>
                <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round"><rect x="1" y="2" width="10" height="9" rx="1.5"/><path d="M4 2V1M8 2V1M1 5h10"/></svg>
                                {fmtDate(event.startDate)}{multiDay ? ` → ${fmtDate(event.endDate)}` : ""}
              </span>
                            {dest && (
                                <>
                                    <span style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.6rem" }}>·</span>
                                    <span style={{ fontSize:"0.65rem", color:"rgba(255,255,255,0.7)", fontWeight:400 }}>{dest.name}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding:"1rem 1.25rem" }}>
                    {event.description && (
                        <p style={{ fontSize:"0.82rem", color:"#1A6A8A", lineHeight:1.65, fontWeight:300, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden", marginBottom:"0.9rem" }}>
                            {event.description}
                        </p>
                    )}

                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:"0.75rem", borderTop:"1px solid rgba(14,133,178,0.07)" }}>
                        <div style={{ display:"flex", gap:"0.5rem" }}>
                            {event.capacity != null && (
                                <span style={{ display:"inline-flex", alignItems:"center", gap:3, background:"rgba(14,133,178,0.06)", borderRadius:8, padding:"0.2rem 0.55rem", fontSize:"0.67rem", color:"#1A6A8A" }}>
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 11c0-2.5 2-4 5-4s5 1.5 5 4"/><circle cx="6" cy="4.5" r="2.5"/></svg>
                                    {event.capacity.toLocaleString()}
                </span>
                            )}
                            {event.location && (
                                <span style={{ display:"inline-flex", alignItems:"center", gap:3, background:"rgba(14,133,178,0.06)", borderRadius:8, padding:"0.2rem 0.55rem", fontSize:"0.67rem", color:"#1A6A8A", maxWidth:120, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 1C4.34 1 3 2.34 3 4c0 2.54 3 7 3 7s3-4.46 3-7c0-1.66-1.34-3-3-3z"/></svg>
                                    {event.location}
                </span>
                            )}
                        </div>

                        <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:"0.78rem", fontWeight:700, color:"#1E9DC8", opacity: hovered ? 1 : 0.65, transition:"opacity 0.2s" }}>
              Details
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 6.5h9M7 3l3.5 3.5L7 10"/></svg>
            </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Event modal ──────────────────────────────────────────────────────────────

function EventModal({ event, destinations, tours, onClose }: {
    event: EventItem; destinations: Destination[]; tours: Tour[]; onClose: () => void;
}) {
    const [activeImg, setActiveImg] = useState(0);
    const dest     = destinations.find(d => d.id === event.destinationId);
    const tour     = tours.find(t => t.id === event.linkedTourId);
    const cfg      = tc(event.type);
    const days     = daysUntil(event.startDate);
    const multiDay = event.endDate && event.endDate !== event.startDate;
    const allImages = event.images?.length ? event.images : dest?.images?.slice(0, 1) ?? [];

    useEffect(() => {
        document.body.style.overflow = "hidden";
        const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", fn);
        return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", fn); };
    }, [onClose]);

    return (
        <div
            style={{ position:"fixed", inset:0, zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            {/* Backdrop */}
            <div style={{ position:"absolute", inset:0, background:"rgba(6,18,36,0.70)", backdropFilter:"blur(8px)" }}/>

            {/* Dialog */}
            <div style={{ position:"relative", width:"100%", maxWidth:660, maxHeight:"92vh", overflowY:"auto", background:"#fff", borderRadius:24, boxShadow:"0 40px 100px rgba(6,20,40,0.35)", animation:"modal-pop 0.28s cubic-bezier(0.22,1,0.36,1) both" }}>
                <style>{`@keyframes modal-pop { from { opacity:0; transform:scale(0.94) translateY(20px) } to { opacity:1; transform:scale(1) translateY(0) } }`}</style>

                {/* ── Hero ─────────────────────────────────────────────────────────── */}
                <div style={{ position:"relative", height:260, overflow:"hidden", borderRadius:"24px 24px 0 0", background:`linear-gradient(135deg,${cfg.color},#061E32)` }}>
                    {allImages.length > 0 ? (
                        <img src={allImages[activeImg]} alt={event.name} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", transition:"opacity 0.3s ease" }}/>
                    ) : (
                        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"5rem", opacity:0.15 }}>{cfg.icon}</div>
                    )}
                    <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, transparent 30%, rgba(6,18,36,0.80) 100%)" }}/>

                    {/* Top */}
                    <div style={{ position:"absolute", top:16, left:16, right:16, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(255,255,255,0.15)", backdropFilter:"blur(14px)", border:"1px solid rgba(255,255,255,0.22)", borderRadius:30, padding:"0.3rem 0.8rem" }}>
                            <span>{cfg.icon}</span>
                            <span style={{ fontSize:"0.65rem", fontWeight:700, color:"#fff", letterSpacing:"0.08em", textTransform:"uppercase" }}>{cfg.label}</span>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <CountdownChip startDate={event.startDate} isPast={event.isPast}/>
                            <button onClick={onClose} style={{ width:34, height:34, borderRadius:"50%", background:"rgba(0,0,0,0.35)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg>
                            </button>
                        </div>
                    </div>

                    {/* Bottom */}
                    <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"1.25rem 1.5rem" }}>
                        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.6rem", fontWeight:700, color:"#fff", lineHeight:1.2, letterSpacing:"-0.02em", marginBottom:"0.4rem", textShadow:"0 2px 16px rgba(0,0,0,0.4)" }}>
                            {event.name}
                        </h2>
                        {dest && (
                            <p style={{ display:"flex", alignItems:"center", gap:5, fontSize:"0.8rem", color:"rgba(255,255,255,0.72)", fontWeight:400 }}>
                                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 1C4.34 1 3 2.34 3 4c0 2.54 3 7 3 7s3-4.46 3-7c0-1.66-1.34-3-3-3z"/><circle cx="6" cy="4" r="1"/></svg>
                                {dest.name}{dest.region ? ` · ${dest.region}` : ""}
                            </p>
                        )}
                    </div>
                </div>

                {/* Thumbnails */}
                {allImages.length > 1 && (
                    <div style={{ display:"flex", gap:6, padding:"0.6rem 1.25rem", background:"#F8FCFF", borderBottom:"1px solid rgba(14,133,178,0.08)", overflowX:"auto" }}>
                        {allImages.map((img, i) => (
                            <button key={i} onClick={() => setActiveImg(i)}
                                    style={{ width:60, height:44, flexShrink:0, borderRadius:10, overflow:"hidden", border: i === activeImg ? "2px solid #1E9DC8" : "2px solid transparent", opacity: i === activeImg ? 1 : 0.55, cursor:"pointer", transition:"all 0.2s" }}>
                                <img src={img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Body ─────────────────────────────────────────────────────────── */}
                <div style={{ padding:"1.5rem", display:"flex", flexDirection:"column", gap:"1.25rem" }}>

                    {/* Info grid */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.65rem" }}>
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
                                icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 8l4 4 8-8"/></svg>,
                                label: "Status",
                                value: "Bookings available",
                            }] : []),
                        ].map(({ icon, label, value }) => (
                            <div key={label} style={{ display:"flex", alignItems:"flex-start", gap:10, background:"#F8FCFF", border:"1px solid rgba(14,133,178,0.09)", borderRadius:14, padding:"0.8rem" }}>
                                <div style={{ width:30, height:30, flexShrink:0, borderRadius:9, background:"#EBF8FF", display:"flex", alignItems:"center", justifyContent:"center", color:"#1E9DC8" }}>
                                    {icon}
                                </div>
                                <div>
                                    <p style={{ fontSize:"0.58rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"#1A6A8A", marginBottom:3 }}>{label}</p>
                                    <p style={{ fontSize:"0.82rem", fontWeight:600, color:"#0A3D52", lineHeight:1.3 }}>{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Description */}
                    {event.description && (
                        <div>
                            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1rem", fontWeight:700, color:"#0A3D52", marginBottom:"0.5rem" }}>About</h3>
                            <p style={{ fontSize:"0.85rem", fontWeight:300, color:"#1A6A8A", lineHeight:1.75, whiteSpace:"pre-line" }}>{event.description}</p>
                        </div>
                    )}

                    {/* Linked tour CTA */}
                    {tour && event.isBookable && (
                        <div style={{ borderRadius:18, background:"linear-gradient(135deg,#0A3D52,#0E85B2)", padding:"1.25rem" }}>
                            <p style={{ fontSize:"0.62rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.14em", color:"rgba(255,255,255,0.55)", marginBottom:"0.6rem" }}>Book this experience</p>
                            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:"1rem" }}>
                                <div style={{ width:56, height:44, flexShrink:0, borderRadius:10, overflow:"hidden", background:"rgba(255,255,255,0.10)" }}>
                                    {tour.images?.[0]
                                        ? <img src={tour.images[0]} alt={tour.title} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                                        : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.2rem" }}>🧭</div>
                                    }
                                </div>
                                <div>
                                    <p style={{ fontFamily:"'Playfair Display',serif", fontSize:"0.9rem", fontWeight:700, color:"#fff" }}>{tour.title}</p>
                                    <p style={{ fontSize:"0.72rem", color:"rgba(255,255,255,0.65)" }}>{tour.durationDays}d · from ${tour.priceUSD.toLocaleString()}</p>
                                </div>
                            </div>
                            <Link href={`/tours/${tour.id}`}
                                  style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, background:"rgba(255,255,255,0.95)", borderRadius:12, padding:"0.7rem", fontSize:"0.85rem", fontWeight:700, color:"#0A3D52", textDecoration:"none", transition:"all 0.2s" }}>
                                Book tour
                                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 6.5h9M7 3l3.5 3.5L7 10"/></svg>
                            </Link>
                        </div>
                    )}

                    {/* Destination link */}
                    {dest && (
                        <Link href={`/destinations/${dest.id}`}
                              style={{ display:"flex", alignItems:"center", justifyContent:"space-between", borderRadius:14, border:"1px solid rgba(14,133,178,0.12)", background:"#fff", padding:"0.85rem 1rem", textDecoration:"none", transition:"all 0.2s" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                                <div style={{ width:52, height:40, flexShrink:0, borderRadius:10, overflow:"hidden", background:"linear-gradient(135deg,#EBF8FF,#D6F0FA)" }}>
                                    {dest.images?.[0]
                                        ? <img src={dest.images[0]} alt={dest.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                                        : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem" }}>📍</div>
                                    }
                                </div>
                                <div>
                                    <p style={{ fontSize:"0.85rem", fontWeight:700, color:"#0A3D52" }}>{dest.name}</p>
                                    {dest.region && <p style={{ fontSize:"0.72rem", color:"#1A6A8A" }}>{dest.region}</p>}
                                </div>
                            </div>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#1E9DC8" strokeWidth="2.2" strokeLinecap="round"><path d="M2 7h10M8 3l4 4-4 4"/></svg>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Featured upcoming strip ──────────────────────────────────────────────────

function FeaturedStrip({ events, destinations, onSelect }: {
    events: EventItem[]; destinations: Destination[]; onSelect: (e: EventItem) => void;
}) {
    const upcoming = events.filter(e => !e.isPast && daysUntil(e.startDate) <= 60 && daysUntil(e.startDate) > 0).slice(0, 4);
    if (upcoming.length === 0) return null;

    return (
        <div style={{ background:"linear-gradient(135deg,#0A3D52,#0A6A94)", padding:"2rem", borderBottom:"none" }}>
            <div style={{ maxWidth:1100, margin:"0 auto" }}>
                <p style={{ fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.18em", color:"rgba(255,255,255,0.5)", marginBottom:"0.6rem" }}>
                    Coming up soon
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:"0.85rem" }}>
                    {upcoming.map(ev => {
                        const cfg  = tc(ev.type);
                        const dest = destinations.find(d => d.id === ev.destinationId);
                        const days = daysUntil(ev.startDate);
                        return (
                            <button key={ev.id} onClick={() => onSelect(ev)}
                                    style={{ background:"rgba(255,255,255,0.08)", backdropFilter:"blur(12px)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:16, padding:"0.85rem 1rem", textAlign:"left", cursor:"pointer", transition:"all 0.2s" }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.14)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
                                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.4rem" }}>
                                    <span style={{ fontSize:"1rem" }}>{cfg.icon}</span>
                                    <span style={{ fontSize:"0.62rem", fontWeight:700, color:days <= 7 ? "#FCD34D" : "rgba(255,255,255,0.55)" }}>
                    {days === 1 ? "Tomorrow" : `${days}d`}
                  </span>
                                </div>
                                <p style={{ fontFamily:"'Playfair Display',serif", fontSize:"0.88rem", fontWeight:700, color:"#fff", lineHeight:1.3, marginBottom:"0.25rem" }}>
                                    {ev.name}
                                </p>
                                <p style={{ fontSize:"0.65rem", color:"rgba(255,255,255,0.55)" }}>
                                    {fmtDate(ev.startDate)}{dest ? ` · ${dest.name}` : ""}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

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

    const upcoming  = events.filter(e => !e.isPast);
    const bookable  = events.filter(e => e.isBookable);

    return (
        <div style={{ minHeight:"100vh", background:"#F8FBFF", paddingTop:64 }}>
            <style>{`
        @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        .scroll-hide::-webkit-scrollbar { display:none }
        .scroll-hide { -ms-overflow-style:none; scrollbar-width:none }
      `}</style>

            {/* ── HERO ──────────────────────────────────────────────────────────── */}
            <div style={{ position:"relative", overflow:"hidden", background:"linear-gradient(145deg,#061E32 0%,#0A3D52 45%,#0A6A94 100%)", padding:"5.5rem 2rem 4.5rem" }}>

                {/* Orbs */}
                {[
                    { left:"4%",  top:"15%", size:420, color:"rgba(40,184,232,0.12)"  },
                    { left:"78%", top:"-15%",size:520, color:"rgba(14,133,178,0.10)"  },
                    { left:"45%", top:"70%", size:320, color:"rgba(30,157,200,0.08)"  },
                ].map((o, i) => (
                    <div key={i} style={{ position:"absolute", left:o.left, top:o.top, width:o.size, height:o.size, borderRadius:"50%", background:`radial-gradient(circle,${o.color} 0%,transparent 70%)`, transform:"translate(-50%,-50%)", pointerEvents:"none" }}/>
                ))}

                {/* Dot texture */}
                <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle,rgba(255,255,255,0.06) 1px,transparent 1px)", backgroundSize:"26px 26px", WebkitMaskImage:"radial-gradient(ellipse 85% 100% at 50% 0%,black 40%,transparent 100%)", maskImage:"radial-gradient(ellipse 85% 100% at 50% 0%,black 40%,transparent 100%)", pointerEvents:"none" }}/>

                <div style={{ maxWidth:1100, margin:"0 auto", position:"relative" }}>
                    <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.10)", backdropFilter:"blur(12px)", border:"1px solid rgba(255,255,255,0.16)", borderRadius:30, padding:"0.4rem 1rem", marginBottom:"1.5rem", animation:"fadeIn 0.5s ease both" }}>
                        <span style={{ width:6, height:6, borderRadius:"50%", background:"#10B981", display:"inline-block", animation:"pulse 2s infinite" }}/>
                        <span style={{ fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.18em", color:"rgba(255,255,255,0.82)", textTransform:"uppercase" }}>Festivals & events</span>
                    </div>

                    <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(2.4rem,5vw,3.8rem)", fontWeight:700, color:"#fff", letterSpacing:"-0.03em", lineHeight:1.15, marginBottom:"1.1rem", animation:"fadeIn 0.5s 0.1s ease both", animationFillMode:"both" }}>
                        Experience <em style={{ fontStyle:"italic", color:"#28B8E8" }}>Ethiopia's</em><br/>
                        living culture
                    </h1>

                    <p style={{ fontSize:"1rem", fontWeight:300, color:"rgba(235,248,255,0.72)", maxWidth:500, lineHeight:1.75, marginBottom:"2.5rem", animation:"fadeIn 0.5s 0.2s ease both", animationFillMode:"both" }}>
                        Ancient religious ceremonies, vibrant harvest festivals, and extraordinary cultural moments — plan your journey around them.
                    </p>

                    {/* Stats */}
                    <div style={{ display:"flex", flexWrap:"wrap", gap:"0.75rem", animation:"fadeIn 0.5s 0.3s ease both", animationFillMode:"both" }}>
                        {[
                            { icon:"🎉", label:"Total events",    val: total          },
                            { icon:"📅", label:"Coming up",       val: upcoming.length },
                            { icon:"✅", label:"Bookable",         val: bookable.length },
                        ].map(({ icon, label, val }) => (
                            <div key={label} style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,0.08)", backdropFilter:"blur(12px)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:16, padding:"0.65rem 1.1rem" }}>
                                <span style={{ fontSize:"1.1rem" }}>{icon}</span>
                                <div>
                                    <div style={{ fontSize:"1rem", fontWeight:800, color:"#fff", lineHeight:1 }}>{val}</div>
                                    <div style={{ fontSize:"0.62rem", fontWeight:500, color:"rgba(255,255,255,0.48)", textTransform:"uppercase", letterSpacing:"0.08em", marginTop:2 }}>{label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── FEATURED STRIP ──────────────────────────────────────────────────── */}
            <FeaturedStrip events={events} destinations={destinations} onSelect={setSelected}/>

            {/* ── FILTER BAR ──────────────────────────────────────────────────────── */}
            <div style={{ position:"sticky", top:64, zIndex:40, background:"rgba(248,251,255,0.96)", backdropFilter:"blur(16px)", borderBottom:"1px solid rgba(14,133,178,0.08)", boxShadow:"0 2px 16px rgba(14,133,178,0.06)", padding:"0.75rem 2rem" }}>
                <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", gap:"0.5rem", overflowX:"auto" }} className="scroll-hide">
                    {TYPES.map(type => {
                        const active = tab === type;
                        const cfg    = type === "All" ? { icon:"🌍", label:"All" } : tc(type);
                        return (
                            <button key={type} onClick={() => setTab(type)}
                                    style={{ display:"flex", alignItems:"center", gap:6, borderRadius:30, padding:"0.42rem 1rem", fontSize:"0.8rem", fontWeight:600, whiteSpace:"nowrap", flexShrink:0, cursor:"pointer", transition:"all 0.18s", border: active ? "none" : "1px solid rgba(14,133,178,0.16)", background: active ? "linear-gradient(135deg,#28B8E8,#0A6A94)" : "transparent", color: active ? "#fff" : "#1A6A8A", boxShadow: active ? "0 3px 12px rgba(14,133,178,0.30)" : "none", transform: active ? "translateY(-1px)" : "none" }}>
                                <span style={{ fontSize:"0.9rem" }}>{cfg.icon}</span>
                                {cfg.label}
                            </button>
                        );
                    })}

                    <div style={{ height:18, width:1, background:"rgba(14,133,178,0.15)", flexShrink:0, margin:"0 0.25rem" }}/>

                    <button onClick={() => setShowPast(v => !v)}
                            style={{ display:"flex", alignItems:"center", gap:5, borderRadius:30, padding:"0.42rem 1rem", fontSize:"0.8rem", fontWeight:600, whiteSpace:"nowrap", flexShrink:0, cursor:"pointer", transition:"all 0.18s", background: showPast ? "#EBF8FF" : "transparent", color: showPast ? "#0A3D52" : "#1A6A8A", border:`1px solid ${showPast ? "#1E9DC8" : "rgba(14,133,178,0.16)"}` }}>
                        {showPast && <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 5l2 2.5L8 2"/></svg>}
                        Past events
                    </button>

                    <span style={{ marginLeft:"auto", fontSize:"0.72rem", color:"#94A3B8", flexShrink:0 }}>
            {filtered.length} event{filtered.length !== 1 ? "s" : ""}
          </span>
                </div>
            </div>

            {/* ── GRID ─────────────────────────────────────────────────────────────── */}
            <div style={{ maxWidth:1100, margin:"0 auto", padding:"2.5rem 2rem 5rem" }}>
                {filtered.length === 0 ? (
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"6rem 1rem", textAlign:"center" }}>
                        <div style={{ width:84, height:84, borderRadius:"50%", background:"linear-gradient(135deg,#EBF8FF,#D6F0FA)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2.5rem", marginBottom:"1.5rem", boxShadow:"0 12px 40px rgba(14,133,178,0.14)", animation:"float 3s ease-in-out infinite" }}>🎉</div>
                        <p style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.35rem", fontWeight:700, color:"#0A3D52", marginBottom:"0.5rem" }}>No events found</p>
                        <p style={{ fontSize:"0.88rem", color:"#1A6A8A", fontWeight:300 }}>Try a different filter or check back soon.</p>
                    </div>
                ) : (
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"1.25rem", alignItems:"start" }}>
                        {filtered.map((ev, i) => (
                            <EventCard key={ev.id} event={ev} destinations={destinations} onSelect={() => setSelected(ev)} index={i}/>
                        ))}
                    </div>
                )}
            </div>

            {/* ── MODAL ─────────────────────────────────────────────────────────────── */}
            {selected && (
                <EventModal event={selected} destinations={destinations} tours={tours} onClose={() => setSelected(null)}/>
            )}
        </div>
    );
}