import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase-admin";
import { verifyAdminSession } from "@/src/lib/admin-auth";
import { FieldValue } from "firebase-admin/firestore";

export const EVENT_FIELDS = [
    "name",
    "type",
    "destinationId",
    "startDate",
    "endDate",
    "isBookable",
    "linkedTourId",
    "description",
    "images",
];


export async function POST(req: NextRequest) {
    if (!(await verifyAdminSession(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const data: Record<string, any> = {
        isBookable: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };

    for (const f of EVENT_FIELDS) {
        if (f in body) data[f] = body[f];
    }

    const ref = await adminDb.collection("events").add(data);

    return NextResponse.json({ id: ref.id }, { status: 201 });
}