import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/src/lib/firebase-admin";
import { cookies } from "next/headers";

const FIVE_DAYS_MS = 60 * 60 * 24 * 5 * 1000;

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) return NextResponse.json({ error: "Missing idToken" }, { status: 400 });

    // Verify the token first so you can inspect claims
    const decoded = await adminAuth.verifyIdToken(idToken);
    const role    = decoded.role ?? "traveler"; // fallback to traveler

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: FIVE_DAYS_MS,
    });

    const cookieStore = await cookies();
    cookieStore.set("__session", sessionCookie, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   FIVE_DAYS_MS / 1000,
      path:     "/",
    });

    // Optionally set a separate readable role cookie for middleware
    cookieStore.set("role", role, {
      httpOnly: false,       // readable client-side if needed
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   FIVE_DAYS_MS / 1000,
      path:     "/",
    });

    return NextResponse.json({ status: "ok", role });
  } catch (err) {
    console.error("Session error:", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("__session");
  cookieStore.delete("role");
  return NextResponse.json({ status: "ok" });
}