import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase-admin";
import { verifyAdminSession } from "@/src/lib/admin-auth";
import { FieldValue } from "firebase-admin/firestore";

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending:   ["paid", "cancelled"],
  paid:      ["confirmed", "refunded"],
  confirmed: ["active", "cancelled"],
  active:    ["completed", "cancelled"],
  completed: [],
  cancelled: ["refunded"],
  refunded:  [],
};

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!await verifyAdminSession(req)) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
  const { status } = await req.json();
  if (!status) return NextResponse.json({ error:"status required" }, { status:400 });

  // Verify the transition is valid
  const docSnap = await adminDb.collection("bookings").doc(id).get();
  if (!docSnap.exists) return NextResponse.json({ error:"Not found" }, { status:404 });
  const current = docSnap.data()?.status ?? "pending";
  const allowed = VALID_TRANSITIONS[current] ?? [];
  if (!allowed.includes(status)) {
    return NextResponse.json(
      { error: `Cannot transition from '${current}' to '${status}'` },
      { status: 422 }
    );
  }

  await adminDb.collection("bookings").doc(id).update({
    status,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return NextResponse.json({ ok: true });
}
