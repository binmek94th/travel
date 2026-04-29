// src/app/api/unsubscribe/route.ts
// Handles one-click unsubscribe from marketing emails (GET + POST per RFC 8058)

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase-admin";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://tizitaw.com";

async function handleUnsubscribe(token: string | null) {
    if (!token) {
        return new Response("Invalid unsubscribe link.", { status: 400 });
    }

    const snap = await adminDb
        .collection("users")
        .where("unsubToken", "==", token)
        .limit(1)
        .get();

    if (snap.empty) {
        return new Response("Link not found or already used.", { status: 404 });
    }

    await snap.docs[0].ref.update({ emailMarketing: false });

    // Return a branded HTML confirmation page
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Unsubscribed — Tizitaw Ethiopia</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Georgia, serif; background: #F0F9FF; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
    .card { background: #fff; border-radius: 20px; border: 1px solid rgba(14,133,178,0.12); max-width: 420px; width: 100%; padding: 48px 40px; text-align: center; box-shadow: 0 8px 32px rgba(14,133,178,0.08); }
    .mark { font-size: 40px; margin-bottom: 20px; display: block; }
    h1 { font-size: 22px; font-weight: 700; color: #0A3D52; letter-spacing: -0.02em; margin-bottom: 12px; }
    p { font-size: 14px; color: #1A6A8A; line-height: 1.7; font-weight: 300; margin-bottom: 8px; }
    a.btn { display: inline-block; margin-top: 28px; background: linear-gradient(135deg,#28B8E8,#0A6A94); color: #fff; font-family: Georgia, serif; font-size: 14px; font-weight: 700; padding: 12px 28px; border-radius: 12px; text-decoration: none; }
    .note { margin-top: 16px; font-size: 12px; color: #94A3B8; }
  </style>
</head>
<body>
  <div class="card">
    <span class="mark">✦</span>
    <h1>You've been unsubscribed</h1>
    <p>You'll no longer receive marketing emails from Tizitaw Ethiopia.</p>
    <p>You'll still receive important transactional emails about your bookings and account.</p>
    <a class="btn" href="${BASE_URL}">Back to Tizitaw</a>
    <p class="note">Changed your mind? Update your preferences in account settings.</p>
  </div>
</body>
</html>`;

    return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
    });
}

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get("token");
    return handleUnsubscribe(token);
}

// One-click unsubscribe POST (RFC 8058 — email clients send this automatically)
export async function POST(req: NextRequest) {
    const token = req.nextUrl.searchParams.get("token");
    return handleUnsubscribe(token);
}