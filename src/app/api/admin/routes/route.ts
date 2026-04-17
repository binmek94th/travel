import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase-admin";
import { verifyAdminSession } from "@/src/lib/admin-auth";
import { FieldValue } from "firebase-admin/firestore";

export const ROUTE_FIELDS = [
    "name",
    "description",
    "stops",
    "totalDays",
    "mapPolyline",
    "recommendedTourIds",
    "coverImage",
    "status",
];

export async function POST(req: NextRequest) {
    if (!(await verifyAdminSession(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const data: Record<string, any> = {
        status: "draft",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };

    for (const f of ROUTE_FIELDS) {
        if (f in body) data[f] = body[f];
    }

    const ref = await adminDb.collection("routes").add(data);

    return NextResponse.json({ id: ref.id }, { status: 201 });
}