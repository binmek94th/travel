import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase-admin";
import { verifyAdminSession } from "@/src/lib/admin-auth";
import { FieldValue } from "firebase-admin/firestore";

/** Factory: returns Next.js route handlers for a given Firestore collection */
export function makeAdminRoutes(collection: string, allowedFields: string[]) {
  async function POST(req: NextRequest) {
    if (!await verifyAdminSession(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const data: Record<string,any> = { createdAt: FieldValue.serverTimestamp() };
    for (const f of allowedFields) if (f in body) data[f] = body[f];
    const ref = await adminDb.collection(collection).add(data);
    return NextResponse.json({ id: ref.id }, { status: 201 });
  }

  async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    if (!await verifyAdminSession(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const data: Record<string,any> = { updatedAt: FieldValue.serverTimestamp() };
    for (const f of allowedFields) if (f in body) data[f] = body[f];
    await adminDb.collection(collection).doc(params.id).update(data);
    return NextResponse.json({ ok: true });
  }

  async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    if (!await verifyAdminSession(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await adminDb.collection(collection).doc(params.id).delete();
    return NextResponse.json({ ok: true });
  }

  return { POST, PATCH, DELETE };
}
