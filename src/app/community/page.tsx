// src/app/community/page.tsx
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/src/lib/firebase-admin";
import CommunityClient from "./CommunityClient";

async function getUid(): Promise<string | null> {
    try {
        const jar = await cookies();
        const val = jar.get("session")?.value;
        if (!val) return null;
        const decoded = await adminAuth.verifySessionCookie(val, true);
        return decoded.uid;
    } catch { return null; }
}

export default async function CommunityPage() {
    const uid = await getUid();

    // Fetch recent posts (latest 40)
    const snap = await adminDb
        .collection("community_posts")
        .orderBy("isPinned", "desc")
        .orderBy("createdAt", "desc")
        .limit(40)
        .get();

    const posts = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    // Fetch user's liked post IDs
    let likedIds: string[] = [];
    if (uid) {
        const likeSnap = await adminDb
            .collection("users").doc(uid)
            .collection("likedPosts")
            .get();
        likedIds = likeSnap.docs.map((d: any) => d.id);
    }

    // Fetch user profile
    let userProfile: any = null;
    if (uid) {
        const userDoc = await adminDb.collection("users").doc(uid).get();
        if (userDoc.exists) userProfile = { uid, ...userDoc.data() };
    }

    const serialize = (obj: any) => JSON.parse(JSON.stringify(obj));

    return (
        <CommunityClient
            initialPosts={serialize(posts)}
            likedIds={likedIds}
            currentUser={serialize(userProfile)}
        />
    );
}