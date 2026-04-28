// src/app/profile/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth, adminDb } from "@/src/lib/firebase-admin";
import ProfileClient from "./ProfileClient";

async function getUser() {
    try {
        const jar = await cookies();
        const val = jar.get("session")?.value;
        if (!val) return null;
        const decoded = await adminAuth.verifySessionCookie(val, true);
        const doc     = await adminDb.collection("users").doc(decoded.uid).get();
        return { uid: decoded.uid, ...doc.data() };
    } catch { return null; }
}

export const metadata = { title: "Profile — Tizitaw Ethiopia" };

export default async function ProfilePage() {
    const user = await getUser();
    if (!user) redirect("/auth/login?returnUrl=/profile");

    const serialize = (obj: any) => JSON.parse(JSON.stringify(obj));

    return <ProfileClient user={serialize(user)} />;
}