

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/src/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import crypto from "crypto";

// Lazy-import the email trigger so the route still works even if Resend
// isn't configured yet (just logs a warning instead of crashing)
async function maybeSendWelcome(opts: {
    userId:       string;
    to:           string;
    travelerName: string;
    nationality?: string;
}) {
    try {
        const { triggerWelcomeEmail } = await import("@/src/lib/email/triggers");
        await triggerWelcomeEmail(opts);
    } catch (err: any) {
        // Email is non-critical — log but don't fail registration
        console.warn("[register] welcome email skipped:", err.message);
    }
}

export async function POST(req: NextRequest) {
    // ── 1. Verify session cookie to get the user ───────────────────────────────
    const cookieStore = await cookies();
    const session     = cookieStore.get("session")?.value;

    if (!session) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let decoded: Awaited<ReturnType<typeof adminAuth.verifySessionCookie>>;
    try {
        decoded = await adminAuth.verifySessionCookie(session, true);
    } catch {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { uid, email, name: tokenName } = decoded;

    // ── 2. Parse body ──────────────────────────────────────────────────────────
    const { name, nationality } = await req.json().catch(() => ({}));
    const displayName = name || tokenName || email?.split("@")[0] || "Traveler";

    // ── 3. Check if user doc already exists (Google sign-in may have created it)
    const userRef  = adminDb.collection("users").doc(uid);
    const existing = await userRef.get();

    if (existing.exists) {
        // Already registered — just fill any missing fields
        const updates: Record<string, unknown> = {};
        if (!existing.data()?.unsubToken)      updates.unsubToken      = crypto.randomUUID();
        if (existing.data()?.emailMarketing === undefined) updates.emailMarketing = true;
        if (nationality && !existing.data()?.nationality) updates.nationality    = nationality;
        if (Object.keys(updates).length > 0)   await userRef.update(updates);

        return NextResponse.json({ ok: true, existing: true });
    }

    // ── 4. Create user document in Firestore ───────────────────────────────────
    const unsubToken = crypto.randomUUID();

    await userRef.set({
        uid,
        displayName,
        email:          email ?? null,
        nationality:    nationality ?? null,
        emailMarketing: true,        // opted-in by default — users can opt out via /unsubscribe
        unsubToken,                  // used for one-click unsubscribe links in emails
        role:           "traveler",
        createdAt:      FieldValue.serverTimestamp(),
        updatedAt:      FieldValue.serverTimestamp(),
    });

    // ── 5. Send welcome email (non-blocking) ───────────────────────────────────
    if (email) {
        // Fire and forget — don't await so registration response is instant
        maybeSendWelcome({ userId: uid, to: email, travelerName: displayName, nationality });
    }

    return NextResponse.json({ ok: true });
}