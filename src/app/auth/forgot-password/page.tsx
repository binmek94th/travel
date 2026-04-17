// app/auth/forgot-password/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/src/lib/firebase";
import { formStyles, ErrorBox } from "@/src/lib/auth-ui";

// ── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
    email: z.string().email("Please enter a valid email address"),
});

type FormValues = z.infer<typeof schema>;

// ── Component ─────────────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
    const [sent,  setSent]  = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        getValues,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { email: "" },
    });

    async function onSubmit({ email }: FormValues) {
        setError(null);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
            await sendPasswordResetEmail(auth, email, {
                url: `${baseUrl}/auth/login`,   // redirect after reset
                handleCodeInApp: false,          // Firebase hosts the reset page
            });
            setSent(true);
        } catch (err: any) {
            // Don't leak whether the email exists — show generic message
            if (err.code === "auth/user-not-found") {
                setSent(true); // same UX either way
            } else {
                setError("Something went wrong. Please try again.");
            }
        }
    }

    // ── Sent state ────────────────────────────────────────────────────────────
    if (sent) {
        return (
            <>
                <div className="tab-pills">
                    <Link href="/auth/login"  className="pill">Sign in</Link>
                    <Link href="/auth/signup" className="pill">Create account</Link>
                </div>

                <div className="card">
                    {/* Envelope icon */}
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: "50%",
                            background: "var(--color-accent-soft, rgba(8,145,178,.10))",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                                 stroke="var(--color-accent, #0891b2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="4" width="20" height="16" rx="2"/>
                                <path d="M2 7l10 7 10-7"/>
                            </svg>
                        </div>
                    </div>

                    <div style={{ textAlign: "center" }}>
                        <h2 className="card-title">Check your inbox</h2>
                        <p className="card-sub">
                            If <strong>{getValues("email")}</strong> is registered, you'll receive a reset link shortly.
                            Check your spam folder if it doesn't arrive.
                        </p>
                    </div>

                    <Link href="/auth/login" className="sub-btn" style={{ textAlign: "center", display: "block" }}>
                        Back to sign in
                    </Link>

                    <p className="form-footer">
                        Didn't receive it?{" "}
                        <button
                            type="button"
                            className="form-link"
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                            onClick={() => setSent(false)}
                        >
                            Try again
                        </button>
                    </p>
                </div>

                <style>{formStyles}</style>
            </>
        );
    }

    // ── Form state ────────────────────────────────────────────────────────────
    return (
        <>
            <div className="tab-pills">
                <Link href="/auth/login"  className="pill">Sign in</Link>
                <Link href="/auth/signup" className="pill">Create account</Link>
            </div>

            <div className="card">
                <div>
                    <h2 className="card-title">Reset your password</h2>
                    <p className="card-sub">
                        Enter your email and we'll send you a link to reset your password.
                    </p>
                </div>

                {error && <ErrorBox message={error} onDismiss={() => setError(null)} />}

                <form onSubmit={handleSubmit(onSubmit)} className="fields" noValidate>
                    <div className="fg">
                        <label className="flabel" htmlFor="reset-email">Email address</label>
                        <input
                            {...register("email")}
                            id="reset-email"
                            type="email"
                            className={`fi${errors.email ? " fi--error" : ""}`}
                            placeholder="you@example.com"
                            autoComplete="email"
                            autoFocus
                        />
                        {errors.email && <p className="ferr">{errors.email.message}</p>}
                    </div>

                    <button
                        type="submit"
                        className="sub-btn"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <span className="spin" /> : "Send reset link"}
                    </button>
                </form>

                <p className="form-footer">
                    Remember your password?{" "}
                    <Link href="/auth/login" className="form-link">Sign in</Link>
                </p>
            </div>

            <style>{formStyles}</style>
            <style>{`
        .ferr {
          font-size: 11px;
          color: var(--color-strength-weak, #ef4444);
          margin-top: 4px;
        }
        .fi--error {
          border-color: var(--color-strength-weak, #ef4444) !important;
        }
      `}</style>
        </>
    );
}