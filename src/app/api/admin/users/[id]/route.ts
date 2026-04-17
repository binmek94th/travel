import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/src/lib/firebase-admin";
import { verifyAdminSession } from "@/src/lib/admin-auth";

// app/api/admin/users/[id]/route.ts
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!(await verifyAdminSession(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const allowed = [
    "role", "emailVerified", "displayName",
    "nationality", "preferredLanguage",
  ];

  const update: Record<string, any> = {};
  for (const k of allowed) {
    if (k in body) update[k] = body[k];
  }

  await adminDb.collection("users").doc(id).update(update);

  if (body.role) {
    await adminAuth.setCustomUserClaims(id, { role: body.role });
  }

  if (typeof body.isVerified === "boolean") {
    await adminAuth.updateUser(id, { emailVerified: body.isVerified });
  }

  return NextResponse.json({ ok: true });
}