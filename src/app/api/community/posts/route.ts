// src/app/api/community/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/src/lib/firebase-admin";

export async function getUser(req: NextRequest) {
    try {
        const cookie  = req.cookies.get("session")?.value;
        if (!cookie) return null;
        const decoded = await adminAuth.verifySessionCookie(cookie, true);
        const doc     = await adminDb.collection("users").doc(decoded.uid).get();
        return { uid: decoded.uid, ...doc.data() };
    } catch { return null; }
}

// GET — list posts
export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const type   = searchParams.get("type");
    const region = searchParams.get("region");
    const limit  = parseInt(searchParams.get("limit") ?? "40");

    let query: any = adminDb.collection("community_posts")
        .orderBy("isPinned", "desc")
        .orderBy("createdAt", "desc")
        .limit(limit);

    if (type)   query = query.where("type",   "==", type);
    if (region) query = query.where("region", "==", region);

    const snap  = await query.get();
    const posts = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ posts });
}

// POST — create post
export async function POST(req: NextRequest) {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { type, title, body, region, tags } = await req.json();

    if (!type || !title?.trim() || !body?.trim()) {
        return NextResponse.json({ error: "type, title and body are required" }, { status: 400 });
    }

    const validTypes = ["question", "story", "tip", "route", "discussion"];
    if (!validTypes.includes(type)) {
        return NextResponse.json({ error: "Invalid post type" }, { status: 400 });
    }

    const ref  = adminDb.collection("community_posts").doc();
    const post = {
        id:            ref.id,
        type,
        title:         title.trim().slice(0, 120),
        body:          body.trim().slice(0, 2000),
        region:        region ?? null,
        tags:          Array.isArray(tags) ? tags.slice(0, 8) : [],
        authorId:      user.uid,
        authorName:    (user as any).displayName ?? (user as any).name ?? "Traveler",
        authorPhotoURL:(user as any).photoURL ?? null,
        isPinned:      false,
        likeCount:     0,
        commentCount:  0,
        createdAt:     new Date().toISOString(),
        updatedAt:     new Date().toISOString(),
    };

    await ref.set(post);
    return NextResponse.json({ post }, { status: 201 });
}