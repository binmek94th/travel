// ────────────────────────────────────────────────────────────
// app/api/admin/destinations/[id]/route.ts
// ────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase-admin";
import { verifyAdminSession } from "@/src/lib/admin-auth";
import { FieldValue } from "firebase-admin/firestore";

const DEST_FIELDS = [
  "name","slug","region","categories","description","coverImage","images",
  "latitude", "longitude","bestTimeToVisit","travelTips","isHiddenGem","status",
];

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const body = await req.json();

  if (!id) {
    return NextResponse.json(
        { error: "Missing destination id" },
        { status: 400 }
    );
  }

  const data: Record<string, any> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  for (const f of DEST_FIELDS) {
    if (f in body) data[f] = body[f];
  }

  await adminDb.collection("destinations").doc(id).update(data);

  return NextResponse.json({ ok: true });
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!(await verifyAdminSession(req))) {
    return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
    );
  }
  await adminDb.collection("destinations").doc(id).delete();

  return NextResponse.json({ ok: true });
}