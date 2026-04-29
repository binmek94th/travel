// src/app/api/admin/email/campaign/route.ts

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase-admin";
import { verifyAdminSession } from "@/src/lib/admin-auth";
import { sendCampaignBatch } from "@/src/lib/email/resend";
import { FieldValue } from "firebase-admin/firestore";
import { Resend } from "resend";
import crypto from "crypto";

const resend   = new Resend(process.env.RESEND_API_KEY!);
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://tizitaw.com";

type Recipient = { to: string; recipientName: string; unsubToken: string };

async function fetchRecipients(audience: string): Promise<Recipient[]> {
    const recipients: Recipient[] = [];

    if (audience === "confirmed" || audience === "pending") {
        const status   = audience === "confirmed" ? "confirmed" : "pending_payment";
        const bookSnap = await adminDb.collection("bookings").where("status", "==", status).select("userId","travelerId").get();
        const ids      = [...new Set(bookSnap.docs.map(d => d.data().userId ?? d.data().travelerId).filter(Boolean) as string[])];
        if (ids.length === 0) return [];

        for (let i = 0; i < ids.length; i += 30) {
            const snap = await adminDb.collection("users").where("__name__", "in", ids.slice(i, i + 30)).select("email","displayName","unsubToken","emailMarketing").get();
            snap.docs.forEach(d => {
                const u = d.data();
                if (u.email && u.emailMarketing !== false) {
                    recipients.push({ to: u.email, recipientName: u.displayName ?? u.email, unsubToken: u.unsubToken ?? crypto.randomUUID() });
                }
            });
        }
        return recipients;
    }

    // All opted-in users
    const snap = await adminDb.collection("users").where("emailMarketing", "!=", false).select("email","displayName","unsubToken").get();
    snap.docs.forEach(d => {
        const u = d.data();
        if (u.email) recipients.push({ to: u.email, recipientName: u.displayName ?? u.email, unsubToken: u.unsubToken ?? crypto.randomUUID() });
    });
    return recipients;
}

export async function POST(req: NextRequest) {
    if (!await verifyAdminSession(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subject, audience, html, isCustomHtml, headline, body: emailBody, ctaText, ctaUrl, imageUrl } = body;

    if (!subject) return NextResponse.json({ error: "Subject is required" }, { status: 400 });

    const recipients = await fetchRecipients(audience ?? "all");
    if (recipients.length === 0) return NextResponse.json({ sent: 0, failed: 0, errors: [] });

    let sent = 0, failed = 0;
    const errors: string[] = [];

    if (isCustomHtml && html) {
        // ── Custom block-editor HTML — personalise and send to each recipient ──────
        const results = await Promise.allSettled(
            recipients.map(async r => {
                // Inject the real unsubscribe token into the HTML
                const personalised = html
                    .replace(/\{\{UNSUB_TOKEN\}\}/g, r.unsubToken)
                    .replace(/Hi \{\{NAME\}\}/g, `Hi ${r.recipientName.split(" ")[0]}`);

                const { data, error } = await resend.emails.send({
                    from:    "Tizitaw Ethiopia <hello@tizitaw.com>",
                    to:      r.to,
                    subject,
                    html:    personalised,
                    headers: {
                        "List-Unsubscribe":      `<${BASE_URL}/unsubscribe?token=${r.unsubToken}>`,
                        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
                    },
                });

                if (error) throw new Error(error.message);
                return data?.id;
            })
        );

        results.forEach((r, i) => {
            if (r.status === "fulfilled") sent++;
            else { failed++; errors.push(`${recipients[i].to}: ${r.reason?.message}`); }
        });

    } else {
        // ── Legacy form-based campaign ──────────────────────────────────────────────
        if (!headline || !emailBody || !ctaText || !ctaUrl) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
        const result = await sendCampaignBatch(recipients, { subject, headline, body: emailBody, ctaText, ctaUrl, imageUrl });
        sent   = result.sent;
        failed = result.failed;
        errors.push(...result.errors);
    }

    // Log to Firestore
    await adminDb.collection("emailCampaigns").add({
        subject, audience: audience ?? "all",
        recipients: recipients.length, sent, failed,
        sentAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ sent, failed, errors });
}