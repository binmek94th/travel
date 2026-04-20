// src/app/api/auth/session/route.ts
// Make sure the cookie is set with the right flags so it's readable server-side

import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/src/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) return NextResponse.json({ error: "idToken required" }, { status: 400 });

    // 5-day session cookie
    const expiresIn   = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const res = NextResponse.json({ ok: true });

    res.cookies.set("session", sessionCookie, {
      maxAge:   expiresIn / 1000,
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",       // ← "lax" (not "strict") so cookie is sent on navigation
      path:     "/",
    });

    return res;
  } catch (err: any) {
    console.error("[session/POST]", err);
    return NextResponse.json({ error: "Failed to create session" }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", "", { maxAge: 0, path: "/" });
  return res;
}