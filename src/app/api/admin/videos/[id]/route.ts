import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase-admin";
import { verifyAdminSession } from "@/src/lib/admin-auth";
import { FieldValue } from "firebase-admin/firestore";

// ================= PATCH =================
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!(await verifyAdminSession(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status } = await req.json();

  if (!["active", "removed"].includes(status)) {
    return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
    );
  }

  await adminDb.collection("videos").doc(id).update({
    status,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}

// ================= DELETE =================
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!(await verifyAdminSession(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await adminDb.collection("videos").doc(id).delete();

  return NextResponse.json({ ok: true });
}