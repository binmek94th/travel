import { NextRequest } from "next/server";
import { adminAuth } from "@/src/lib/firebase-admin";
import {cookies} from "next/headers";

export async function verifyAdminSession(req: NextRequest) {
  const cookie = req.cookies.get("__session")?.value;
  if (!cookie) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(cookie, true);
    if (decoded.role !== "admin") return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function getSessionUid(): Promise<string | null> {
  try {
    const jar   = await cookies();           // ← await required in Next 15
    const value = jar.get("session")?.value;
    if (!value) return null;
    const decoded = await adminAuth.verifySessionCookie(value, true);
    return decoded.uid;
  } catch {
    return null;
  }
}
