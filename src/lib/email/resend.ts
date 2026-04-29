// src/lib/email/resend.ts

import { Resend } from "resend";
import {
    bookingConfirmationTemplate,
    welcomeTemplate,
    bookingCancelledTemplate,
    bookingReminderTemplate,
    marketingCampaignTemplate,
} from "./templates";

const resend = new Resend(process.env.RESEND_API_KEY!);

const FROM      = "Tizitaw Ethiopia <bookings@tizitaw.com>";
const FROM_MKTG = "Tizitaw Ethiopia <hello@tizitaw.com>";
const BASE_URL  = process.env.NEXT_PUBLIC_BASE_URL ?? "https://tizitaw.com";

export type SendResult = { success: boolean; id?: string; error?: string };

// ─── Helper — wraps every resend.emails.send call ────────────────────────────
// Resend SDK v2+ returns { data: { id } | null, error: ErrorResponse | null }
// The old { id, error } destructure no longer works.

async function send(payload: Parameters<typeof resend.emails.send>[0]): Promise<SendResult> {
    const { data, error } = await resend.emails.send(payload);
    if (error) return { success: false, error: error.message };
    return { success: true, id: data?.id };
}

// ─── Transactional emails ─────────────────────────────────────────────────────

export async function sendBookingConfirmation(opts: {
    to:               string;
    travelerName:     string;
    tourTitle:        string;
    startDate:        string;
    endDate:          string;
    travelers:        number;
    totalAmountUSD:   number;
    depositAmountUSD: number;
    bookingId:        string;
    tourImageUrl?:    string;
    adminNote?:       string;
}): Promise<SendResult> {
    return send({
        from:    FROM,
        to:      opts.to,
        subject: `Your booking for ${opts.tourTitle} is confirmed ✦`,
        html:    bookingConfirmationTemplate({ ...opts, baseUrl: BASE_URL }),
    });
}

export async function sendWelcomeEmail(opts: {
    to:           string;
    travelerName: string;
    nationality?: string;
}): Promise<SendResult> {
    return send({
        from:    FROM_MKTG,
        to:      opts.to,
        subject: `Welcome to Tizitaw Ethiopia, ${opts.travelerName.split(" ")[0]} ✦`,
        html:    welcomeTemplate({ ...opts, baseUrl: BASE_URL }),
    });
}

export async function sendBookingCancellation(opts: {
    to:           string;
    travelerName: string;
    tourTitle:    string;
    startDate:    string;
    bookingId:    string;
}): Promise<SendResult> {
    return send({
        from:    FROM,
        to:      opts.to,
        subject: `Your booking for ${opts.tourTitle} has been cancelled`,
        html:    bookingCancelledTemplate({ ...opts, baseUrl: BASE_URL }),
    });
}

export async function sendBookingReminder(opts: {
    to:            string;
    travelerName:  string;
    tourTitle:     string;
    startDate:     string;
    daysUntil:     number;
    bookingId:     string;
    tourImageUrl?: string;
}): Promise<SendResult> {
    return send({
        from:    FROM,
        to:      opts.to,
        subject: `${opts.daysUntil} days until your Ethiopia adventure — ${opts.tourTitle}`,
        html:    bookingReminderTemplate({ ...opts, baseUrl: BASE_URL }),
    });
}

export async function sendMarketingCampaign(opts: {
    to:            string;
    recipientName: string;
    subject:       string;
    headline:      string;
    body:          string;
    ctaText:       string;
    ctaUrl:        string;
    imageUrl?:     string;
    unsubToken:    string;
}): Promise<SendResult> {
    return send({
        from:    FROM_MKTG,
        to:      opts.to,
        subject: opts.subject,
        html:    marketingCampaignTemplate({ ...opts, baseUrl: BASE_URL }),
        headers: {
            "List-Unsubscribe":      `<${BASE_URL}/unsubscribe?token=${opts.unsubToken}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
    });
}

// ─── Batch send ───────────────────────────────────────────────────────────────

export async function sendCampaignBatch(
    recipients: Array<{ to: string; recipientName: string; unsubToken: string }>,
    campaign: { subject: string; headline: string; body: string; ctaText: string; ctaUrl: string; imageUrl?: string }
): Promise<{ sent: number; failed: number; errors: string[] }> {
    const results = await Promise.allSettled(
        recipients.map(r => sendMarketingCampaign({ ...campaign, ...r }))
    );

    let sent = 0, failed = 0;
    const errors: string[] = [];

    results.forEach((r, i) => {
        if (r.status === "fulfilled" && r.value.success) {
            sent++;
        } else {
            failed++;
            const msg = r.status === "rejected" ? r.reason?.message : (r.value as SendResult).error;
            errors.push(`${recipients[i].to}: ${msg}`);
        }
    });

    return { sent, failed, errors };
}