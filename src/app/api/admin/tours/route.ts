import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase-admin";
import { verifyAdminSession } from "@/src/lib/admin-auth";
import { FieldValue } from "firebase-admin/firestore";

export const TOUR_FIELDS = [
    "title","slug","operatorId","destinationIds","categories","itinerary",
    "durationDays","priceUSD","priceETB","groupSizeMax","includes","images",
    "isFeatured","status","description",
];

export async function POST(req: NextRequest) {
    if (!await verifyAdminSession(req)) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
    const body = await req.json();
    const data: Record<string,any> = {
        status: "draft",
        bookingCount: 0,
        avgRating: 0,
        reviewCount: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };
    for (const f of TOUR_FIELDS) if (f in body) data[f] = body[f];
    const ref = await adminDb.collection("tours").add(data);
    return NextResponse.json({ id: ref.id }, { status: 201 });
}
