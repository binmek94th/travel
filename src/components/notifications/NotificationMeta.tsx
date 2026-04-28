// src/components/notifications/notificationMeta.tsx

import type { TravelerNotificationType } from "@/src/hooks/useNotifications";

export type NotificationMeta = {
    icon:   React.ReactNode;
    accent: string;
    bg:     string;
    ring:   string;
};

const META: Record<TravelerNotificationType, NotificationMeta> = {
    booking_confirmed: {
        accent: "text-emerald-600",
        bg:     "bg-emerald-50",
        ring:   "ring-emerald-200",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                <path d="M5 10l3.5 3.5L15 6"/>
                <circle cx="10" cy="10" r="8"/>
            </svg>
        ),
    },
    booking_cancelled: {
        accent: "text-red-500",
        bg:     "bg-red-50",
        ring:   "ring-red-200",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                <path d="M7 7l6 6M13 7l-6 6"/>
                <circle cx="10" cy="10" r="8"/>
            </svg>
        ),
    },
    booking_reminder: {
        accent: "text-amber-600",
        bg:     "bg-amber-50",
        ring:   "ring-amber-200",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                <circle cx="10" cy="10" r="8"/>
                <path d="M10 6v4l2.5 2.5"/>
            </svg>
        ),
    },
    payment_received: {
        accent: "text-teal-600",
        bg:     "bg-teal-50",
        ring:   "ring-teal-200",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                <rect x="2" y="5" width="16" height="12" rx="2"/>
                <path d="M2 9h16"/>
            </svg>
        ),
    },
    message: {
        accent: "text-cyan-600",
        bg:     "bg-cyan-50",
        ring:   "ring-cyan-200",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                <path d="M2 4h16v10a2 2 0 01-2 2H4a2 2 0 01-2-2V4z"/>
                <path d="M6 8h8M6 11h5"/>
            </svg>
        ),
    },
    promo: {
        accent: "text-violet-600",
        bg:     "bg-violet-50",
        ring:   "ring-violet-200",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                <path d="M10 2l2 5.5H18l-4.8 3.5 1.8 5.5L10 13l-5 3.5 1.8-5.5L2 7.5h6z"/>
            </svg>
        ),
    },
};

export function getNotificationMeta(type: TravelerNotificationType): NotificationMeta {
    return META[type] ?? META.message;
}

export function relativeTime(ts: import("firebase/firestore").Timestamp | null): string {
    if (!ts) return "just now";
    const secs = Math.floor((Date.now() - ts.toMillis()) / 1000);
    if (secs < 60)    return "just now";
    if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
}