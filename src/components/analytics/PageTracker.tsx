"use client";

import { usePageTracking } from "@/src/lib/analytics/track";
import { Suspense } from "react";

function Tracker() {
    usePageTracking();
    return null;
}

// Wrapped in Suspense because useSearchParams() requires it in Next.js App Router
export function PageTracker() {
    return (
        <Suspense fallback={null}>
            <Tracker/>
        </Suspense>
    );
}