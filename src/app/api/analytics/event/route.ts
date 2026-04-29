// src/app/api/analytics/event/route.ts

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const ALLOWED_EVENTS = new Set([
    "page_view",
    "tour_viewed", "booking_started", "booking_completed",
    "booking_cancelled", "payment_started", "payment_completed",
    "user_signed_up", "guide_viewed", "destination_viewed",
]);

// ─── Geo resolution ───────────────────────────────────────────────────────────

type GeoInfo = { country: string; countryCode: string; city: string; region: string; continent: string };

function continentFromCode(cc: string): string {
    const map: Record<string, string> = {
        ET:"Africa", KE:"Africa", NG:"Africa", ZA:"Africa", EG:"Africa", GH:"Africa",
        GB:"Europe", DE:"Europe", FR:"Europe", IT:"Europe", ES:"Europe", SE:"Europe", NL:"Europe",
        US:"North America", CA:"North America", MX:"North America",
        CN:"Asia", JP:"Asia", IN:"Asia", KR:"Asia", AE:"Asia", SG:"Asia", TH:"Asia",
        AU:"Oceania", NZ:"Oceania",
        BR:"South America", AR:"South America", CO:"South America",
    };
    return map[cc] ?? "Unknown";
}

async function resolveGeo(req: NextRequest): Promise<GeoInfo> {
    // 1. Cloudflare
    const cfCountry = req.headers.get("cf-ipcountry");
    if (cfCountry && cfCountry !== "XX") {
        return {
            country:     req.headers.get("cf-ipcountry-name") ?? cfCountry,
            countryCode: cfCountry,
            city:        req.headers.get("cf-ipcity")    ?? "Unknown",
            region:      req.headers.get("cf-region")    ?? "Unknown",
            continent:   req.headers.get("cf-ipcontinent") ?? continentFromCode(cfCountry),
        };
    }

    // 2. Vercel
    const vercelCountry = req.headers.get("x-vercel-ip-country");
    if (vercelCountry) {
        const city = req.headers.get("x-vercel-ip-city");
        return {
            country:     vercelCountry,
            countryCode: vercelCountry,
            city:        city ? decodeURIComponent(city) : "Unknown",
            region:      req.headers.get("x-vercel-ip-country-region") ?? "Unknown",
            continent:   continentFromCode(vercelCountry),
        };
    }

    // 3. ip-api.com
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    if (!ip || ip === "::1" || ip.startsWith("192.168") || ip.startsWith("10.") || ip.startsWith("127.")) {
        return { country:"Local", countryCode:"LC", city:"Localhost", region:"Dev", continent:"Unknown" };
    }
    try {
        const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,continent`, {
            signal: AbortSignal.timeout(1500),
        });
        if (res.ok) {
            const data = await res.json();
            if (data.status === "success") {
                return { country:data.country??"Unknown", countryCode:data.countryCode??"XX", city:data.city??"Unknown", region:data.regionName??"Unknown", continent:data.continent??"Unknown" };
            }
        }
    } catch { /* timeout */ }

    return { country:"Unknown", countryCode:"XX", city:"Unknown", region:"Unknown", continent:"Unknown" };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { event, props, url, referrer, visitorId, timestamp } = body;

        if (!event || !ALLOWED_EVENTS.has(event)) {
            return NextResponse.json({ ok: false }, { status: 204 });
        }

        // Auth (optional)
        let userId: string | null = null;
        try {
            const { adminAuth } = await import("@/src/lib/firebase-admin");
            const session = req.cookies.get("session")?.value;
            if (session) {
                const decoded = await adminAuth.verifySessionCookie(session);
                userId = decoded.uid;
            }
        } catch { /* anonymous */ }

        const geo     = await resolveGeo(req);
        const dateStr = new Date().toISOString().slice(0, 10);
        const path    = typeof url === "string" ? url.split("?")[0] : null; // strip query params

        // ── Write event doc ───────────────────────────────────────────────────────
        await adminDb.collection("analytics").doc(dateStr).collection("events").add({
            event,
            props:       props ?? {},
            url:         path  ?? null,
            referrer:    referrer ?? null,
            userId,
            visitorId:   visitorId ?? null,  // session-scoped, not PII
            country:     geo.country,
            countryCode: geo.countryCode,
            city:        geo.city,
            region:      geo.region,
            continent:   geo.continent,
            ip:          req.headers.get("x-forwarded-for")?.split(",")[0] ?? null,
            createdAt:   FieldValue.serverTimestamp(),
            clientTs:    timestamp ?? null,
        });

        // ── Increment counters ────────────────────────────────────────────────────
        const counterRef = adminDb.collection("analyticsCounters").doc(dateStr);

        const counterUpdates: Record<string, unknown> = {
            date: dateStr,
            [`events.${event}`]: FieldValue.increment(1),
            "events.total":       FieldValue.increment(1),
            [`countries.${geo.countryCode}`]:  FieldValue.increment(1),
            [`continents.${geo.continent}`]:   FieldValue.increment(1),
            [`cities.${geo.countryCode}_${geo.city.replace(/\s+/g, "_").slice(0, 30)}`]: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp(),
        };

        // Extra counters only for page_view
        if (event === "page_view") {
            counterUpdates["pageViews.total"] = FieldValue.increment(1);

            // Per-path view count (strip leading slash, replace / with _, max 60 chars)
            if (path) {
                const pathKey = path.replace(/^\//, "").replace(/\//g, "_").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60) || "home";
                counterUpdates[`pageViews.paths.${pathKey}`] = FieldValue.increment(1);
            }

            // Unique visitor tracking — store visitorId in a set doc for the day
            // so we can count distinct visitors without counting each page_view
            if (visitorId) {
                const visitorRef = adminDb
                    .collection("analyticsVisitors")
                    .doc(dateStr)
                    .collection("ids")
                    .doc(visitorId.slice(0, 40)); // doc ID = visitor ID (auto-deduplicates)

                // setMerge with a creation timestamp — if doc already exists, this is a no-op
                await visitorRef.set({
                    firstSeen:   FieldValue.serverTimestamp(),
                    countryCode: geo.countryCode,
                    userId:      userId ?? null,
                }, { merge: false }).catch(() => {
                    // Doc already exists — this visitor was already counted today. That's fine.
                });
            }
        }

        await counterRef.set(counterUpdates, { merge: true });

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        console.error("[analytics/event]", err.message);
        return NextResponse.json({ ok: false }, { status: 204 });
    }
}