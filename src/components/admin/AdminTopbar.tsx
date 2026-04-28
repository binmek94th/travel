"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase"; // your client-side Firebase instance

// ─── Page title map ───────────────────────────────────────────────────────────

const TITLES: Record<string, string> = {
  "/admin":              "Dashboard",
  "/admin/users":        "Users",
  "/admin/destinations": "Destinations",
  "/admin/tours":        "Tours",
  "/admin/bookings":     "Bookings",
  "/admin/operators":    "Operators",
  "/admin/reviews":      "Reviews",
  "/admin/payments":     "Payments",
  "/admin/featured":     "Featured Listings",
  "/admin/videos":       "Videos",
  "/admin/guides":       "Guides & Blog",
  "/admin/routes":       "Travel Routes",
  "/admin/events":       "Events",
  "/admin/qa":           "Q&A Posts",
  "/admin/settings":     "Settings",
};

// ─── Notification type ────────────────────────────────────────────────────────

type NotificationType =
    | "booking_confirmed"
    | "booking_cancelled"
    | "new_booking"
    | "operator_applied"
    | "review_flagged"
    | "payment_received";

type AdminNotification = {
  id: string;
  type: NotificationType;
  message: string;
  bookingId?: string;
  userId?: string;
  read: boolean;
  createdAt: Timestamp | null;
};

// ─── Per-type icon & colour ───────────────────────────────────────────────────

const TYPE_META: Record<NotificationType, { icon: React.ReactNode; accent: string; bg: string }> = {
  booking_confirmed: {
    accent: "text-emerald-600",
    bg:     "bg-emerald-50",
    icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M3 8l3.5 3.5L13 4"/>
        </svg>
    ),
  },
  booking_cancelled: {
    accent: "text-red-500",
    bg:     "bg-red-50",
    icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M4 4l8 8M12 4l-8 8"/>
        </svg>
    ),
  },
  new_booking: {
    accent: "text-cyan-600",
    bg:     "bg-cyan-50",
    icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <rect x="2" y="3" width="12" height="12" rx="2"/>
          <path d="M2 7h12M6 1v3M10 1v3"/>
        </svg>
    ),
  },
  operator_applied: {
    accent: "text-violet-600",
    bg:     "bg-violet-50",
    icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="8" cy="5" r="3"/>
          <path d="M2 14c0-3 2.7-5 6-5s6 2 6 5"/>
        </svg>
    ),
  },
  review_flagged: {
    accent: "text-amber-600",
    bg:     "bg-amber-50",
    icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M8 2l1.5 4.5H14l-3.7 2.7 1.4 4.3L8 11l-3.7 2.5 1.4-4.3L2 6.5h4.5z"/>
        </svg>
    ),
  },
  payment_received: {
    accent: "text-teal-600",
    bg:     "bg-teal-50",
    icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <rect x="1" y="4" width="14" height="10" rx="2"/>
          <path d="M1 8h14"/>
        </svg>
    ),
  },
};

function getMeta(type: NotificationType) {
  return TYPE_META[type] ?? TYPE_META.new_booking;
}

// ─── Relative time ────────────────────────────────────────────────────────────

function relativeTime(ts: Timestamp | null): string {
  if (!ts) return "just now";
  const secs = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (secs < 60)   return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400)return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

// ─── Notification dropdown ────────────────────────────────────────────────────

function NotificationDropdown({
                                notifications,
                                onMarkRead,
                                onMarkAllRead,
                                onClose,
                              }: {
  notifications: AdminNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
}) {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
      <div
          className="absolute right-0 top-[calc(100%+8px)] w-[360px] bg-white rounded-2xl shadow-2xl
                 border border-slate-100 z-50 overflow-hidden
                 animate-in fade-in slide-in-from-top-2 duration-150"
          style={{ boxShadow: "0 20px 60px -10px rgba(15,23,42,0.18)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800"
                style={{ fontFamily:"'Playfair Display',serif" }}>
            Notifications
          </span>
            {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-red-500 text-white rounded-full
                             px-1.5 py-0.5 leading-none">
              {unreadCount}
            </span>
            )}
          </div>
          {unreadCount > 0 && (
              <button
                  onClick={onMarkAllRead}
                  className="text-xs text-cyan-600 hover:text-cyan-800 font-medium transition-colors"
              >
                Mark all read
              </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-50">
          {notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-2 text-slate-400">
                <svg className="w-8 h-8 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <path strokeLinecap="round" d="M15 17H9m6 0a3 3 0 006 0v-1a3 3 0 00-3-2.83V9a6 6 0 10-12 0v4.17A3 3 0 003 16v1a3 3 0 006 0m6 0H9"/>
                </svg>
                <p className="text-sm">You're all caught up ✦</p>
              </div>
          ) : (
              notifications.map(n => {
                const meta = getMeta(n.type);
                return (
                    <button
                        key={n.id}
                        onClick={() => { onMarkRead(n.id); onClose(); }}
                        className={`w-full flex items-start gap-3 px-4 py-3.5 text-left
                            transition-colors hover:bg-slate-50/80
                            ${!n.read ? "bg-cyan-50/30" : ""}`}
                    >
                      {/* Icon bubble */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-xl ${meta.bg} ${meta.accent}
                                 flex items-center justify-center mt-0.5`}>
                        {meta.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${!n.read ? "text-slate-800 font-medium" : "text-slate-600"}`}>
                          {n.message}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{relativeTime(n.createdAt)}</p>
                      </div>

                      {/* Unread dot */}
                      {!n.read && (
                          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-cyan-500 mt-1.5" />
                      )}
                    </button>
                );
              })
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
            <div className="border-t border-slate-100 px-4 py-2.5">
              <a href="/admin/notifications"
                 className="text-xs text-slate-400 hover:text-cyan-600 transition-colors">
                View all notifications →
              </a>
            </div>
        )}
      </div>
  );
}

// ─── Main topbar ──────────────────────────────────────────────────────────────

export default function AdminTopbar() {
  const pathname  = usePathname();
  const title     = TITLES[pathname] ?? "Admin";

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [open, setOpen]                   = useState(false);
  const bellRef                           = useRef<HTMLDivElement>(null);

  // ── Real-time Firestore listener for admin notifications ──────────────────
  // Admin notifications are stored in /adminNotifications (separate from user
  // notifications). If you want to re-use /notifications filtered by a role,
  // adjust the query below.
  useEffect(() => {
    const q = query(
        collection(db, "adminNotifications"),
        orderBy("createdAt", "desc"),
        limit(30)
    );

    const unsub = onSnapshot(q, snap => {
      setNotifications(
          snap.docs.map(d => ({
            id: d.id,
            ...(d.data() as Omit<AdminNotification, "id">),
          }))
      );
    });

    return () => unsub();
  }, []);

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  // ── Mark single notification read ─────────────────────────────────────────
  async function markRead(id: string) {
    setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    await updateDoc(doc(db, "adminNotifications", id), { read: true });
  }

  // ── Mark all read ──────────────────────────────────────────────────────────
  async function markAllRead() {
    const unread = notifications.filter(n => !n.read);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    const batch = writeBatch(db);
    unread.forEach(n => {
      batch.update(doc(db, "adminNotifications", n.id), { read: true });
    });
    await batch.commit();
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
      <header className="h-[60px] bg-white border-b border-slate-100 flex items-center py-2 px-6 gap-4 sticky top-0 z-40 shadow-sm">
        <h1
            className="flex-1 text-lg font-light text-slate-800 tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {title}
        </h1>

        {/* Search */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-56">
          <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" viewBox="0 0 16 16" fill="none"
               stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="7" cy="7" r="5"/><path d="M12 12l3 3"/>
          </svg>
          <input
              className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
              placeholder="Search…"
          />
        </div>

        {/* Bell button + dropdown */}
        <div ref={bellRef} className="relative">
          <button
              onClick={() => setOpen(v => !v)}
              className={`relative w-9 h-9 rounded-lg border flex items-center justify-center transition-colors
                      ${open
                  ? "border-cyan-300 bg-cyan-50 text-cyan-600"
                  : "border-slate-200 bg-white text-slate-500 hover:border-cyan-300 hover:text-cyan-600"}`}
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M10 2a6 6 0 016 6v3l2 3H2l2-3V8a6 6 0 016-6z"/>
              <path d="M8 17a2 2 0 004 0"/>
            </svg>

            {/* Unread badge */}
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white
                             text-[9px] font-bold rounded-full border-2 border-white
                             flex items-center justify-center leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
            )}
          </button>

          {open && (
              <NotificationDropdown
                  notifications={notifications}
                  onMarkRead={markRead}
                  onMarkAllRead={markAllRead}
                  onClose={() => setOpen(false)}
              />
          )}
        </div>
      </header>
  );
}