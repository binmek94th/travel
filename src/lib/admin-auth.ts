import { NextRequest } from "next/server";
import { adminAuth } from "@/src/lib/firebase-admin";

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
