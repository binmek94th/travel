// scripts/set-admin.ts
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App;

if (!getApps().length) {
    adminApp = initializeApp({
        credential: cert({
            projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey:  process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
    });
} else {
    adminApp = getApps()[0];
}

export const adminAuth = getAuth(adminApp);
export const adminDb   = getFirestore(adminApp);
export default adminApp;


async function main() {
    const uid = "zMPdEKEIpAcWm833wkTasv7NOGu2";

    const snap = await adminDb.collection("users").doc(uid).get();
    const role = snap.data()?.role ?? "traveler";

    await adminAuth.setCustomUserClaims(uid, { role });

    const user = await adminAuth.getUser(uid);
    console.log("Done:", user.customClaims);
}

main().catch(console.error);