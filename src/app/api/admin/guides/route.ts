import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase-admin";
import { verifyAdminSession } from "@/src/lib/admin-auth";
import { FieldValue } from "firebase-admin/firestore";

export const GUIDE_FIELDS = [
    "title",
    "slug",
    "body",
    "coverImage",
    "categories",
    "relatedDestinationIds",
    "seoTitle",
    "seoDescription",
    "status",
    "publishedAt",
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

    for (const f of GUIDE_FIELDS) {
        if (f in body) data[f] = body[f];
    }

    if (data.status === "published") {
        data.publishedAt = FieldValue.serverTimestamp();
    }

    const ref = await adminDb.collection("guides").add(data);

    return NextResponse.json({ id: ref.id }, { status: 201 });
}