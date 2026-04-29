// src/app/notifications/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { auth } from "@/src/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
    collection, query, where, orderBy, limit,
    onSnapshot, doc, updateDoc, writeBatch, Timestamp,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";

// ─── Types ────────────────────────────────────────────────────────────────────

type NotificationType =
    | "booking_confirmed"
    | "booking_cancelled"
    | "booking_reminder"
    | "payment_received"
    | "message"
    | "promo";

type UserNotification = {
    id:        string;
    type:      NotificationType;
    title:     string;
    message:   string;
    bookingId: string | null;
    tourId:    string | null;
    tourTitle: string | null;
    startDate: string | null;
    adminNote: string | null;
    read:      boolean;
    createdAt: Timestamp | null;
};

// ─── Meta ─────────────────────────────────────────────────────────────────────

const TYPE_META: Record<NotificationType, {
    label: string; emoji: string;
    accent: string; bg: string; border: string;
}> = {
    booking_confirmed: { label:"Confirmed", emoji:"✅", accent:"text-emerald-600", bg:"bg-emerald-50", border:"border-emerald-200" },
    booking_cancelled: { label:"Cancelled", emoji:"❌", accent:"text-red-500",     bg:"bg-red-50",     border:"border-red-200"     },
    booking_reminder:  { label:"Reminder",  emoji:"⏰", accent:"text-amber-600",   bg:"bg-amber-50",   border:"border-amber-200"   },
    payment_received:  { label:"Payment",   emoji:"💳", accent:"text-teal-600",    bg:"bg-teal-50",    border:"border-teal-200"    },
    message:           { label:"Message",   emoji:"💬", accent:"text-cyan-600",    bg:"bg-cyan-50",    border:"border-cyan-200"    },
    promo:             { label:"Offer",     emoji:"🎁", accent:"text-violet-600",  bg:"bg-violet-50",  border:"border-violet-200"  },
};

function getMeta(type: NotificationType) {
    return TYPE_META[type] ?? TYPE_META.message;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(ts: Timestamp | null): string {
    if (!ts) return "just now";
    const secs = Math.floor((Date.now() - ts.toMillis()) / 1000);
    if (secs < 60)    return "just now";
    if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return ts.toDate().toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
}

function fmtDate(ts: Timestamp | null): string {
    if (!ts) return "—";
    return ts.toDate().toLocaleString("en-US", {
        weekday:"long", month:"long", day:"numeric", year:"numeric",
        hour:"numeric", minute:"2-digit",
    });
}

const TABS = [
    { value:"all",               label:"All"       },
    { value:"booking_confirmed", label:"Confirmed" },
    { value:"booking_cancelled", label:"Cancelled" },
    { value:"payment_received",  label:"Payments"  },
    { value:"message",           label:"Messages"  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserNotificationsPage() {
    const [userId, setUserId]               = useState<string | null>(null);
    const [notifications, setNotifications] = useState<UserNotification[]>([]);
    const [loading, setLoading]             = useState(true);
    const [tab, setTab]                     = useState("all");
    const [selected, setSelected]           = useState<UserNotification | null>(null);

    // ── Get current user ──────────────────────────────────────────────────────
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, u => {
            setUserId(u?.uid ?? null);
            if (!u) setLoading(false);
        });
        return () => unsub();
    }, []);

    // ── Real-time Firestore listener ──────────────────────────────────────────
    useEffect(() => {
        if (!userId) return;

        const q = query(
            collection(db, "notifications"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc"),
            limit(60)
        );

        const unsub = onSnapshot(q, snap => {
            setNotifications(snap.docs.map(d => ({
                id: d.id,
                ...(d.data() as Omit<UserNotification, "id">),
            })));
            setLoading(false);
        });

        return () => unsub();
    }, [userId]);

    // Keep selected in sync when Firestore updates
    useEffect(() => {
        if (!selected) return;
        const updated = notifications.find(n => n.id === selected.id);
        if (updated) setSelected(updated);
    }, [notifications]);

    const filtered = useMemo(() =>
            notifications.filter(n => tab === "all" || n.type === tab),
        [notifications, tab]);

    const unreadCount = notifications.filter(n => !n.read).length;

    // ── Firestore actions ─────────────────────────────────────────────────────

    async function markRead(id: string) {
        await updateDoc(doc(db, "notifications", id), { read: true });
    }

    async function markAllRead() {
        const unread = notifications.filter(n => !n.read);
        const batch  = writeBatch(db);
        unread.forEach(n => batch.update(doc(db, "notifications", n.id), { read: true }));
        await batch.commit();
    }

    function openNotification(n: UserNotification) {
        setSelected(n);
        if (!n.read) markRead(n.id);
    }

    // ─────────────────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", paddingTop:64 }}>
                <div style={{ width:24, height:24, borderRadius:"50%", border:"2.5px solid rgba(14,133,178,0.2)", borderTop:"2.5px solid #1E9DC8", animation:"spin 0.7s linear infinite" }}/>
                <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
            </div>
        );
    }

    if (!userId) {
        return (
            <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"1rem", paddingTop:64 }}>
                <p style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.3rem", color:"#0A3D52" }}>Sign in to view your notifications</p>
                <Link href="/auth/login" style={{ background:"linear-gradient(135deg,#28B8E8,#0A6A94)", color:"#fff", padding:"0.65rem 1.5rem", borderRadius:10, textDecoration:"none", fontWeight:700, fontSize:"0.85rem" }}>
                    Sign in
                </Link>
            </div>
        );
    }

    return (
        <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#F0F9FF 0%,#fff 55%,#F0F9FF 100%)", paddingTop:64 }}>
            <style>{`
        @keyframes spin    { to { transform:rotate(360deg) } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

            {/* ── Page header ────────────────────────────────────────────────────── */}
            <div style={{ borderBottom:"1px solid rgba(14,133,178,0.08)", padding:"2.5rem 2rem 0" }}>
                <div style={{ maxWidth:1100, margin:"0 auto" }}>
                    <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:"1rem", flexWrap:"wrap", marginBottom:"1.5rem" }}>
                        <div>
                            <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#EBF8FF", border:"1px solid rgba(14,133,178,0.18)", borderRadius:20, padding:"0.3rem 0.8rem", fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.14em", color:"#1E9DC8", textTransform:"uppercase", marginBottom:"0.75rem" }}>
                                🔔 Notifications
                            </div>
                            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.8rem,3vw,2.4rem)", fontWeight:700, color:"#0A3D52", letterSpacing:"-0.025em", marginBottom:"0.3rem" }}>
                                Your updates
                            </h1>
                            <p style={{ fontSize:"0.88rem", color:"#1A6A8A", fontWeight:300 }}>
                                {notifications.length} notification{notifications.length !== 1 ? "s" : ""} · {unreadCount} unread
                            </p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:"0.83rem", fontWeight:600, color:"#1E9DC8", border:"1px solid rgba(14,133,178,0.25)", borderRadius:10, padding:"0.55rem 1rem", background:"#fff", cursor:"pointer" }}
                            >
                                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 7l3 3 6-6"/></svg>
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Tabs */}
                    <div style={{ display:"flex", gap:"0.25rem", overflowX:"auto" }}>
                        {TABS.map(t => {
                            const active = tab === t.value;
                            const count  = t.value === "all"
                                ? unreadCount
                                : notifications.filter(n => n.type === t.value && !n.read).length;
                            return (
                                <button key={t.value} onClick={() => setTab(t.value)}
                                        style={{ display:"flex", alignItems:"center", gap:"0.4rem", padding:"0.65rem 1rem", borderRadius:"10px 10px 0 0", border:"none", cursor:"pointer", fontSize:"0.83rem", fontWeight:active?700:400, whiteSpace:"nowrap", transition:"all 0.15s", background:active?"#fff":"transparent", color:active?"#0A3D52":"#1A6A8A", borderBottom:active?"2px solid #1E9DC8":"2px solid transparent", marginBottom:active?-1:0 }}>
                                    {t.label}
                                    {count > 0 && (
                                        <span style={{ minWidth:18, height:18, borderRadius:20, padding:"0 5px", background:active?"linear-gradient(135deg,#28B8E8,#0A6A94)":"rgba(14,133,178,0.10)", color:active?"#fff":"#1E9DC8", fontSize:"0.62rem", fontWeight:700, display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
                      {count}
                    </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Content ──────────────────────────────────────────────────────────── */}
            <div style={{ maxWidth:1100, margin:"0 auto", padding:"2rem", display:"grid", gridTemplateColumns:selected?"1fr 380px":"1fr", gap:"1.5rem", alignItems:"start" }}>

                {/* Notification list */}
                <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
                    {filtered.length === 0 ? (
                        <div style={{ padding:"5rem 1rem", display:"flex", flexDirection:"column", alignItems:"center", gap:"1rem", textAlign:"center" }}>
                            <div style={{ width:72, height:72, borderRadius:"50%", background:"linear-gradient(135deg,#EBF8FF,#D6F0FA)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2rem" }}>🔔</div>
                            <p style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.2rem", fontWeight:600, color:"#0A3D52" }}>All caught up ✦</p>
                            <p style={{ fontSize:"0.85rem", color:"#1A6A8A", fontWeight:300 }}>No notifications in this category yet.</p>
                        </div>
                    ) : filtered.map((n, i) => {
                        const meta   = getMeta(n.type);
                        const active = selected?.id === n.id;
                        return (
                            <div
                                key={n.id}
                                onClick={() => openNotification(n)}
                                style={{ display:"flex", alignItems:"flex-start", gap:"1rem", padding:"1.1rem 1.25rem", borderRadius:16, cursor:"pointer", border:active?"1px solid rgba(14,133,178,0.3)":n.read?"1px solid rgba(14,133,178,0.08)":"1px solid rgba(14,133,178,0.18)", background:active?"rgba(14,133,178,0.04)":n.read?"#fff":"rgba(235,248,255,0.6)", boxShadow:active?"0 4px 20px rgba(14,133,178,0.10)":"0 1px 6px rgba(14,133,178,0.06)", transition:"all 0.2s", animation:`fadeUp 0.4s ${i * 0.04}s cubic-bezier(0.22,1,0.36,1) both`, animationFillMode:"both" }}
                            >
                                <div style={{ width:44, height:44, borderRadius:14, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.3rem", background:"rgba(14,133,178,0.06)" }}>
                                    {meta.emoji}
                                </div>
                                <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.25rem" }}>
                                        <p style={{ fontSize:"0.9rem", fontWeight:n.read?500:700, color:"#0A3D52", lineHeight:1.3 }}>
                                            {n.title}
                                        </p>
                                        {!n.read && <span style={{ width:7, height:7, borderRadius:"50%", background:"#1E9DC8", flexShrink:0 }}/>}
                                    </div>
                                    <p style={{ fontSize:"0.82rem", color:"#1A6A8A", fontWeight:300, lineHeight:1.5, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                                        {n.message}
                                    </p>
                                    {n.tourTitle && (
                                        <span style={{ display:"inline-flex", alignItems:"center", gap:4, marginTop:"0.4rem", background:"rgba(14,133,178,0.06)", borderRadius:8, padding:"0.2rem 0.6rem", fontSize:"0.7rem", color:"#1A6A8A" }}>
                      🧭 {n.tourTitle}
                    </span>
                                    )}
                                </div>
                                <p style={{ flexShrink:0, fontSize:"0.7rem", color:"#94A3B8", whiteSpace:"nowrap" }}>
                                    {relativeTime(n.createdAt)}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Detail panel */}
                {selected && (() => {
                    const meta = getMeta(selected.type);
                    return (
                        <div style={{ position:"sticky", top:84, borderRadius:20, border:"1px solid rgba(14,133,178,0.12)", background:"#fff", overflow:"hidden", boxShadow:"0 8px 32px rgba(14,133,178,0.10)", animation:"fadeUp 0.3s cubic-bezier(0.22,1,0.36,1) both" }}>
                            <div style={{ background:"linear-gradient(135deg,#0A3D52,#0E85B2)", padding:"1.5rem" }}>
                                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.75rem" }}>
                                    <span style={{ fontSize:"1.5rem" }}>{meta.emoji}</span>
                                    <button onClick={() => setSelected(null)}
                                            style={{ width:28, height:28, borderRadius:8, background:"rgba(255,255,255,0.15)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M2 2l8 8M10 2L2 10"/></svg>
                                    </button>
                                </div>
                                <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.1rem", fontWeight:700, color:"#fff", lineHeight:1.3, marginBottom:"0.4rem" }}>
                                    {selected.title}
                                </h3>
                                <p style={{ fontSize:"0.7rem", color:"rgba(235,248,255,0.65)", fontWeight:300 }}>
                                    {fmtDate(selected.createdAt)}
                                </p>
                            </div>

                            <div style={{ padding:"1.25rem", display:"flex", flexDirection:"column", gap:"1rem" }}>
                                <p style={{ fontSize:"0.88rem", color:"#1A6A8A", lineHeight:1.7, fontWeight:300 }}>
                                    {selected.message}
                                </p>

                                {selected.adminNote && (
                                    <div style={{ background:"#FEF3C7", border:"1px solid rgba(245,158,11,0.25)", borderRadius:12, padding:"0.85rem 1rem" }}>
                                        <p style={{ fontSize:"0.65rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#92400E", marginBottom:"0.3rem" }}>Note from our team</p>
                                        <p style={{ fontSize:"0.83rem", color:"#78350F", lineHeight:1.6 }}>{selected.adminNote}</p>
                                    </div>
                                )}

                                {selected.tourTitle && (
                                    <div style={{ background:"#F8FCFF", borderRadius:12, padding:"0.85rem 1rem", border:"1px solid rgba(14,133,178,0.08)" }}>
                                        <p style={{ fontSize:"0.62rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#1A6A8A", marginBottom:"0.25rem" }}>Tour</p>
                                        <p style={{ fontSize:"0.88rem", fontWeight:600, color:"#0A3D52" }}>{selected.tourTitle}</p>
                                        {selected.startDate && (
                                            <p style={{ fontSize:"0.78rem", color:"#1A6A8A", marginTop:"0.2rem" }}>Departure: {selected.startDate}</p>
                                        )}
                                    </div>
                                )}

                                {selected.bookingId && (
                                    <Link href={`/bookings/${selected.bookingId}/confirmation`}
                                          style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", padding:"0.85rem", borderRadius:12, background:"linear-gradient(135deg,#28B8E8,#0A6A94)", color:"#fff", fontWeight:700, fontSize:"0.85rem", textDecoration:"none", boxShadow:"0 4px 16px rgba(14,133,178,0.32)" }}>
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 7l3 3 6-6"/></svg>
                                        View booking confirmation
                                    </Link>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}