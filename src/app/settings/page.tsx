// src/app/settings/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth, adminDb } from "@/src/lib/firebase-admin";
import SettingsClient from "./SettingsClient";

async function getUser() {
    try {
        const jar = await cookies();
        const val = jar.get("session")?.value;
        if (!val) return null;
        const decoded = await adminAuth.verifySessionCookie(val, true);
        const [authUser, doc] = await Promise.all([
            adminAuth.getUser(decoded.uid),
            adminDb.collection("users").doc(decoded.uid).get(),
        ]);
        return {
            uid:        decoded.uid,
            email:      authUser.email ?? "",
            providers:  authUser.providerData.map(p => p.providerId),
            ...doc.data(),
        };
    } catch { return null; }
}

export const metadata = { title: "Settings — Tizitaw Ethiopia" };

export default async function SettingsPage() {
    const user = await getUser();
    if (!user) redirect("/auth/login?returnUrl=/settings");
    const serialize = (obj: any) => JSON.parse(JSON.stringify(obj));
    return <SettingsClient user={serialize(user)}/>;
}