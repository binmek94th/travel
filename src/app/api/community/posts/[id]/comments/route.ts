import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase-admin";
import {getUser} from "@/src/app/api/community/posts/route";

import { firestore } from "firebase-admin";
const { FieldValue } = firestore;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const snap   = await adminDb
        .collection("community_posts").doc(id)
        .collection("comments")
        .orderBy("createdAt", "asc")
        .limit(100)
        .get();

    const comments = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ comments });
}

// POST — add comment
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id }  = await params;
    const { body } = await req.json();
    if (!body?.trim()) return NextResponse.json({ error: "Comment body required" }, { status: 400 });

    const postRef    = adminDb.collection("community_posts").doc(id);
    const commentRef = postRef.collection("comments").doc();

    const comment = {
        id:            commentRef.id,
        body:          body.trim().slice(0, 1000),
        authorId:      user.uid,
        authorName:    (user as any).displayName ?? (user as any).name ?? "Traveler",
        authorPhotoURL:(user as any).photoURL ?? null,
        likeCount:     0,
        createdAt:     new Date().toISOString(),
    };

    await Promise.all([
        commentRef.set(comment),
        postRef.update({ commentCount: FieldValue.increment(1) }),
    ]);

    return NextResponse.json({ comment }, { status: 201 });
}