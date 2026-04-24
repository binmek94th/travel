// src/app/bookings/BookingsClient.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";

type Booking = {
    id: string;
    tourId: string;
    status: "pending_payment" | "confirmed" | "completed" | "cancelled" | "expired";
    startDate: string;
    endDate: string;
    travelers: number;
    totalAmountUSD: number;
    depositAmountUSD: number;
    remainingAmountUSD: number;
    depositPaid: boolean;
    remainingPaid: boolean;
    emergencyName: string;
    emergencyPhone: string;
    specialRequests?: string;
    stripeSessionId?: string;
    createdAt: string;
    userEmail: string;
    userName: string;
};

type Tour = {
    id: string;
    title: string;
    images: string[];
    durationDays: number;
    categories: string[];
    operatorId: string;
};

type Props = { bookings: Booking[]; toursMap: Record<string, Tour> };

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
    return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtDateLong(iso: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function daysUntil(iso: string) {
    const diff = new Date(iso).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function useReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current; if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.05 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return { ref, visible };
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS = {
    pending_payment: { label: "Awaiting payment",  color: "#F59E0B", bg: "#FEF3C7", dot: "#F59E0B" },
    confirmed:       { label: "Confirmed",          color: "#10B981", bg: "#D1FAE5", dot: "#10B981" },
    completed:       { label: "Completed",          color: "#6366F1", bg: "#EDE9FE", dot: "#6366F1" },
    cancelled:       { label: "Cancelled",          color: "#EF4444", bg: "#FEE2E2", dot: "#EF4444" },
    expired:         { label: "Expired",            color: "#9CA3AF", bg: "#F3F4F6", dot: "#9CA3AF" },
} as const;

// ── BOOKING DETAIL MODAL ──────────────────────────────────────────────────────
function BookingModal({ booking, tour, onClose, onCancel }: {
    booking: Booking; tour: Tour | null; onClose: () => void; onCancel: () => void;
}) {
    const ref        = useRef<HTMLDivElement>(null);
    const s          = STATUS[booking.status] ?? STATUS.confirmed;
    const days       = booking.startDate ? daysUntil(booking.startDate) : null;
    const canCancel  = ["confirmed", "pending_payment"].includes(booking.status);
    const canPayRem  = booking.status === "confirmed" && booking.depositPaid && !booking.remainingPaid;
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", fn);
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", fn); document.body.style.overflow = ""; };
    }, [onClose]);

    async function handleCancel() {
        if (!confirm(`Cancel this booking for ${tour?.title ?? "this tour"}? This cannot be undone.`)) return;
        setCancelling(true);
        try {
            const res = await fetch(`/api/bookings/${booking.id}/cancel`, { method: "POST" });
            if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
            toast.success("Booking cancelled");
            onCancel();
            onClose();
        } catch (err: any) {
            toast.error(err.message ?? "Failed to cancel");
        } finally {
            setCancelling(false);
        }
    }

    return (
        <div style={{ position:"fixed", inset:0, zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}
             onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={{ position:"absolute", inset:0, background:"rgba(10,61,82,0.55)", backdropFilter:"blur(6px)" }}/>
            <div ref={ref} style={{ position:"relative", width:"100%", maxWidth:640, maxHeight:"90vh", overflowY:"auto", background:"#fff", borderRadius:20, boxShadow:"0 32px 80px rgba(14,133,178,0.22)", animation:"modal-pop 0.25s cubic-bezier(0.22,1,0.36,1) both" }}>
                <style>{`@keyframes modal-pop{from{opacity:0;transform:scale(0.95) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>

                {/* Header */}
                <div style={{ background:"linear-gradient(135deg,#0A3D52,#0E85B2)", borderRadius:"20px 20px 0 0", padding:"1.5rem" }}>
                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem" }}>
                        <div>
                            <p style={{ fontSize:"0.65rem", fontWeight:700, letterSpacing:"0.14em", color:"rgba(235,248,255,0.6)", textTransform:"uppercase", marginBottom:"0.3rem" }}>
                                Booking #{booking.id.slice(0, 8).toUpperCase()}
                            </p>
                            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.3rem", fontWeight:700, color:"#fff", lineHeight:1.2 }}>
                                {tour?.title ?? "Tour"}
                            </h2>
                        </div>
                        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:8, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg>
                        </button>
                    </div>

                    {/* Status + countdown */}
                    <div style={{ marginTop:"1rem", display:"flex", alignItems:"center", gap:"0.75rem", flexWrap:"wrap" }}>
            <span style={{ display:"inline-flex", alignItems:"center", gap:"0.4rem", background:"rgba(255,255,255,0.15)", borderRadius:20, padding:"0.3rem 0.8rem", fontSize:"0.72rem", fontWeight:700, color:"#fff" }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:s.dot }}/>
                {s.label}
            </span>
                        {booking.status === "confirmed" && days !== null && days > 0 && (
                            <span style={{ fontSize:"0.72rem", color:"rgba(235,248,255,0.75)", fontWeight:500 }}>
                {days} day{days !== 1 ? "s" : ""} to go 🎒
              </span>
                        )}
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding:"1.5rem", display:"flex", flexDirection:"column", gap:"1.25rem" }}>

                    {/* Tour image strip */}
                    {tour?.images?.[0] && (
                        <div style={{ borderRadius:12, overflow:"hidden", height:140, position:"relative" }}>
                            <img src={tour.images[0]} alt={tour.title} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                            <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(6,30,50,0.5), transparent)" }}/>
                        </div>
                    )}

                    {/* Trip details grid */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
                        {[
                            { label:"Start date",  value: fmtDate(booking.startDate) },
                            { label:"End date",    value: fmtDate(booking.endDate)   },
                            { label:"Duration",    value: `${tour?.durationDays ?? "—"} day${(tour?.durationDays ?? 0) !== 1 ? "s" : ""}` },
                            { label:"Travelers",   value: `${booking.travelers} person${booking.travelers !== 1 ? "s" : ""}` },
                            { label:"Emergency",   value: booking.emergencyName },
                            { label:"Phone",       value: booking.emergencyPhone },
                        ].map(({ label, value }) => (
                            <div key={label} style={{ background:"#F8FCFF", borderRadius:10, padding:"0.75rem" }}>
                                <p style={{ fontSize:"0.62rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#1A6A8A", marginBottom:"0.2rem" }}>{label}</p>
                                <p style={{ fontSize:"0.83rem", fontWeight:600, color:"#0A3D52" }}>{value}</p>
                            </div>
                        ))}
                    </div>

                    {booking.specialRequests && (
                        <div style={{ background:"#F8FCFF", borderRadius:10, padding:"0.75rem" }}>
                            <p style={{ fontSize:"0.62rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#1A6A8A", marginBottom:"0.3rem" }}>Special requests</p>
                            <p style={{ fontSize:"0.83rem", color:"#0A3D52" }}>{booking.specialRequests}</p>
                        </div>
                    )}

                    {/* Payment breakdown */}
                    <div style={{ border:"1px solid rgba(14,133,178,0.12)", borderRadius:12, overflow:"hidden" }}>
                        <div style={{ background:"rgba(14,133,178,0.04)", padding:"0.65rem 1rem", borderBottom:"1px solid rgba(14,133,178,0.08)" }}>
                            <p style={{ fontSize:"0.72rem", fontWeight:700, color:"#0A3D52", letterSpacing:"0.06em", textTransform:"uppercase" }}>Payment</p>
                        </div>
                        <div style={{ padding:"0.75rem 1rem", display:"flex", flexDirection:"column", gap:"0.6rem" }}>
                            {[
                                { label:"Total price",         value:`$${fmt(booking.totalAmountUSD)}`,    highlight:false },
                                { label:"Deposit (20%)",        value:`$${fmt(booking.depositAmountUSD)}`,  highlight:false, badge: booking.depositPaid ? "✓ Paid" : "Pending" },
                                { label:"Remaining balance",   value:`$${fmt(booking.remainingAmountUSD)}`, highlight:!booking.remainingPaid, badge: booking.remainingPaid ? "✓ Paid" : undefined },
                            ].map(({ label, value, highlight, badge }) => (
                                <div key={label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                                    <span style={{ fontSize:"0.83rem", color:"#1A6A8A" }}>{label}</span>
                                    <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                                        {badge && (
                                            <span style={{ fontSize:"0.6rem", fontWeight:700, padding:"0.15rem 0.5rem", borderRadius:20, background: badge.includes("✓") ? "#D1FAE5" : "#FEF3C7", color: badge.includes("✓") ? "#065F46" : "#92400E" }}>
                        {badge}
                      </span>
                                        )}
                                        <span style={{ fontSize:"0.9rem", fontWeight:700, color: highlight ? "#1E9DC8" : "#0A3D52" }}>{value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
                        <Link href={`/bookings/${booking.id}/confirmation`}
                              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", padding:"0.85rem", borderRadius:12, background:"linear-gradient(135deg,#28B8E8,#0A6A94)", color:"#fff", fontWeight:700, fontSize:"0.85rem", textDecoration:"none", boxShadow:"0 4px 16px rgba(14,133,178,0.32)", transition:"all 0.2s" }}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 7l3 3 6-6"/></svg>
                            View confirmation
                        </Link>

                        {canPayRem && (
                            <a href={`/api/bookings/${booking.id}/pay-remaining`}
                               style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", padding:"0.85rem", borderRadius:12, background:"linear-gradient(135deg,#10B981,#065F46)", color:"#fff", fontWeight:700, fontSize:"0.85rem", textDecoration:"none", boxShadow:"0 4px 16px rgba(16,185,129,0.28)" }}>
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="12" height="8" rx="1.5"/><path d="M4 4V3a2 2 0 1 1 6 0v1"/></svg>
                                Pay remaining ${fmt(booking.remainingAmountUSD)}
                            </a>
                        )}

                        {booking.status === "pending_payment" && (
                            <a href={`/api/bookings/${booking.id}/resume-payment`}
                               style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", padding:"0.85rem", borderRadius:12, background:"linear-gradient(135deg,#F59E0B,#D97706)", color:"#fff", fontWeight:700, fontSize:"0.85rem", textDecoration:"none" }}>
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="12" height="8" rx="1.5"/><path d="M4 4V3a2 2 0 1 1 6 0v1"/></svg>
                                Complete payment
                            </a>
                        )}

                        {canCancel && (
                            <button onClick={handleCancel} disabled={cancelling}
                                    style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", padding:"0.85rem", borderRadius:12, border:"1.5px solid rgba(239,68,68,0.25)", background:"#FEF2F2", color:"#EF4444", fontWeight:600, fontSize:"0.85rem", cursor:"pointer", opacity:cancelling?0.6:1, transition:"all 0.2s" }}>
                                {cancelling ? (
                                    <div style={{ width:14, height:14, borderRadius:"50%", border:"2px solid rgba(239,68,68,0.2)", borderTop:"2px solid #EF4444", animation:"spin 0.7s linear infinite" }}/>
                                ) : (
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg>
                                )}
                                {cancelling ? "Cancelling…" : "Cancel booking"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── BOOKING CARD ──────────────────────────────────────────────────────────────
function BookingCard({ booking, tour, onSelect }: { booking: Booking; tour: Tour | null; onSelect: () => void }) {
    const { ref, visible } = useReveal();
    const [hovered, setHovered] = useState(false);
    const s       = STATUS[booking.status] ?? STATUS.confirmed;
    const days    = booking.startDate ? daysUntil(booking.startDate) : null;
    const isPast  = booking.status === "completed" || (booking.startDate && daysUntil(booking.startDate) < 0 && booking.status === "confirmed");

    return (
        <div ref={ref} style={{ opacity:visible?1:0, transform:visible?"translateY(0)":"translateY(24px)", transition:"opacity 0.55s ease, transform 0.55s cubic-bezier(0.22,1,0.36,1)" }}>
            <div onClick={onSelect}
                 style={{ borderRadius:18, border:hovered?"1px solid rgba(14,133,178,0.28)":"1px solid rgba(14,133,178,0.10)", background:"#fff", overflow:"hidden", cursor:"pointer", boxShadow:hovered?"0 20px 48px rgba(14,133,178,0.14)":"0 2px 10px rgba(14,133,178,0.06)", transform:hovered?"translateY(-5px)":"none", transition:"all 0.25s cubic-bezier(0.22,1,0.36,1)" }}
                 onMouseEnter={() => setHovered(true)}
                 onMouseLeave={() => setHovered(false)}>

                {/* Image */}
                <div style={{ position:"relative", height:130, overflow:"hidden", background:"linear-gradient(135deg,#EBF8FF,#D6F0FA)" }}>
                    {tour?.images?.[0] ? (
                        <img src={tour.images[0]} alt={tour.title} style={{ width:"100%", height:"100%", objectFit:"cover", transform:hovered?"scale(1.06)":"scale(1)", transition:"transform 0.5s cubic-bezier(0.22,1,0.36,1)", filter:isPast?"grayscale(40%)":"none" }}/>
                    ) : (
                        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2.5rem", opacity:0.3 }}>🧭</div>
                    )}
                    <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, transparent 40%, rgba(6,30,50,0.65))" }}/>

                    {/* Status badge */}
                    <div style={{ position:"absolute", top:10, left:10, display:"inline-flex", alignItems:"center", gap:5, background:"rgba(255,255,255,0.92)", borderRadius:20, padding:"0.25rem 0.65rem", backdropFilter:"blur(8px)" }}>
                        <span style={{ width:6, height:6, borderRadius:"50%", background:s.dot, flexShrink:0 }}/>
                        <span style={{ fontSize:"0.62rem", fontWeight:700, color:s.color }}>{s.label}</span>
                    </div>

                    {/* Countdown for upcoming */}
                    {booking.status === "confirmed" && days !== null && days > 0 && days <= 30 && (
                        <div style={{ position:"absolute", top:10, right:10, background:"linear-gradient(135deg,#28B8E8,#0A6A94)", borderRadius:20, padding:"0.25rem 0.65rem" }}>
                            <span style={{ fontSize:"0.62rem", fontWeight:700, color:"#fff" }}>{days}d to go</span>
                        </div>
                    )}

                    {/* Title */}
                    <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"0.75rem 1rem" }}>
                        <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:"0.95rem", fontWeight:700, color:"#fff", lineHeight:1.3 }}>
                            {tour?.title ?? "Tour"}
                        </h3>
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding:"1rem" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.75rem" }}>
                        <div style={{ display:"flex", items:"center", gap:"0.75rem" }}>
                            <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                                <span style={{ fontSize:"0.62rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"#1A6A8A" }}>Dates</span>
                                <span style={{ fontSize:"0.8rem", fontWeight:600, color:"#0A3D52" }}>
                  {fmtDate(booking.startDate)} → {fmtDate(booking.endDate)}
                </span>
                            </div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                            <span style={{ fontSize:"0.62rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"#1A6A8A", display:"block" }}>Total</span>
                            <span style={{ fontSize:"1rem", fontWeight:800, color:"#1E9DC8" }}>${fmt(booking.totalAmountUSD)}</span>
                        </div>
                    </div>

                    <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", flexWrap:"wrap" }}>
            <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:"#F8FCFF", borderRadius:8, padding:"0.25rem 0.6rem", fontSize:"0.7rem", color:"#1A6A8A" }}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 5.5a2 2 0 1 1 4 0 2 2 0 0 1-4 0zM0.5 11c0-2 1.8-3.5 3.5-3.5S7.5 9 7.5 11"/><path d="M8 4a2 2 0 1 1 0 4M10.5 11c0-1.5-1-2.8-2.5-3.3"/></svg>
                {booking.travelers} traveler{booking.travelers !== 1 ? "s" : ""}
            </span>
                        <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:"#F8FCFF", borderRadius:8, padding:"0.25rem 0.6rem", fontSize:"0.7rem", color:"#1A6A8A" }}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="6" cy="6" r="4.5"/><path d="M6 3.5V6l1.5 1.5"/></svg>
                            {tour?.durationDays ?? "—"}d
            </span>
                        {/* Payment status pills */}
                        <span style={{ display:"inline-flex", alignItems:"center", gap:4, background: booking.depositPaid ? "#D1FAE5" : "#FEF3C7", borderRadius:8, padding:"0.25rem 0.6rem", fontSize:"0.7rem", fontWeight:600, color: booking.depositPaid ? "#065F46" : "#92400E" }}>
              Deposit {booking.depositPaid ? "✓" : "pending"}
            </span>
                        {booking.depositPaid && !booking.remainingPaid && booking.status === "confirmed" && (
                            <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:"#FEF3C7", borderRadius:8, padding:"0.25rem 0.6rem", fontSize:"0.7rem", fontWeight:600, color:"#92400E" }}>
                Balance due
              </span>
                        )}
                    </div>

                    {/* View details row */}
                    <div style={{ marginTop:"0.85rem", display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:"0.75rem", borderTop:"1px solid rgba(14,133,178,0.07)" }}>
                        <span style={{ fontSize:"0.68rem", color:"#1A6A8A", fontFamily:"monospace" }}>#{booking.id.slice(0, 8).toUpperCase()}</span>
                        <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:"0.78rem", fontWeight:700, color:"#1E9DC8" }}>
              View details
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 6h8M6 2l4 4-4 4"/></svg>
            </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── EMPTY STATE ───────────────────────────────────────────────────────────────
function EmptyState({ tab }: { tab: string }) {
    return (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"5rem 1rem", textAlign:"center" }}>
            <div style={{ width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,#EBF8FF,#D6F0FA)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2rem", marginBottom:"1.25rem", boxShadow:"0 8px 32px rgba(14,133,178,0.12)", animation:"float 3s ease-in-out infinite" }}>
                {tab === "upcoming" ? "🧭" : tab === "past" ? "✈️" : tab === "pending" ? "⏳" : "📋"}
            </div>
            <p style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.2rem", fontWeight:600, color:"#0A3D52", marginBottom:"0.5rem" }}>
                No {tab} bookings
            </p>
            <p style={{ fontSize:"0.85rem", fontWeight:300, color:"#1A6A8A", marginBottom:"1.5rem", maxWidth:280 }}>
                {tab === "upcoming" ? "Your confirmed upcoming trips will appear here." : tab === "past" ? "Completed trips will show here after your travel dates." : tab === "pending" ? "Bookings awaiting payment will appear here." : "Cancelled or expired bookings will appear here."}
            </p>
            <Link href="/tours" style={{ display:"inline-flex", alignItems:"center", gap:6, background:"linear-gradient(135deg,#28B8E8,#0A6A94)", color:"#fff", fontSize:"0.85rem", fontWeight:700, padding:"0.75rem 1.5rem", borderRadius:12, textDecoration:"none", boxShadow:"0 4px 16px rgba(14,133,178,0.35)" }}>
                Browse tours
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 6.5h9M7 3l3.5 3.5L7 10"/></svg>
            </Link>
        </div>
    );
}

// ── MAIN CLIENT ───────────────────────────────────────────────────────────────
type Tab = "upcoming" | "past" | "pending" | "other";

export default function BookingsClient({ bookings: initialBookings, toursMap }: Props) {
    const [bookings, setBookings] = useState(initialBookings);
    const [tab,      setTab]      = useState<Tab>("upcoming");
    const [selected, setSelected] = useState<Booking | null>(null);

    function categorise(b: Booking): Tab {
        if (b.status === "pending_payment") return "pending";
        if (b.status === "confirmed" && daysUntil(b.startDate) >= 0) return "upcoming";
        if (b.status === "completed" || (b.status === "confirmed" && daysUntil(b.startDate) < 0)) return "past";
        return "other";
    }

    const tabs: { key: Tab; label: string; icon: string }[] = [
        { key:"upcoming", label:"Upcoming",        icon:"🗺" },
        { key:"past",     label:"Past trips",       icon:"✈️" },
        { key:"pending",  label:"Pending payment",  icon:"⏳" },
        { key:"other",    label:"Cancelled",         icon:"📋" },
    ];

    const counts  = Object.fromEntries(tabs.map(t => [t.key, bookings.filter(b => categorise(b) === t.key).length]));
    const visible = bookings.filter(b => categorise(b) === tab);

    function onCancel() {
        if (selected) setBookings(bs => bs.map(b => b.id === selected.id ? { ...b, status: "cancelled" as const } : b));
    }

    const totalSpent = bookings.filter(b => b.depositPaid).reduce((sum, b) => sum + b.depositAmountUSD + (b.remainingPaid ? b.remainingAmountUSD : 0), 0);
    const upcomingCount = counts["upcoming"] ?? 0;

    return (
        <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#F0F9FF 0%,#fff 50%,#F0F9FF 100%)", paddingTop:64 }}>
            <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes modal-pop { from{opacity:0;transform:scale(0.95) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
      `}</style>

            {/* ── HEADER ── */}
            <div style={{ borderBottom:"1px solid rgba(14,133,178,0.08)", padding:"2.5rem 2rem 0" }}>
                <div style={{ maxWidth:1100, margin:"0 auto" }}>

                    {/* Title row */}
                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", flexWrap:"wrap", marginBottom:"2rem" }}>
                        <div>
                            <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#EBF8FF", border:"1px solid rgba(14,133,178,0.18)", borderRadius:20, padding:"0.3rem 0.8rem", fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.14em", color:"#1E9DC8", textTransform:"uppercase", marginBottom:"0.75rem" }}>
                                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="1" y="3" width="10" height="8" rx="1.5"/><path d="M4 3V2M8 3V2M1 6h10"/></svg>
                                Your bookings
                            </div>
                            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.8rem,3vw,2.6rem)", fontWeight:700, color:"#0A3D52", letterSpacing:"-0.025em", marginBottom:"0.4rem" }}>
                                My trips
                            </h1>
                            <p style={{ fontSize:"0.9rem", fontWeight:300, color:"#1A6A8A" }}>
                                {bookings.length === 0 ? "No bookings yet — start exploring" : `${bookings.length} booking${bookings.length !== 1 ? "s" : ""} total`}
                            </p>
                        </div>
                        <Link href="/tours" style={{ display:"inline-flex", alignItems:"center", gap:6, background:"linear-gradient(135deg,#28B8E8,#0A6A94)", color:"#fff", fontSize:"0.83rem", fontWeight:700, padding:"0.65rem 1.25rem", borderRadius:10, textDecoration:"none", boxShadow:"0 3px 12px rgba(14,133,178,0.35)", flexShrink:0 }}>
                            + Book a tour
                        </Link>
                    </div>

                    {/* Stats strip */}
                    {bookings.length > 0 && (
                        <div style={{ display:"flex", gap:"1rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
                            {[
                                { icon:"🗺", label:"Upcoming trips",     value: upcomingCount },
                                { icon:"💳", label:"Total spent",        value: `$${fmt(totalSpent)}` },
                                { icon:"🌍", label:"Tours booked",       value: bookings.length },
                            ].map(({ icon, label, value }) => (
                                <div key={label} style={{ display:"flex", alignItems:"center", gap:"0.65rem", background:"rgba(255,255,255,0.85)", border:"1px solid rgba(14,133,178,0.10)", borderRadius:14, padding:"0.65rem 1rem", backdropFilter:"blur(8px)", boxShadow:"0 2px 10px rgba(14,133,178,0.06)" }}>
                                    <span style={{ fontSize:"1.1rem" }}>{icon}</span>
                                    <div>
                                        <div style={{ fontSize:"1rem", fontWeight:800, color:"#0A3D52", lineHeight:1 }}>{value}</div>
                                        <div style={{ fontSize:"0.62rem", fontWeight:600, color:"#1A6A8A", textTransform:"uppercase", letterSpacing:"0.08em", marginTop:2 }}>{label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tabs */}
                    <div style={{ display:"flex", gap:"0.25rem", overflowX:"auto" }}>
                        {tabs.map(t => {
                            const active = tab === t.key;
                            const count  = counts[t.key] ?? 0;
                            return (
                                <button key={t.key} onClick={() => setTab(t.key)}
                                        style={{ display:"flex", alignItems:"center", gap:"0.4rem", padding:"0.65rem 1rem", borderRadius:"10px 10px 0 0", border:"none", cursor:"pointer", fontSize:"0.83rem", fontWeight: active ? 700 : 400, whiteSpace:"nowrap", transition:"all 0.15s", background: active ? "#fff" : "transparent", color: active ? "#0A3D52" : "#1A6A8A", borderBottom: active ? "2px solid #1E9DC8" : "2px solid transparent", marginBottom: active ? -1 : 0 }}>
                                    <span>{t.icon}</span>
                                    {t.label}
                                    {count > 0 && (
                                        <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", minWidth:18, height:18, borderRadius:20, padding:"0 5px", background: active ? "linear-gradient(135deg,#28B8E8,#0A6A94)" : "rgba(14,133,178,0.10)", color: active ? "#fff" : "#1E9DC8", fontSize:"0.62rem", fontWeight:700 }}>
                      {count}
                    </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── GRID ── */}
            <div style={{ maxWidth:1100, margin:"0 auto", padding:"2rem" }}>
                {visible.length === 0 ? (
                    <EmptyState tab={tab}/>
                ) : (
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:"1.25rem" }}>
                        {visible.map(b => (
                            <BookingCard
                                key={b.id}
                                booking={b}
                                tour={toursMap[b.tourId] ?? null}
                                onSelect={() => setSelected(b)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── MODAL ── */}
            {selected && (
                <BookingModal
                    booking={selected}
                    tour={toursMap[selected.tourId] ?? null}
                    onClose={() => setSelected(null)}
                    onCancel={onCancel}
                />
            )}
        </div>
    );
}