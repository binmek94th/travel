// src/components/analytics/TrafficAnalytics.tsx
// Drop this inside <head> in src/app/layout.tsx
// Supports Google Analytics 4 + Plausible simultaneously

import Script from "next/script";

const GA_ID       = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;   // e.g. G-XXXXXXXXXX
const PLAUSIBLE   = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;    // e.g. tizitaw.com

export function TrafficAnalytics() {
    return (
        <>
            {/* ── Google Analytics 4 ───────────────────────────────────────────── */}
            {GA_ID && (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
                        strategy="afterInteractive"
                    />
                    <Script id="ga4-init" strategy="afterInteractive">
                        {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', {
                page_path: window.location.pathname,
                send_page_view: true,
              });
            `}
                    </Script>
                </>
            )}

            {/* ── Plausible ────────────────────────────────────────────────────── */}
            {PLAUSIBLE && (
                <Script
                    defer
                    data-domain={PLAUSIBLE}
                    src="https://plausible.io/js/script.js"
                    strategy="afterInteractive"
                />
            )}
        </>
    );
}