// src/app/api/community/posts/[id]/like/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/src/lib/firebase-admin";
import { firestore } from "firebase-admin";

const { FieldValue } = firestore;

async function getUid(req: NextRequest): Promise<string | null> {
    try {
        const cookie = req.cookies.get("session")?.value;
        if (!cookie) return null;
        const decoded = await adminAuth.verifySessionCookie(cookie, true);
        return decoded.uid;
    } catch { return null; }
}


export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const uid = await getUid(req);
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const likeRef = adminDb.collection("users").doc(uid).collection("likedPosts").doc(id);
    const exists  = (await likeRef.get()).exists;
    if (exists) return NextResponse.json({ ok: true }); // already liked

    await Promise.all([
        likeRef.set({ likedAt: new Date().toISOString() }),
        adminDb.collection("community_posts").doc(id).update({ likeCount: FieldValue.increment(1) }),
    ]);
    return NextResponse.json({ ok: true });
}

// DELETE — unlike
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const uid = await getUid(req);
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await Promise.all([
        adminDb.collection("users").doc(uid).collection("likedPosts").doc(id).delete(),
        adminDb.collection("community_posts").doc(id).update({ likeCount: FieldValue.increment(-1) }),
    ]);
    return NextResponse.json({ ok: true });
}