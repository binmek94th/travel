import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase-admin";
import { verifyAdminSession } from "@/src/lib/admin-auth";
import { FieldValue } from "firebase-admin/firestore";

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!await verifyAdminSession(req)) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
  const body = await req.json();
  const allowed = ["isResolved"];
  const data: Record<string,any> = { updatedAt: FieldValue.serverTimestamp() };
  for (const f of allowed) if (f in body) data[f] = body[f];
  await adminDb.collection("qa_posts").doc(id).update(data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!await verifyAdminSession(req)) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
  // Delete the post and all its answers
  const batch = adminDb.batch();
  batch.delete(adminDb.collection("qa_posts").doc(id));
  const answers = await adminDb
      .collection("qa_posts").doc(id)
      .collection("answers").get();
  answers.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
  return NextResponse.json({ ok: true });
}
