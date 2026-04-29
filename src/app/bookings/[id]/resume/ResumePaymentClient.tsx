// src/app/bookings/[id]/resume-payment/ResumePaymentClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Booking = {
    id: string;
    tourId: string;
    status: string;
    startDate: string;
    endDate: string;
    travelers: number;
    totalAmountUSD: number;
    depositAmountUSD: number;
    remainingAmountUSD: number;
    depositPaid: boolean;
    emergencyName: string;
    emergencyPhone: string;
    specialRequests?: string;
    createdAt: string;
};

type Tour = {
    id: string;
    title: string;
    images: string[];
    durationDays: number;
    categories: string[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
    return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
}

function fmtDateShort(iso: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
    });
}

function daysUntil(iso: string) {
    const diff = new Date(iso).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DetailRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.65rem 0", borderBottom: "1px solid rgba(14,133,178,0.07)" }}>
            <span style={{ fontSize: "0.8rem", color: "#1A6A8A", fontWeight: 400 }}>{label}</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: accent ? "#1E9DC8" : "#0A3D52" }}>{value}</span>
        </div>
    );
}

function PaymentBreakdownRow({ label, value, badge, badgeGreen }: {
    label: string; value: string; badge?: string; badgeGreen?: boolean;
}) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.83rem", color: "#1A6A8A" }}>{label}</span>
                {badge && (
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "0.15rem 0.55rem", borderRadius: 20, background: badgeGreen ? "#D1FAE5" : "#FEF3C7", color: badgeGreen ? "#065F46" : "#92400E" }}>
            {badge}
          </span>
                )}
            </div>
            <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#0A3D52" }}>{value}</span>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ResumePaymentClient({
                                                booking,
                                                tour,
                                            }: {
    booking: Booking;
    tour: Tour | null;
}) {
    const router                  = useRouter();
    const [loading, setLoading]   = useState(false);
    const [error,   setError]     = useState<string | null>(null);
    const days                    = booking.startDate ? daysUntil(booking.startDate) : null;
    const coverImage              = tour?.images?.[0] ?? null;

    async function handlePay() {
        setLoading(true);
        setError(null);
        try {
            // Hit the API route — it returns a JSON redirect URL
            // (we use fetch here so we can show our own loading UI instead of
            //  navigating to the API route directly)
            const res = await fetch(`/api/bookings/${booking.id}/resume-payment/session`, {
                method: "POST",
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error ?? `Request failed (${res.status})`);
            }

            const { url } = await res.json();
            window.location.href = url;
        } catch (err: any) {
            setError(err.message ?? "Something went wrong. Please try again.");
            setLoading(false);
        }
    }

    return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#F0F9FF 0%,#fff 60%,#F0F9FF 100%)", paddingTop: 64 }}>
            <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes shimmer { 0%,100% { opacity: 1 } 50% { opacity: 0.55 } }
        .pay-btn:hover:not(:disabled) { box-shadow: 0 8px 28px rgba(14,133,178,0.5) !important; transform: translateY(-2px) !important; }
        .back-link:hover { color: #0A3D52 !important; }
      `}</style>

            <div style={{ maxWidth: 960, margin: "0 auto", padding: "2.5rem 1.5rem", display: "grid", gridTemplateColumns: "1fr 380px", gap: "2rem", alignItems: "start" }}>

                {/* ── LEFT COLUMN ─────────────────────────────────────────────────── */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", animation: "fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both" }}>

                    {/* Back link */}
                    <Link href="/bookings" className="back-link"
                          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "#1A6A8A", textDecoration: "none", transition: "color 0.15s" }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M9 2L4 7l5 5"/>
                        </svg>
                        Back to my bookings
                    </Link>

                    {/* Header */}
                    <div>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FEF3C7", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 20, padding: "0.3rem 0.8rem", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", color: "#92400E", textTransform: "uppercase", marginBottom: "0.75rem" }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B", display: "inline-block" }}/>
                            Awaiting payment
                        </div>
                        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 700, color: "#0A3D52", letterSpacing: "-0.02em", marginBottom: "0.4rem", lineHeight: 1.2 }}>
                            Complete your booking
                        </h1>
                        <p style={{ fontSize: "0.9rem", color: "#1A6A8A", fontWeight: 300, lineHeight: 1.6 }}>
                            Your spot on <strong style={{ fontWeight: 600, color: "#0A3D52" }}>{tour?.title ?? "this tour"}</strong> is reserved — secure it by paying your deposit below.
                        </p>
                    </div>

                    {/* Tour preview card */}
                    <div style={{ borderRadius: 18, border: "1px solid rgba(14,133,178,0.12)", overflow: "hidden", background: "#fff", boxShadow: "0 4px 20px rgba(14,133,178,0.08)" }}>
                        {/* Cover image */}
                        <div style={{ position: "relative", height: 200, background: "linear-gradient(135deg,#EBF8FF,#D6F0FA)", overflow: "hidden" }}>
                            {coverImage ? (
                                <img src={coverImage} alt={tour?.title} style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                            ) : (
                                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", opacity: 0.25 }}>🧭</div>
                            )}
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(6,30,50,0.7) 0%, transparent 50%)" }}/>

                            {/* Countdown badge */}
                            {days !== null && days > 0 && (
                                <div style={{ position: "absolute", top: 12, right: 12, background: "linear-gradient(135deg,#28B8E8,#0A6A94)", borderRadius: 20, padding: "0.3rem 0.8rem", boxShadow: "0 2px 12px rgba(14,133,178,0.4)" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#fff" }}>
                    {days} day{days !== 1 ? "s" : ""} to go 🎒
                  </span>
                                </div>
                            )}

                            {/* Categories */}
                            {tour?.categories?.length ? (
                                <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                                    {tour.categories.slice(0, 2).map((c: string) => (
                                        <span key={c} style={{
                                            background: "rgba(255,255,255,0.18)",
                                            backdropFilter: "blur(8px)",
                                            border: "1px solid rgba(255,255,255,0.3)",
                                            borderRadius: 20,
                                            padding: "0.2rem 0.6rem",
                                            fontSize: "0.62rem",
                                            fontWeight: 700,
                                            color: "#fff",
                                            letterSpacing: "0.06em"
                                        }}>
                {c}
            </span>
                                    ))}
                                </div>
                            ) : null}

                            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "1rem 1.25rem" }}>
                                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.15rem", fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>
                                    {tour?.title ?? "Ethiopia Tour"}
                                </h2>
                            </div>
                        </div>

                        {/* Trip details */}
                        <div style={{ padding: "1.25rem" }}>
                            <DetailRow label="Departure"    value={fmtDate(booking.startDate)} />
                            <DetailRow label="Return"       value={fmtDate(booking.endDate)} />
                            <DetailRow label="Duration"     value={`${tour?.durationDays ?? "—"} days`} />
                            <DetailRow label="Travelers"    value={`${booking.travelers} person${booking.travelers !== 1 ? "s" : ""}`} />
                            <DetailRow label="Booking ref"  value={`#${booking.id.slice(0, 8).toUpperCase()}`} />
                            {booking.specialRequests && (
                                <div style={{ marginTop: "0.85rem", background: "#F8FCFF", borderRadius: 10, padding: "0.75rem", border: "1px solid rgba(14,133,178,0.08)" }}>
                                    <p style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1A6A8A", marginBottom: "0.3rem" }}>Special requests</p>
                                    <p style={{ fontSize: "0.82rem", color: "#0A3D52" }}>{booking.specialRequests}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* What happens next */}
                    <div style={{ borderRadius: 14, border: "1px solid rgba(14,133,178,0.10)", background: "#F8FCFF", padding: "1.25rem" }}>
                        <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#1A6A8A", marginBottom: "0.85rem" }}>
                            What happens next
                        </p>
                        {[
                            { icon: "💳", title: "Pay your deposit",     body: `Secure your spot with a $${fmt(booking.depositAmountUSD)} deposit (20%).` },
                            { icon: "✅", title: "Booking confirmed",    body: "You'll receive an in-app notification and confirmation email." },
                            { icon: "💰", title: "Pay the balance",      body: `The remaining $${fmt(booking.remainingAmountUSD)} is due closer to your departure.` },
                            { icon: "🧭", title: "Enjoy your adventure", body: "We'll send your full trip details and guide contact before you go." },
                        ].map((step, i) => (
                            <div key={i} style={{ display: "flex", gap: "0.85rem", marginBottom: i < 3 ? "0.85rem" : 0 }}>
                                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(14,133,178,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 }}>
                                    {step.icon}
                                </div>
                                <div>
                                    <p style={{ fontSize: "0.83rem", fontWeight: 700, color: "#0A3D52", marginBottom: "0.15rem" }}>{step.title}</p>
                                    <p style={{ fontSize: "0.78rem", color: "#1A6A8A", fontWeight: 300 }}>{step.body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── RIGHT COLUMN — Payment summary + CTA ────────────────────────── */}
                <div style={{ position: "sticky", top: 84, display: "flex", flexDirection: "column", gap: "1rem", animation: "fadeUp 0.5s 0.1s cubic-bezier(0.22,1,0.36,1) both", animationFillMode: "both" }}>

                    {/* Payment summary card */}
                    <div style={{ borderRadius: 18, border: "1px solid rgba(14,133,178,0.14)", background: "#fff", overflow: "hidden", boxShadow: "0 8px 32px rgba(14,133,178,0.10)" }}>

                        {/* Card header */}
                        <div style={{ background: "linear-gradient(135deg,#0A3D52,#0E85B2)", padding: "1.25rem" }}>
                            <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(235,248,255,0.65)", marginBottom: "0.3rem" }}>
                                Payment summary
                            </p>
                            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "1rem", fontWeight: 700, color: "#fff" }}>
                                {tour?.title ?? "Your tour"}
                            </p>
                            <p style={{ fontSize: "0.75rem", color: "rgba(235,248,255,0.7)", marginTop: "0.25rem" }}>
                                {fmtDateShort(booking.startDate)} → {fmtDateShort(booking.endDate)}
                            </p>
                        </div>

                        {/* Breakdown */}
                        <div style={{ padding: "1rem 1.25rem" }}>
                            <PaymentBreakdownRow
                                label="Total tour price"
                                value={`$${fmt(booking.totalAmountUSD)}`}
                            />
                            <div style={{ height: 1, background: "rgba(14,133,178,0.07)", margin: "0.25rem 0" }}/>
                            <PaymentBreakdownRow
                                label="Deposit (20%)"
                                value={`$${fmt(booking.depositAmountUSD)}`}
                                badge={booking.depositPaid ? "✓ Paid" : "Due now"}
                                badgeGreen={booking.depositPaid}
                            />
                            <PaymentBreakdownRow
                                label="Remaining balance"
                                value={`$${fmt(booking.remainingAmountUSD)}`}
                                badge="Due later"
                                badgeGreen={false}
                            />
                        </div>

                        {/* Due today highlight */}
                        <div style={{ margin: "0 1.25rem 1.25rem", background: "linear-gradient(135deg,rgba(14,133,178,0.06),rgba(30,157,200,0.08))", border: "1px solid rgba(14,133,178,0.14)", borderRadius: 12, padding: "1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1A6A8A" }}>Due today</span>
                                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.6rem", fontWeight: 700, color: "#0A3D52" }}>
                  ${fmt(booking.depositAmountUSD)}
                </span>
                            </div>
                            <p style={{ fontSize: "0.7rem", color: "#1A6A8A", marginTop: "0.3rem", fontWeight: 300 }}>
                                Secure your spot — full balance due closer to departure
                            </p>
                        </div>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div style={{ background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "0.85rem 1rem", display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                                <circle cx="8" cy="8" r="6.5"/>
                                <path d="M8 5v3M8 10.5v.5"/>
                            </svg>
                            <p style={{ fontSize: "0.8rem", color: "#EF4444", lineHeight: 1.5 }}>{error}</p>
                        </div>
                    )}

                    {/* Pay button */}
                    <button
                        onClick={handlePay}
                        disabled={loading}
                        className="pay-btn"
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", width: "100%", padding: "1rem", borderRadius: 14, border: "none", background: loading ? "rgba(14,133,178,0.4)" : "linear-gradient(135deg,#28B8E8,#0A6A94)", color: "#fff", fontSize: "0.95rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 4px 18px rgba(14,133,178,0.38)", transition: "all 0.22s cubic-bezier(0.22,1,0.36,1)", letterSpacing: "0.01em" }}
                    >
                        {loading ? (
                            <>
                                <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,0.3)", borderTop: "2.5px solid #fff", animation: "spin 0.7s linear infinite" }}/>
                                Connecting to Stripe…
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <rect x="1" y="5" width="14" height="9" rx="2"/>
                                    <path d="M1 8h14M5 5V4a3 3 0 0 1 6 0v1"/>
                                </svg>
                                Pay deposit — ${fmt(booking.depositAmountUSD)}
                            </>
                        )}
                    </button>

                    {/* Trust badges */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1.25rem", padding: "0.25rem 0" }}>
                        {[
                            { icon: "🔒", label: "Secure payment" },
                            { icon: "✦",  label: "Powered by Stripe" },
                            { icon: "↩️", label: "Free cancellation" },
                        ].map(({ icon, label }) => (
                            <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem" }}>
                                <span style={{ fontSize: "1rem" }}>{icon}</span>
                                <span style={{ fontSize: "0.6rem", fontWeight: 600, color: "#1A6A8A", textAlign: "center", whiteSpace: "nowrap" }}>{label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Emergency contact reminder */}
                    <div style={{ borderRadius: 12, border: "1px solid rgba(14,133,178,0.10)", background: "#F8FCFF", padding: "0.85rem 1rem" }}>
                        <p style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1A6A8A", marginBottom: "0.4rem" }}>Emergency contact on file</p>
                        <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#0A3D52" }}>{booking.emergencyName}</p>
                        <p style={{ fontSize: "0.78rem", color: "#1A6A8A" }}>{booking.emergencyPhone}</p>
                    </div>

                    <p style={{ fontSize: "0.7rem", color: "#1A6A8A", textAlign: "center", lineHeight: 1.6, fontWeight: 300 }}>
                        By proceeding you agree to our{" "}
                        <Link href="/cancellation" style={{ color: "#1E9DC8", textDecoration: "none", fontWeight: 500 }}>cancellation policy</Link>
                        {" "}and{" "}
                        <Link href="/terms" style={{ color: "#1E9DC8", textDecoration: "none", fontWeight: 500 }}>terms of service</Link>.
                    </p>
                </div>
            </div>
        </div>
    );
}