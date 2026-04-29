// src/app/api/ai-planner/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const maxDuration = 60;

// ─── Rate limit config ────────────────────────────────────────────────────────
// Anonymous users:    5 requests / hour
// Signed-in users:   20 requests / hour
// Sliding window — counts requests in the last 60 minutes

const LIMITS = {
    anonymous: { requests: 7,  windowMs: 60 * 60 * 1000 },
    authed:    { requests: 20, windowMs: 60 * 60 * 1000 },
};

// ─── Rate limit check via Firestore ───────────────────────────────────────────
// Each key gets a doc in `rateLimits/{key}` with an array of timestamps.
// We prune old timestamps and check the count — pure sliding window, no Redis needed.

async function checkRateLimit(key: string, isAuthed: boolean): Promise<{
    allowed: boolean;
    remaining: number;
    resetInMs: number;
}> {
    const limit     = isAuthed ? LIMITS.authed : LIMITS.anonymous;
    const now       = Date.now();
    const windowStart = now - limit.windowMs;
    const docRef    = adminDb.collection("rateLimits").doc(key);

    try {
        const result = await adminDb.runTransaction(async tx => {
            const snap = await tx.get(docRef);
            const data = snap.data();

            // Filter out timestamps older than the window
            const timestamps: number[] = (data?.timestamps ?? []).filter((t: number) => t > windowStart);

            if (timestamps.length >= limit.requests) {
                // Oldest timestamp in window — reset happens when it falls out
                const oldest   = Math.min(...timestamps);
                const resetInMs = (oldest + limit.windowMs) - now;
                return { allowed: false, remaining: 0, resetInMs: Math.max(0, resetInMs) };
            }

            // Allow — append current timestamp
            timestamps.push(now);
            tx.set(docRef, {
                timestamps,
                updatedAt: FieldValue.serverTimestamp(),
            });

            return {
                allowed:   true,
                remaining: limit.requests - timestamps.length,
                resetInMs: limit.windowMs,
            };
        });

        return result;
    } catch {
        // If Firestore fails, allow the request rather than blocking users
        return { allowed: true, remaining: 1, resetInMs: limit.windowMs };
    }
}

// ─── Get rate limit key ───────────────────────────────────────────────────────
// Keyed by userId for authenticated users, IP + user agent hash for anonymous.

async function getRateLimitKey(req: NextRequest): Promise<{ key: string; isAuthed: boolean }> {
    // Try session cookie first
    try {
        const { adminAuth } = await import("@/src/lib/firebase-admin");
        const session = req.cookies.get("session")?.value;
        if (session) {
            const decoded = await adminAuth.verifySessionCookie(session, true);
            return { key: `user_${decoded.uid}`, isAuthed: true };
        }
    } catch { /* not signed in */ }

    // Anonymous — use IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        ?? req.headers.get("x-real-ip")
        ?? "unknown";

    // Sanitise IP for use as a Firestore doc ID
    const safeIp = ip.replace(/[:/]/g, "_").slice(0, 64);
    return { key: `anon_${safeIp}`, isAuthed: false };
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert Ethiopia travel planner for Tizitaw Ethiopia — a curated travel platform.

Your role is to create deeply personalised, practical, and inspiring itineraries for Ethiopia.

PLATFORM CONTEXT:
You have access to real destinations, tours, routes, events, and guides available on the platform. When you recommend any of these, include its ID tag so the user can see a clickable card:
- Destinations: [dest:DESTINATION_ID]
- Tours:        [tour:TOUR_ID]
- Routes:       [route:ROUTE_ID]
- Events:       [event:EVENT_ID]
- Guides:       [guide:GUIDE_ID]

Only include tags for items actually in the provided lists. Place the tag immediately after mentioning the name.

WHAT TO INCLUDE IN AN ITINERARY:
1. Day-by-day plan — specific destinations, activities, travel time between stops, suggested accommodation tier
2. Curated routes — suggest a matching platform route if one covers the user's regions
3. Suggested tours — match to the user's style and budget
4. Events — flag any relevant festivals or ceremonies happening in the requested timeframe
5. Guides — suggest a local guide if one operates in the key regions
6. Budget breakdown — accommodation, food, transport, tours, miscellaneous (per person, in USD)
7. Best time to visit — seasonal advice for the specific regions
8. Packing tips — tailored to travel style

FORMATTING:
- Use clear headings (##) and bullet points
- Day headers like: ## Day 1–2: Addis Ababa
- Keep tone warm, knowledgeable, and inspiring
- Include practical logistics (internal flights vs road, journey times)
- Flag must-book-in-advance items and upcoming events

ETHIOPIA EXPERTISE:
- Dry season (Oct–March) is generally best for most regions
- Danakil Depression requires specialist guide; physically demanding
- Lalibela is best around Ethiopian Christmas (Jan 7) or Timkat (Jan 19) — very crowded
- Simien Mountains need acclimatisation — don't ascend too fast
- Omo Valley: best Sep–Feb; some sites require permits
- Ethiopian Airlines is the main domestic carrier (Addis to Lalibela, Axum, Gondar etc.)
- Road travel in highlands can be slow but scenic
- Tipping culture: guides USD 5–10/day, drivers USD 3–5/day

Always be honest about challenges (distance, altitude, cost) while keeping the spirit adventurous and encouraging.`;

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    // ── 1. Rate limit check ──────────────────────────────────────────────────
    const { key, isAuthed } = await getRateLimitKey(req);
    const { allowed, remaining, resetInMs } = await checkRateLimit(key, isAuthed);

    if (!allowed) {
        const resetInMins = Math.ceil(resetInMs / 60000);
        return NextResponse.json(
            {
                error: isAuthed
                    ? `You've reached the limit of ${LIMITS.authed.requests} AI requests per hour. Please try again in ${resetInMins} minute${resetInMins !== 1 ? "s" : ""}.`
                    : `You've reached the limit of ${LIMITS.anonymous.requests} AI requests per hour. Sign in to get a higher limit, or try again in ${resetInMins} minute${resetInMins !== 1 ? "s" : ""}.`,
                code:        "rate_limited",
                resetInMs,
                remaining:   0,
                isAuthed,
            },
            {
                status: 429,
                headers: {
                    "Retry-After":              String(Math.ceil(resetInMs / 1000)),
                    "X-RateLimit-Limit":        String(isAuthed ? LIMITS.authed.requests : LIMITS.anonymous.requests),
                    "X-RateLimit-Remaining":    "0",
                    "X-RateLimit-Reset":        String(Math.floor((Date.now() + resetInMs) / 1000)),
                },
            }
        );
    }

    // ── 2. Parse body ────────────────────────────────────────────────────────
    const { messages, destinations, tours, routes, events, guides } = await req.json();

    if (!messages?.length) {
        return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    // ── 3. Build context ─────────────────────────────────────────────────────
    const destContext = (destinations ?? [])
        .map((d: any) => `- ${d.name} [dest:${d.id}] | Region: ${d.region} | Categories: ${d.categories?.join(", ")} | ${d.description}`)
        .join("\n");

    const tourContext = (tours ?? [])
        .map((t: any) => `- ${t.title} [tour:${t.id}] | ${t.durationDays}d | $${t.priceUSD} | Region: ${t.region} | Categories: ${t.categories?.join(", ")} | ${t.description}`)
        .join("\n");

    const routeContext = (routes ?? []).length
        ? (routes as any[]).map(r => `- ${r.name} [route:${r.id}] | ${r.totalDays} days | Stops: ${r.stops?.map((s: any) => s.destName ?? s.destinationId).join(" → ")} | ${r.description}`).join("\n")
        : "None listed";

    const eventContext = (events ?? []).length
        ? (events as any[]).map(e => `- ${e.name} [event:${e.id}] | Type: ${e.type} | Dates: ${e.startDate}→${e.endDate} | Location: ${e.location ?? e.destName ?? ""} | ${e.description}`).join("\n")
        : "None listed";

    const guideContext = (guides ?? []).length
        ? (guides as any[]).map(g => `- ${g.name} [guide:${g.id}] | Regions: ${g.regions?.join(", ")} | Languages: ${g.languages?.join(", ")} | Specialties: ${g.specialties?.join(", ")} | ${g.bio}`).join("\n")
        : "None listed";

    const contextualSystem = `${SYSTEM_PROMPT}

AVAILABLE DESTINATIONS:
${destContext}

AVAILABLE TOURS:
${tourContext}

AVAILABLE ROUTES (multi-day curated itineraries):
${routeContext}

UPCOMING EVENTS & FESTIVALS:
${eventContext}

AVAILABLE LOCAL GUIDES:
${guideContext}

When recommending any of the above, use the appropriate ID tag so it renders as a clickable card.`;

    // ── 4. Call Anthropic ────────────────────────────────────────────────────
    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type":      "application/json",
            "anthropic-version": "2023-06-01",
            "x-api-key":         process.env.ANTHROPIC_API_KEY!,
        },
        body: JSON.stringify({
            model:      "claude-sonnet-4-20250514",
            max_tokens: 4096,
            stream:     true,
            system:     contextualSystem,
            messages:   messages.map((m: any) => ({ role: m.role, content: m.content })),
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        return NextResponse.json({ error: err }, { status: response.status });
    }

    // ── 5. Stream back ───────────────────────────────────────────────────────
    const encoder = new TextEncoder();
    const stream  = new ReadableStream({
        async start(controller) {
            const reader  = response.body!.getReader();
            const decoder = new TextDecoder();
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    for (const line of chunk.split("\n")) {
                        if (!line.startsWith("data: ")) continue;
                        const data = line.slice(6).trim();
                        if (data === "[DONE]") { controller.enqueue(encoder.encode("data: [DONE]\n\n")); break; }
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`));
                            }
                            if (parsed.type === "message_stop") {
                                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                            }
                        } catch {}
                    }
                }
            } finally {
                controller.close();
                reader.releaseLock();
            }
        },
    });

    return new NextResponse(stream, {
        headers: {
            "Content-Type":           "text/event-stream",
            "Cache-Control":          "no-cache",
            "Connection":             "keep-alive",
            "X-RateLimit-Limit":      String(isAuthed ? LIMITS.authed.requests : LIMITS.anonymous.requests),
            "X-RateLimit-Remaining":  String(remaining),
        },
    });
}