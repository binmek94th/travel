// src/lib/analytics/track.ts
// ─── Client-side event tracker ────────────────────────────────────────────────
// Usage:
//   import { track } from "@/src/lib/analytics/track";
//   track("tour_viewed", { tourId, tourTitle, priceUSD });
//   track("booking_started", { tourId, travelers });

"use client";

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
    | string; // allow custom events

type EventProperties = Record<string, string | number | boolean | null | undefined>;

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
        plausible?: (event: string, opts?: { props: EventProperties }) => void;
    }
}

export function track(event: EventName, props: EventProperties = {}) {
    // 1. Google Analytics 4
    if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", event, props);
    }

    // 2. Plausible
    if (typeof window !== "undefined" && window.plausible) {
        window.plausible(event, { props });
    }

    // 3. Fire-and-forget to our own Firestore event log (product analytics)
    //    We only log business-critical events, not every page view
    const productEvents: EventName[] = [
        "tour_viewed", "booking_started", "booking_completed",
        "booking_cancelled", "payment_started", "payment_completed",
        "user_signed_up", "guide_viewed", "destination_viewed",
    ];

    if (productEvents.includes(event)) {
        fetch("/api/analytics/event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                event,
                props,
                url:       window.location.pathname,
                referrer:  document.referrer || null,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
            }),
            // keepalive ensures the request completes even if the page unloads
            keepalive: true,
        }).catch(() => {}); // silent — analytics must never break the app
    }
}

// ─── React hook for page-level tracking ───────────────────────────────────────

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function usePageTracking() {
    const pathname     = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");

        // GA4 SPA page view
        if (typeof window !== "undefined" && window.gtag) {
            window.gtag("config", process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "", {
                page_path: url,
            });
        }
    }, [pathname, searchParams]);
}