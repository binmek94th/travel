// src/app/api/ai-planner/route.ts
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // allow up to 60s for streaming

const SYSTEM_PROMPT = `You are an expert Ethiopia travel planner for Tizitaw Ethiopia — a curated travel platform.

Your role is to create deeply personalised, practical, and inspiring itineraries for Ethiopia.

PLATFORM CONTEXT:
You have access to a list of real destinations and tours available on the platform. When you recommend a destination or tour, include its ID tag so the user can see a clickable card:
- For destinations: [dest:DESTINATION_ID]
- For tours: [tour:TOUR_ID]

Only include these tags for items actually in the provided lists. Place the tag immediately after mentioning the name.

WHAT TO INCLUDE IN AN ITINERARY:
1. Day-by-day plan — specific destinations, activities, travel time between stops, suggested accommodation tier
2. Suggested platform tours — match to the user's style and budget
3. Budget breakdown — accommodation, food, transport, tours, miscellaneous (per person, in USD)
4. Best time to visit — seasonal advice for the specific regions
5. Packing tips — tailored to travel style (adventure vs culture vs photography etc.)

FORMATTING:
- Use clear headings (##) and bullet points
- Day headers like: ## Day 1–2: Addis Ababa
- Keep tone warm, knowledgeable, and inspiring
- Include practical logistics (internal flights vs road, journey times)
- Flag must-book-in-advance items

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

export async function POST(req: NextRequest) {
    const { messages, destinations, tours } = await req.json();

    if (!messages?.length) {
        return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    // Build context string of available platform content
    const destContext = destinations
        .map((d: any) => `- ${d.name} [dest:${d.id}] | Region: ${d.region} | Categories: ${d.categories?.join(", ")} | ${d.description}`)
        .join("\n");

    const tourContext = tours
        .map((t: any) => `- ${t.title} [tour:${t.id}] | ${t.durationDays}d | $${t.priceUSD} | Region: ${t.region} | Categories: ${t.categories?.join(", ")} | ${t.description}`)
        .join("\n");

    const contextualSystem = `${SYSTEM_PROMPT}

AVAILABLE DESTINATIONS ON THE PLATFORM:
${destContext}

AVAILABLE TOURS ON THE PLATFORM:
${tourContext}

When recommending any of these, use the [dest:ID] or [tour:ID] tag format so they render as cards.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method:  "POST",
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

    // Stream the response back to the client as SSE
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
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
                        if (data === "[DONE]") {
                            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                            break;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            // Anthropic streaming: content_block_delta events contain the text
                            if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
                                const text = parsed.delta.text;
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
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
            "Content-Type":  "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection":    "keep-alive",
        },
    });
}