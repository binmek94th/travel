// src/components/notifications/NotificationBell.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import type { TravelerNotification } from "@/src/hooks/useNotifications";
import { getNotificationMeta, relativeTime } from "./NotificationMeta";

export function NotificationBell({
                                     notifications,
                                     onMarkRead,
                                     onMarkAllRead,
                                 }: {
    notifications: TravelerNotification[];
    onMarkRead:    (id: string) => void;
    onMarkAllRead: () => void;
}) {
    const [open, setOpen] = useState(false);
    const ref             = useRef<HTMLDivElement>(null);
    const unread          = notifications.filter(n => !n.read).length;

    // Close on outside click
    useEffect(() => {
        function handler(e: PointerEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("pointerdown", handler);
        return () => document.removeEventListener("pointerdown", handler);
    }, []);

    return (
        <div ref={ref} className="relative">
            {/* Bell button */}
            <button
                onClick={() => setOpen(v => !v)}
                className={`relative w-10 h-10 rounded-xl border flex items-center justify-center transition-colors
                    ${open
                    ? "border-cyan-300 bg-cyan-50 text-cyan-600"
                    : "border-slate-200 bg-white text-slate-500 hover:border-cyan-300 hover:text-cyan-600"}`}
            >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor"
                     strokeWidth="1.5" strokeLinecap="round">
                    <path d="M10 2a6 6 0 016 6v3l2 3H2l2-3V8a6 6 0 016-6z"/>
                    <path d="M8 17a2 2 0 004 0"/>
                </svg>
                {unread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white
                           text-[9px] font-bold rounded-full border-2 border-white
                           flex items-center justify-center leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div
                    className="absolute right-0 top-[calc(100%+8px)] w-[340px] bg-white rounded-2xl shadow-2xl
                     border border-slate-100 z-50 overflow-hidden
                     animate-in fade-in slide-in-from-top-2 duration-150"
                    style={{ boxShadow: "0 20px 60px -10px rgba(15,23,42,0.18)" }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-800">Notifications</span>
                            {unread > 0 && (
                                <span className="text-[10px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5 leading-none">
                  {unread}
                </span>
                            )}
                        </div>
                        {unread > 0 && (
                            <button
                                onClick={onMarkAllRead}
                                className="text-xs text-cyan-600 hover:text-cyan-800 font-medium transition-colors"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Items */}
                    <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                            <div className="py-10 flex flex-col items-center gap-2 text-slate-400">
                                <svg className="w-8 h-8 opacity-30" viewBox="0 0 24 24" fill="none"
                                     stroke="currentColor" strokeWidth="1.3">
                                    <path strokeLinecap="round" d="M15 17H9m6 0a3 3 0 006 0v-1a3 3 0 00-3-2.83V9a6 6 0 10-12 0v4.17A3 3 0 003 16v1a3 3 0 006 0m6 0H9"/>
                                </svg>
                                <p className="text-sm">You're all caught up ✦</p>
                            </div>
                        ) : (
                            notifications.map(n => {
                                const meta = getNotificationMeta(n.type);
                                return (
                                    <button
                                        key={n.id}
                                        onClick={() => onMarkRead(n.id)}
                                        className={`w-full flex items-start gap-3 px-4 py-3.5 text-left
                                transition-colors hover:bg-slate-50
                                ${!n.read ? "bg-cyan-50/30" : ""}`}
                                    >
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-xl ${meta.bg} ${meta.accent}
                                     flex items-center justify-center mt-0.5 [&>svg]:w-4 [&>svg]:h-4`}>
                                            {meta.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm leading-snug ${!n.read ? "text-slate-800 font-medium" : "text-slate-600"}`}>
                                                {n.title}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                                            {n.adminNote && (
                                                <p className="text-[11px] text-amber-600 mt-1 italic">💬 {n.adminNote}</p>
                                            )}
                                            <p className="text-[10px] text-slate-300 mt-1">{relativeTime(n.createdAt)}</p>
                                        </div>
                                        {!n.read && (
                                            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-cyan-500 mt-1.5" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}