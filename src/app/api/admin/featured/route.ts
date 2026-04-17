import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase-admin";
import { verifyAdminSession } from "@/src/lib/admin-auth";
import { FieldValue } from "firebase-admin/firestore";

export const FEATURED_FIELDS = [
    "name",
    "type",
    "targetId",
    "operatorId",
    "plan",
    "startDate",
    "endDate",
    "amountPaid",
];

export async function POST(req: NextRequest) {
    if (!(await verifyAdminSession(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const data: Record<string, any> = {
        impressions: 0,
        clicks: 0,
        createdAt: FieldValue.serverTimestamp(),
    };

    for (const f of FEATURED_FIELDS) {
        if (f in body) data[f] = body[f];
    }

    const ref = await adminDb.collection("featured").add(data);

    return NextResponse.json({ id: ref.id }, { status: 201 });
}