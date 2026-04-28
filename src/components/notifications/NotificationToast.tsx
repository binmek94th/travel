
"use client";

import { useEffect } from "react";
import type { TravelerNotification } from "@/src/hooks/useNotifications";
import { getNotificationMeta } from "./NotificationMeta";

export function NotificationToast({
                                      notification,
                                      onDismiss,
                                      onView,
                                  }: {
    notification: TravelerNotification;
    onDismiss:    () => void;
    onView?:      (n: TravelerNotification) => void;
}) {
    const meta = getNotificationMeta(notification.type);

    // Auto-dismiss after 6 s
    useEffect(() => {
        const t = setTimeout(onDismiss, 6000);
        return () => clearTimeout(t);
    }, [onDismiss]);

    return (
        <div
            className={`fixed bottom-6 right-6 z-[100] w-[340px] bg-white rounded-2xl shadow-2xl
                  border border-slate-100 overflow-hidden ring-1 ${meta.ring}
                  animate-in slide-in-from-bottom-4 fade-in duration-300`}
            style={{ boxShadow: "0 24px 64px -12px rgba(15,23,42,0.22)" }}
        >
            {/* Coloured accent bar */}
            <div className={`h-1 w-full ${meta.bg}`} />

            <div className="flex items-start gap-3 px-4 py-4">
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${meta.bg} ${meta.accent}
                         flex items-center justify-center`}>
                    {meta.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 leading-snug">
                        {notification.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                        {notification.message}
                    </p>

                    {/* Admin note */}
                    {notification.adminNote && (
                        <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                            <p className="text-[11px] text-amber-700 leading-relaxed">
                                💬 {notification.adminNote}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                        {onView && notification.bookingId && (
                            <button
                                onClick={() => { onView(notification); onDismiss(); }}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${meta.bg} ${meta.accent}
                            transition-opacity hover:opacity-80`}
                            >
                                View booking →
                            </button>
                        )}
                        <button
                            onClick={onDismiss}
                            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5 transition-colors"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>

                {/* Close */}
                <button
                    onClick={onDismiss}
                    className="flex-shrink-0 w-6 h-6 rounded-md hover:bg-slate-100 flex items-center
                     justify-center text-slate-300 hover:text-slate-500 transition-colors -mt-0.5"
                >
                    <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor"
                         strokeWidth="2" strokeLinecap="round">
                        <path d="M2 2l8 8M10 2L2 10"/>
                    </svg>
                </button>
            </div>
        </div>
    );
}