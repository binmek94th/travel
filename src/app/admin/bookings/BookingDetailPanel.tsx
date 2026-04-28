"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BookingDetail = {
    id: string;

    // Traveler
    travelerId: string;
    travelerName?: string;
    travelerEmail?: string;
    travelerPhone?: string;
    travelerAvatarUrl?: string;
    travelerCountry?: string;

    // Tour
    tourId: string;
    tourTitle?: string;
    tourCoverUrl?: string;
    tourDuration?: number;
    operatorId: string;
    operatorName?: string;

    // Amounts (actual Firestore field names)
    totalAmountUSD: number;
    depositAmountUSD?: number;
    depositPaid?: boolean;
    remainingAmountUSD?: number;
    remainingPaid?: boolean;

    // Legacy / ETB fields
    totalUSD?: number;
    totalETB?: number;
    currency?: string;

    // Booking
    status: string;
    paymentProvider: string;
    paymentRef?: string;

    startDate: string;
    endDate?: string;
    groupSize?: number;
    specialRequests?: string;
    emergencyName?: string;
    emergencyPhone?: string;

    createdAt: string;
    updatedAt?: string;
    timeline?: { label: string; at: string }[];
};

// ─── Statuses ─────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
    pending_payment: "bg-amber-100 text-amber-700 border-amber-200",
    paid:            "bg-blue-100 text-blue-700 border-blue-200",
    confirmed:       "bg-emerald-100 text-emerald-700 border-emerald-200",
    active:          "bg-cyan-100 text-cyan-700 border-cyan-200",
    completed:       "bg-violet-100 text-violet-700 border-violet-200",
    cancelled:       "bg-red-100 text-red-700 border-red-200",
    refunded:        "bg-slate-100 text-slate-600 border-slate-200",
};

function StatusBadge({ status }: { status: string }) {
    const label = status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    return (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
      {label}
    </span>
    );
}

function Avatar({ name, url }: { name: string; url?: string }) {
    const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    if (url) return <img src={url} alt={name} className="w-12 h-12 rounded-full object-cover ring-2 ring-white" />;
    return (
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-700 flex items-center justify-center text-white font-bold text-base ring-2 ring-white">
            {initials || "?"}
        </div>
    );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-100 last:border-0">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex-shrink-0 w-36">{label}</span>
            <div className="text-sm text-slate-700 text-right">{children}</div>
        </div>
    );
}

// ─── Confirmation dialog ──────────────────────────────────────────────────────

function ConfirmDialog({
                           booking,
                           onClose,
                           onDone,
                       }: {
    booking: BookingDetail;
    onClose: () => void;
    onDone: () => void;
}) {
    const [loading, setLoading]     = useState(false);
    const [notifyEmail, setEmail]   = useState(!!booking.travelerEmail);
    const [notifySMS, setSMS]       = useState(!!booking.travelerPhone);
    const [note, setNote]           = useState("");
    const [error, setError]         = useState("");

    async function confirm() {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/admin/bookings/${booking.id}`, {
                method:  "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status:    "confirmed",
                    notify:    { email: notifyEmail, sms: notifySMS },
                    adminNote: note.trim() || undefined,
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error ?? `HTTP ${res.status}`);
            }
            onDone();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    const travelerLabel = booking.travelerName || booking.travelerEmail || "this traveler";
    const tourLabel     = booking.tourTitle    || booking.tourId;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">

                {/* Header */}
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-800 text-base" style={{ fontFamily:"'Playfair Display',serif" }}>
                            Confirm Booking
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Confirming <span className="font-medium text-slate-700">{travelerLabel}</span>'s booking for{" "}
                            <span className="font-medium text-slate-700">{tourLabel}</span>.
                        </p>
                    </div>
                </div>

                {/* Amount summary */}
                <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">Total</span>
                        <span className="font-bold text-slate-800 text-lg">${booking.totalAmountUSD.toLocaleString()}</span>
                    </div>
                    {booking.depositAmountUSD != null && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Deposit paid</span>
                            <span className="text-xs font-semibold text-emerald-600">${booking.depositAmountUSD}</span>
                        </div>
                    )}
                    {(booking.remainingAmountUSD ?? 0) > 0 && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Remaining due</span>
                            <span className={`text-xs font-semibold ${booking.remainingPaid ? "text-emerald-600" : "text-amber-600"}`}>
                ${booking.remainingAmountUSD} {booking.remainingPaid ? "✓ paid" : "unpaid"}
              </span>
                        </div>
                    )}
                </div>

                {/* Notification toggles */}
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notify traveler via</p>
                    {booking.travelerEmail ? (
                        <label className="flex items-center gap-2.5 cursor-pointer">
                            <input type="checkbox" checked={notifyEmail} onChange={e => setEmail(e.target.checked)}
                                   className="rounded accent-cyan-600 w-4 h-4" />
                            <span className="text-sm text-slate-700">
                Email — <span className="text-slate-400">{booking.travelerEmail}</span>
              </span>
                        </label>
                    ) : (
                        <p className="text-xs text-slate-400 italic">No email on file</p>
                    )}
                    {booking.travelerPhone ? (
                        <label className="flex items-center gap-2.5 cursor-pointer">
                            <input type="checkbox" checked={notifySMS} onChange={e => setSMS(e.target.checked)}
                                   className="rounded accent-cyan-600 w-4 h-4" />
                            <span className="text-sm text-slate-700">
                SMS — <span className="text-slate-400">{booking.travelerPhone}</span>
              </span>
                        </label>
                    ) : null}
                </div>

                {/* Optional note */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                        Note to traveler <span className="font-normal normal-case text-slate-400">(optional)</span>
                    </label>
                    <textarea
                        rows={3}
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="E.g. Please arrive 15 min early at the pickup point."
                        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none
                       focus:border-cyan-400 resize-none placeholder:text-slate-300 text-slate-700"
                    />
                </div>

                {error && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
                )}

                <div className="flex gap-2 justify-end">
                    <button onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors">
                        Cancel
                    </button>
                    <button onClick={confirm} disabled={loading}
                            className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl
                             transition-colors disabled:opacity-60 flex items-center gap-2">
                        {loading && (
                            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                            </svg>
                        )}
                        Confirm & Notify
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

const CONFIRMABLE = new Set(["paid", "pending_payment"]);

export function BookingDetailPanel({
                                       booking,
                                       onClose,
                                   }: {
    booking: BookingDetail | null;
    onClose: () => void;
}) {
    const router = useRouter();
    const [showConfirm, setShowConfirm] = useState(false);
    const [busy, setBusy]               = useState(false);

    useEffect(() => {
        function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    // Reset confirm dialog when panel switches to a different booking
    useEffect(() => { setShowConfirm(false); }, [booking?.id]);

    async function transition(status: string) {
        if (!booking) return;
        setBusy(true);
        await fetch(`/api/admin/bookings/${booking.id}`, {
            method:  "PATCH",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ status }),
        });
        setBusy(false);
        router.refresh();
        onClose();
    }

    const open = !!booking;
    const travelerDisplay = booking?.travelerName || booking?.travelerEmail || "Unknown traveler";

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px] transition-opacity duration-300
                    ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                onClick={onClose}
            />

            {/* Slide-over panel */}
            <div className={`fixed top-0 right-0 h-full z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col
                       transition-transform duration-300 ease-out
                       ${open ? "translate-x-0" : "translate-x-full"}`}>
                {!booking ? null : (
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div>
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Booking ID</p>
                                    <p className="text-xs font-mono text-slate-500">#{booking.id.slice(0, 14)}</p>
                                </div>
                                <StatusBadge status={booking.status} />
                            </div>
                            <button onClick={onClose}
                                    className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
                                <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M3 3l10 10M13 3L3 13"/>
                                </svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto">

                            {/* ── Traveler ─────────────────────────────────── */}
                            <div className="px-6 py-5 border-b border-slate-100">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Traveler</p>
                                <div className="flex items-center gap-4">
                                    <Avatar name={travelerDisplay} url={booking.travelerAvatarUrl} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-800 text-base">{travelerDisplay}</p>
                                        {booking.travelerEmail && (
                                            <a href={`mailto:${booking.travelerEmail}`}
                                               className="text-sm text-cyan-600 hover:underline block truncate">{booking.travelerEmail}</a>
                                        )}
                                        {booking.travelerPhone && (
                                            <p className="text-sm text-slate-400 mt-0.5">{booking.travelerPhone}</p>
                                        )}
                                        {booking.travelerCountry && (
                                            <p className="text-xs text-slate-400 mt-0.5">{booking.travelerCountry}</p>
                                        )}
                                    </div>
                                    {booking.travelerId && (
                                        <a href={`/admin/users?id=${booking.travelerId}`}
                                           className="flex-shrink-0 text-xs font-medium text-slate-500 hover:text-cyan-600
                                  border border-slate-200 hover:border-cyan-300 px-2.5 py-1.5 rounded-lg transition-colors">
                                            Profile →
                                        </a>
                                    )}
                                </div>

                                {/* Emergency contact */}
                                {(booking.emergencyName || booking.emergencyPhone) && (
                                    <div className="mt-4 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
                                        <p className="text-[10px] font-semibold text-orange-500 uppercase tracking-wide mb-1">Emergency Contact</p>
                                        {booking.emergencyName  && <p className="text-sm text-slate-700">{booking.emergencyName}</p>}
                                        {booking.emergencyPhone && <p className="text-sm text-slate-500">{booking.emergencyPhone}</p>}
                                    </div>
                                )}
                            </div>

                            {/* ── Tour ─────────────────────────────────────── */}
                            <div className="px-6 py-5 border-b border-slate-100">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Tour</p>
                                <div className="flex gap-3 items-start">
                                    {booking.tourCoverUrl ? (
                                        <img src={booking.tourCoverUrl} alt={booking.tourTitle}
                                             className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-100 to-cyan-100
                                    flex items-center justify-center flex-shrink-0 text-2xl">
                                            🧭
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-800 truncate">
                                            {booking.tourTitle ?? <span className="font-mono text-slate-400 text-xs">{booking.tourId}</span>}
                                        </p>
                                        {booking.operatorName && <p className="text-xs text-slate-400 mt-0.5">by {booking.operatorName}</p>}
                                        {booking.tourDuration && <p className="text-xs text-slate-400 mt-0.5">{booking.tourDuration}-day tour</p>}
                                        <a href={`/admin/tours?highlight=${booking.tourId}`}
                                           className="text-xs text-cyan-600 hover:underline mt-1 inline-block">View tour →</a>
                                    </div>
                                </div>
                            </div>

                            {/* ── Booking details ───────────────────────────── */}
                            <div className="px-6 py-5 border-b border-slate-100">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Booking Details</p>

                                <Row label="Total">
                                    <span className="font-bold text-slate-800 text-base">${booking.totalAmountUSD.toLocaleString()}</span>
                                </Row>

                                {booking.depositAmountUSD != null && (
                                    <Row label="Deposit">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">${booking.depositAmountUSD}</span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border
                        ${booking.depositPaid
                                                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                : "bg-amber-50 text-amber-600 border-amber-200"}`}>
                        {booking.depositPaid ? "Paid" : "Unpaid"}
                      </span>
                                        </div>
                                    </Row>
                                )}

                                {booking.remainingAmountUSD != null && booking.remainingAmountUSD > 0 && (
                                    <Row label="Remaining">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">${booking.remainingAmountUSD}</span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border
                        ${booking.remainingPaid
                                                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                : "bg-red-50 text-red-600 border-red-200"}`}>
                        {booking.remainingPaid ? "Paid" : "Due"}
                      </span>
                                        </div>
                                    </Row>
                                )}

                                <Row label="Payment">
                                    <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border
                      ${booking.paymentProvider === "stripe"
                        ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                        : "bg-green-50 text-green-600 border-green-200"}`}>
                      {booking.paymentProvider.charAt(0).toUpperCase() + booking.paymentProvider.slice(1)}
                    </span>
                                        {booking.paymentRef && (
                                            <span className="text-xs text-slate-400 font-mono">{booking.paymentRef}</span>
                                        )}
                                    </div>
                                </Row>

                                <Row label="Start date">{booking.startDate}</Row>
                                {booking.endDate   && <Row label="End date">{booking.endDate}</Row>}
                                {booking.groupSize && (
                                    <Row label="Travelers">
                                        {booking.groupSize} {booking.groupSize === 1 ? "person" : "people"}
                                    </Row>
                                )}
                                <Row label="Booked">{booking.createdAt?.slice(0, 10)}</Row>
                                {booking.updatedAt && <Row label="Last updated">{booking.updatedAt?.slice(0, 10)}</Row>}
                            </div>

                            {/* ── Special requests ──────────────────────────── */}
                            {booking.specialRequests && (
                                <div className="px-6 py-5 border-b border-slate-100">
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Special Requests</p>
                                    <p className="text-sm text-slate-600 leading-relaxed bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                                        {booking.specialRequests}
                                    </p>
                                </div>
                            )}

                            {/* ── Activity timeline ─────────────────────────── */}
                            {booking.timeline && booking.timeline.length > 0 && (
                                <div className="px-6 py-5">
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Activity</p>
                                    <ol className="relative ml-2 border-l border-slate-200 flex flex-col gap-4">
                                        {booking.timeline.map((ev, i) => (
                                            <li key={i} className="pl-5 relative">
                                                <span className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-white border-2 border-cyan-400" />
                                                <p className="text-sm text-slate-700">{ev.label}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{ev.at}</p>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            )}
                        </div>

                        {/* Footer actions */}
                        <div className="flex-shrink-0 px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center gap-2 justify-end">
                            {CONFIRMABLE.has(booking.status) && (
                                <button
                                    onClick={() => setShowConfirm(true)}
                                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold
                             bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <path d="M3 8l3.5 3.5L13 4"/>
                                    </svg>
                                    Confirm booking
                                </button>
                            )}
                            {booking.status === "confirmed" && (
                                <button onClick={() => transition("active")} disabled={busy}
                                        className="px-4 py-2 text-sm font-semibold bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl transition-colors disabled:opacity-60">
                                    Mark active
                                </button>
                            )}
                            {booking.status === "active" && (
                                <button onClick={() => transition("completed")} disabled={busy}
                                        className="px-4 py-2 text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors disabled:opacity-60">
                                    Mark completed
                                </button>
                            )}
                            {["confirmed", "active", "paid", "pending_payment"].includes(booking.status) && (
                                <button onClick={() => transition("cancelled")} disabled={busy}
                                        className="px-4 py-2 text-sm font-semibold bg-red-50 hover:bg-red-100 text-red-600
                                   rounded-xl transition-colors border border-red-200 disabled:opacity-60">
                                    Cancel
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Confirmation dialog */}
            {showConfirm && booking && (
                <ConfirmDialog
                    booking={booking}
                    onClose={() => setShowConfirm(false)}
                    onDone={() => {
                        setShowConfirm(false);
                        router.refresh();
                        onClose();
                    }}
                />
            )}
        </>
    );
}