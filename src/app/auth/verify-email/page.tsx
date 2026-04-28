"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { applyActionCode, sendEmailVerification, reload } from "firebase/auth";
import {auth, db} from "@/src/lib/firebase";
import {toast} from "sonner";
import {doc, updateDoc} from "@firebase/firestore";

type Status = "pending" | "loading" | "verified" | "error";

export default function VerifyEmailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [status, setStatus] = useState<Status>("pending");
    const [resending, setResending] = useState(false);

    const user = auth.currentUser;

    // ── Handle oobCode callback from email link ──────────────────────────────
    useEffect(() => {
        const oobCode = searchParams.get("oobCode");
        if (!oobCode) return;

        const verifyEmail = async () => {
            setStatus("loading");
            try {
                await applyActionCode(auth, oobCode);
                await auth.currentUser?.reload();
                setStatus("verified");
                setTimeout(() => router.push("/"), 1500);
            } catch (error) {
                console.error("Verification failed:", error);
                setStatus("error");
            }
        };

        verifyEmail();
    }, [searchParams, router]);

    // ── Poll for verification every 5s (while waiting) ───────────────────────
    useEffect(() => {
        if (status !== "pending") return;

        const interval = setInterval(async () => {
            if (!user) return;
            await reload(user);
            if (user.emailVerified) {
                setStatus("verified");
                clearInterval(interval);
                setTimeout(() => router.push("/"), 1500);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [status, user, router]);

    const checkVerification = async () => {
        if (!user) return;

        setStatus("loading");

        await reload(user);

        if (user.emailVerified) {
            // 1. Update local UI state
            setStatus("verified");

            await updateDoc(doc(db, "users", user.uid), {
                emailVerified: true,
                emailVerifiedAt: new Date(),
            });

            setTimeout(() => router.push("/"), 1500);
        } else {
            setStatus("pending");
        }
    };

    const resendEmail = async () => {
        if (!user) {
            console.log("No user")
            return;
        };
        setResending(true);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
            await sendEmailVerification(user, {
                url: `${baseUrl}/auth/verify-email`,
                handleCodeInApp: true,
            });
            toast.success("Email resent. Check your email")
            console.log("Verification verification successfully");
        }
        catch(e: any) {
            console.error(e);
        } finally{
            setResending(false);
        }
    };

    // ── UI ────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-6">

                {(status === "pending" || status === "loading") && !searchParams.get("oobCode") && (
                    <>
                        <h2 className="text-2xl font-semibold">Verify your email</h2>
                        <p className="text-gray-500 text-sm">
                            We've sent a verification link to your email. Please check your
                            inbox and click the link.
                        </p>
                        <button
                            onClick={checkVerification}
                            disabled={status === "loading"}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg transition"
                        >
                            {status === "loading" ? "Checking..." : "I've verified my email"}
                        </button>
                        <button
                            onClick={resendEmail}
                            disabled={resending}
                            className="text-sm text-blue-500 hover:underline"
                        >
                            {resending ? "Sending..." : "Resend email"}
                        </button>
                    </>
                )}

                {status === "loading" && searchParams.get("oobCode") && (
                    <>
                        <h2 className="text-2xl font-semibold">Verifying your email...</h2>
                        <p className="text-gray-500 text-sm">
                            Please wait while we confirm your email address.
                        </p>
                    </>
                )}

                {status === "verified" && (
                    <>
                        <h2 className="text-2xl font-semibold text-green-600">
                            Email verified
                        </h2>
                        <p className="text-gray-500 text-sm">Redirecting you...</p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <h2 className="text-2xl font-semibold text-red-600">
                            Verification failed ❌
                        </h2>
                        <p className="text-gray-500 text-sm">
                            The link may be expired or invalid.
                        </p>
                        <button
                            onClick={() => router.push("/auth/login")}
                            className="w-full bg-blue-500 text-white py-3 rounded-lg"
                        >
                            Go to login
                        </button>
                    </>
                )}

            </div>
        </div>
    );
}