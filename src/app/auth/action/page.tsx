"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import VerifyEmailPage from "@/src/app/auth/verify-email/page";
import ResetPasswordPage from "@/src/app/auth/reset-password/page";

function ActionRouter() {
    const searchParams = useSearchParams();
    const mode = searchParams.get("mode");

    if (mode === "verifyEmail")   return <VerifyEmailPage />;
    if (mode === "resetPassword") return <ResetPasswordPage />;

    // Unknown mode — show a friendly fallback
    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-4">
                <div style={{
                    width: 52, height: 52, borderRadius: "50%",
                    background: "rgba(239,68,68,.10)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto",
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                         stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round">
                        <circle cx="12" cy="12" r="9"/>
                        <path d="M12 8v4M12 16h.01"/>
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-slate-800">Invalid link</h2>
                <p className="text-sm text-slate-500">
                    This link is invalid or has already been used.
                </p>
                <a href="/auth/login"
                   className="inline-block mt-2 text-sm text-cyan-600 hover:underline">
                    Back to sign in
                </a>
            </div>
        </div>
    );
}

export default function ActionPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <ActionRouter />
        </Suspense>
    );
}