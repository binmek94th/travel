// src/app/admin/notifications/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
    collection, query, orderBy, limit,
    onSnapshot, doc, updateDoc, deleteDoc,
    writeBatch, Timestamp,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminNotificationType =
    | "booking_confirmed"
    | "booking_cancelled"
    | "new_booking"
    | "operator_applied"
    | "review_flagged"
    | "payment_received";

type AdminNotification = {
    id:        string;
    type:      AdminNotificationType;
    message:   string;
    bookingId: string | null;
    userId:    string | null;
    read:      boolean;
    createdAt: Timestamp | null;
};

// ─── Meta ─────────────────────────────────────────────────────────────────────

const TYPE_META: Record<AdminNotificationType, {
    label: string; icon: React.ReactNode;
    accent: string; bg: string; border: string; dot: string;
}> = {
    booking_confirmed: {
        label: "Confirmed", dot: "#10B981",
        accent: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200",
        icon: <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 8l3.5 3.5L13 4"/></svg>,
    },
    booking_cancelled: {
        label: "Cancelled", dot: "#EF4444",
        accent: "text-red-500", bg: "bg-red-50", border: "border-red-200",
        icon: <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>,
    },
    new_booking: {
        label: "New booking", dot: "#0E85B2",
        accent: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-200",
        icon: <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="3" width="12" height="12" rx="2"/><path d="M2 7h12M6 1v3M10 1v3"/></svg>,
    },
    operator_applied: {
        label: "Operator", dot: "#7C3AED",
        accent: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200",
        icon: <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 2.7-5 6-5s6 2 6 5"/></svg>,
    },
    review_flagged: {
        label: "Flagged", dot: "#F59E0B",
        accent: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200",
        icon: <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M8 2l1.5 4.5H14l-3.7 2.7 1.4 4.3L8 11l-3.7 2.5 1.4-4.3L2 6.5h4.5z"/></svg>,
    },
    payment_received: {
        label: "Payment", dot: "#0D9488",
        accent: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200",
        icon: <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="1" y="4" width="14" height="10" rx="2"/><path d="M1 8h14"/></svg>,
    },
};

function getMeta(type: AdminNotificationType) {
    return TYPE_META[type] ?? TYPE_META.new_booking;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(ts: Timestamp | null): string {
    if (!ts) return "just now";
    const secs = Math.floor((Date.now() - ts.toMillis()) / 1000);
    if (secs < 60)    return "just now";
    if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return ts.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtDate(ts: Timestamp | null): string {
    if (!ts) return "—";
    return ts.toDate().toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit",
    });
}

const TYPE_FILTERS = [
    { value: "all",               label: "All"       },
    { value: "new_booking",       label: "Bookings"  },
    { value: "booking_confirmed", label: "Confirmed" },
    { value: "booking_cancelled", label: "Cancelled" },
    { value: "payment_received",  label: "Payments"  },
    { value: "operator_applied",  label: "Operators" },
    { value: "review_flagged",    label: "Flagged"   },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminNotificationsPage() {
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [loading, setLoading]             = useState(true);
    const [typeFilter, setTypeFilter]       = useState("all");
    const [unreadOnly, setUnreadOnly]       = useState(false);
    const [selected, setSelected]           = useState<AdminNotification | null>(null);

    // ── Real-time Firestore listener ──────────────────────────────────────────
    useEffect(() => {
        const q = query(
            collection(db, "adminNotifications"),
            orderBy("createdAt", "desc"),
            limit(100)
        );

        const unsub = onSnapshot(q, snap => {
            setNotifications(snap.docs.map(d => ({
                id: d.id,
                ...(d.data() as Omit<AdminNotification, "id">),
            })));
            setLoading(false);
        });

        return () => unsub();
    }, []);

    // Keep selected in sync when Firestore updates it
    useEffect(() => {
        if (!selected) return;
        const updated = notifications.find(n => n.id === selected.id);
        if (updated) setSelected(updated);
    }, [notifications]);

    const filtered = useMemo(() =>
            notifications.filter(n => {
                if (typeFilter !== "all" && n.type !== typeFilter) return false;
                if (unreadOnly && n.read) return false;
                return true;
            }),
        [notifications, typeFilter, unreadOnly]);

    const unreadCount = notifications.filter(n => !n.read).length;

    // ── Firestore actions ─────────────────────────────────────────────────────

    async function markRead(id: string) {
        await updateDoc(doc(db, "adminNotifications", id), { read: true });
    }

    async function markAllRead() {
        const unread = notifications.filter(n => !n.read);
        const batch  = writeBatch(db);
        unread.forEach(n => batch.update(doc(db, "adminNotifications", n.id), { read: true }));
        await batch.commit();
    }

    async function deleteNotification(id: string) {
        if (selected?.id === id) setSelected(null);
        await deleteDoc(doc(db, "adminNotifications", id));
    }

    function openNotification(n: AdminNotification) {
        setSelected(n);
        if (!n.read) markRead(n.id);
    }

    // ─────────────────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin"/>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">

            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="text-2xl font-light text-slate-800" style={{ fontFamily:"'Playfair Display',serif" }}>
                        Notifications
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        {notifications.length} total · {unreadCount} unread
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllRead}
                        className="text-sm font-medium text-cyan-600 hover:text-cyan-800 border border-cyan-200
                       hover:border-cyan-400 px-4 py-2 rounded-xl transition-colors bg-white"
                    >
                        Mark all read
                    </button>
                )}
            </div>

            {/* Stat strip */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label:"Unread",   val: unreadCount,                                                   color:"text-cyan-600",  bg:"bg-cyan-50"  },
                    { label:"Payments", val: notifications.filter(n => n.type === "payment_received").length, color:"text-teal-600",  bg:"bg-teal-50"  },
                    { label:"Flagged",  val: notifications.filter(n => n.type === "review_flagged").length,   color:"text-amber-600", bg:"bg-amber-50" },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-xl border border-slate-100 px-4 py-3`}>
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{s.label}</div>
                        <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.val}</div>
                    </div>
                ))}
            </div>

            <div className="flex gap-5 items-start">

                {/* ── List ──────────────────────────────────────────────────────────── */}
                <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">

                    {/* Toolbar */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 flex-wrap">
                        <div className="flex gap-1 flex-wrap">
                            {TYPE_FILTERS.map(f => (
                                <button
                                    key={f.value}
                                    onClick={() => setTypeFilter(f.value)}
                                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors
                    ${typeFilter === f.value
                                        ? "bg-cyan-600 text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        <label className="ml-auto flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={unreadOnly} onChange={e => setUnreadOnly(e.target.checked)}
                                   className="rounded accent-cyan-600"/>
                            <span className="text-xs text-slate-500 whitespace-nowrap">Unread only</span>
                        </label>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-slate-50 max-h-[640px] overflow-y-auto">
                        {filtered.length === 0 ? (
                            <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
                                <svg className="w-10 h-10 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                                    <path strokeLinecap="round" d="M15 17H9m6 0a3 3 0 006 0v-1a3 3 0 00-3-2.83V9a6 6 0 10-12 0v4.17A3 3 0 003 16v1a3 3 0 006 0m6 0H9"/>
                                </svg>
                                <p className="text-sm">No notifications</p>
                            </div>
                        ) : filtered.map(n => {
                            const meta   = getMeta(n.type);
                            const active = selected?.id === n.id;
                            return (
                                <div
                                    key={n.id}
                                    onClick={() => openNotification(n)}
                                    className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors group
                    ${active  ? "bg-cyan-50/60" : ""}
                    ${!n.read ? "bg-cyan-50/20" : ""}
                    hover:bg-slate-50`}
                                >
                                    <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${meta.bg} ${meta.accent} flex items-center justify-center mt-0.5`}>
                                        {meta.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${meta.bg} ${meta.accent} ${meta.border}`}>
                        {meta.label}
                      </span>
                                            {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 flex-shrink-0"/>}
                                        </div>
                                        <p className={`text-sm leading-snug truncate ${!n.read ? "font-medium text-slate-800" : "text-slate-600"}`}>
                                            {n.message}
                                        </p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">{relativeTime(n.createdAt)}</p>
                                    </div>
                                    <button
                                        onClick={e => { e.stopPropagation(); deleteNotification(n.id); }}
                                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg
                               hover:bg-red-50 flex items-center justify-center text-slate-300
                               hover:text-red-400 transition-all"
                                    >
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                            <path d="M2 2l10 10M12 2L2 12"/>
                                        </svg>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Detail panel ──────────────────────────────────────────────────── */}
                <div className="w-80 flex-shrink-0 sticky top-20">
                    {selected ? (() => {
                        const meta = getMeta(selected.type);
                        return (
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className={`px-5 py-4 ${meta.bg} border-b ${meta.border}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 rounded-xl bg-white/60 ${meta.accent} flex items-center justify-center`}>
                                                {meta.icon}
                                            </div>
                                            <span className={`text-xs font-bold uppercase tracking-wider ${meta.accent}`}>{meta.label}</span>
                                        </div>
                                        <button onClick={() => setSelected(null)}
                                                className="w-7 h-7 rounded-lg hover:bg-black/10 flex items-center justify-center transition-colors">
                                            <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                <path d="M2 2l10 10M12 2L2 12"/>
                                            </svg>
                                        </button>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-800 leading-snug">{selected.message}</p>
                                </div>

                                <div className="p-5 flex flex-col gap-4">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Received</p>
                                        <p className="text-sm text-slate-700">{fmtDate(selected.createdAt)}</p>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        {selected.bookingId && (
                                            <Link href={`/admin/bookings?highlight=${selected.bookingId}`}
                                                  className="flex items-center justify-between px-4 py-2.5 bg-slate-50
                                       hover:bg-cyan-50 rounded-xl border border-slate-100
                                       hover:border-cyan-200 transition-colors group">
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-slate-400 group-hover:text-cyan-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                                                        <rect x="2" y="3" width="12" height="11" rx="2"/><path d="M2 7h12M6 1v3M10 1v3"/>
                                                    </svg>
                                                    <span className="text-sm text-slate-600 group-hover:text-cyan-700 font-medium">View booking</span>
                                                </div>
                                                <span className="text-xs font-mono text-slate-400">#{selected.bookingId.slice(0, 8)}</span>
                                            </Link>
                                        )}
                                        {selected.userId && (
                                            <Link href={`/admin/users?id=${selected.userId}`}
                                                  className="flex items-center justify-between px-4 py-2.5 bg-slate-50
                                       hover:bg-cyan-50 rounded-xl border border-slate-100
                                       hover:border-cyan-200 transition-colors group">
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-slate-400 group-hover:text-cyan-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                                                        <circle cx="8" cy="5.5" r="2.5"/><path d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/>
                                                    </svg>
                                                    <span className="text-sm text-slate-600 group-hover:text-cyan-700 font-medium">View user</span>
                                                </div>
                                                <svg className="w-3.5 h-3.5 text-slate-300 group-hover:text-cyan-400" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                    <path d="M3 7h8M7 3l4 4-4 4"/>
                                                </svg>
                                            </Link>
                                        )}
                                    </div>

                                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                                        {!selected.read && (
                                            <button onClick={() => markRead(selected.id)}
                                                    className="flex-1 text-xs font-semibold text-cyan-600 border border-cyan-200
                                         hover:bg-cyan-50 rounded-xl py-2 transition-colors">
                                                Mark read
                                            </button>
                                        )}
                                        <button onClick={() => deleteNotification(selected.id)}
                                                className="flex-1 text-xs font-semibold text-red-500 border border-red-100
                                       hover:bg-red-50 rounded-xl py-2 transition-colors">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })() : (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col items-center gap-3 text-slate-400">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                                <svg className="w-5 h-5 opacity-40" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4">
                                    <path strokeLinecap="round" d="M15 17H9m6 0a3 3 0 006 0v-1a3 3 0 00-3-2.83V9a6 6 0 10-12 0v4.17A3 3 0 003 16v1a3 3 0 006 0m6 0H9"/>
                                </svg>
                            </div>
                            <p className="text-sm text-center">Select a notification to see details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}