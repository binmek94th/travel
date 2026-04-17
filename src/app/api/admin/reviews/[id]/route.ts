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

  const body = await req.json();

  const allowed = ["status", "isFlagged"];

  const data: Record<string, any> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  for (const f of allowed) {
    if (f in body) data[f] = body[f];
  }

  await adminDb.collection("reviews").doc(id).update(data);

  // ================= business logic =================
  if (body.status === "published") {
    const reviewSnap = await adminDb.collection("reviews").doc(id).get();
    const review = reviewSnap.data();

    const { targetId, targetType, rating } = review ?? {};

    if (targetId && targetType && rating) {
      const col = targetType === "destination" ? "destinations" : "tours";

      const parentRef = adminDb.collection(col).doc(targetId);

      await parentRef.update({
        reviewCount: FieldValue.increment(1),
      });
    }
  }

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

  await adminDb.collection("reviews").doc(id).delete();

  return NextResponse.json({ ok: true });
}