// src/lib/analytics/track.ts
"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type EventName =
    | "page_view"
    | "tour_viewed"
    | "tour_search"
    | "destination_viewed"
    | "guide_viewed"
    | "booking_started"
    | "booking_completed"
    | "booking_cancelled"
    | "payment_started"
    | "payment_completed"
    | "user_signed_up"
    | "user_signed_in"
    | "cta_clicked"
    | "share_clicked"
    | "filter_used"
    | string;

type EventProperties = Record<string, string | number | boolean | null | undefined>;

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
        plausible?: (event: string, opts?: { props: EventProperties }) => void;
    }
}

// ── Lightweight visitor ID ─────────────────────────────────────────────────────
// Not a tracking cookie — just a session-scoped random ID so we can count
// unique visitors per session without storing PII. Cleared when tab closes.

function getVisitorId(): string {
    const key = "_tz_vid";
    let vid = sessionStorage.getItem(key);
    if (!vid) {
        vid = Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem(key, vid);
    }
    return vid;
}

// ── Core track function ────────────────────────────────────────────────────────

export function track(event: EventName, props: EventProperties = {}) {
    // 1. Google Analytics 4
    if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", event, props);
    }

    // 2. Plausible
    if (typeof window !== "undefined" && window.plausible) {
        window.plausible(event, { props });
    }

    // 3. Our own Firestore event log — now includes page_view
    const productEvents: EventName[] = [
        "page_view",
        "tour_viewed", "booking_started", "booking_completed",
        "booking_cancelled", "payment_started", "payment_completed",
        "user_signed_up", "guide_viewed", "destination_viewed",
    ];

    if (productEvents.includes(event)) {
        let visitorId = "";
        try { visitorId = getVisitorId(); } catch { /* SSR guard */ }

        fetch("/api/analytics/event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                event,
                props,
                url:       typeof window !== "undefined" ? window.location.pathname : null,
                referrer:  typeof document !== "undefined" ? (document.referrer || null) : null,
                userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
                visitorId, // session-scoped, not stored as PII
                timestamp: new Date().toISOString(),
            }),
            keepalive: true,
        }).catch(() => {});
    }
}

// ── Page tracking hook ─────────────────────────────────────────────────────────

export function usePageTracking() {
    const pathname     = usePathname();
    const searchParams = useSearchParams();
    // Track only the first view per pathname per session to avoid double-counting
    const tracked = useRef<Set<string>>(new Set());

    useEffect(() => {
        const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");

        // GA4 SPA page view
        if (typeof window !== "undefined" && window.gtag) {
            window.gtag("config", process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "", {
                page_path: url,
            });
        }

        // Firestore page view — deduplicated per session per path
        if (!tracked.current.has(pathname)) {
            tracked.current.add(pathname);
            track("page_view", { path: pathname });
        }
    }, [pathname, searchParams]);
}