import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase-admin";
import { verifyAdminSession } from "@/src/lib/admin-auth";
import { FieldValue } from "firebase-admin/firestore";

export const OP_FIELDS = [
    "businessName",
    "email",
    "licenseNumber",
    "bio",
    "logo",
    "isVerified",
    "stripeAccountId",
    "chapaAccountId",
    "featuredUntil",
];

export async function POST(req: NextRequest) {
    if (!(await verifyAdminSession(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const data: Record<string, any> = {
        isVerified: false,
        tourCount: 0,
        avgRating: 0,
        revenueTotal: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };

    for (const f of OP_FIELDS) {
        if (f in body) data[f] = body[f];
    }

    const ref = await adminDb.collection("operators").add(data);

    return NextResponse.json({ id: ref.id }, { status: 201 });
}