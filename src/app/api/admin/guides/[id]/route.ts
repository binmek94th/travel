import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase-admin";
import { verifyAdminSession } from "@/src/lib/admin-auth";
import { FieldValue } from "firebase-admin/firestore";
import {GUIDE_FIELDS} from "@/src/app/api/admin/guides/route";


export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!(await verifyAdminSession(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const data: Record<string, any> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  for (const f of GUIDE_FIELDS) {
    if (f in body) data[f] = body[f];
  }

  if (body.status === "published" && !body.publishedAt) {
    data.publishedAt = FieldValue.serverTimestamp();
  }

  await adminDb.collection("guides").doc(id).update(data);

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

  await adminDb.collection("guides").doc(id).delete();

  return NextResponse.json({ ok: true });
}

