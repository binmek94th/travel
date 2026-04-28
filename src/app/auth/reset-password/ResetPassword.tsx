// app/auth/reset-password/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/src/lib/firebase";
import { formStyles, EyeOn, EyeOff, ErrorBox } from "@/src/lib/auth-ui";

// ── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm:  z.string(),
}).refine(d => d.password === d.confirm, {
    message: "Passwords do not match",
    path:    ["confirm"],
});

type FormValues = z.infer<typeof schema>;

// ── Strength ──────────────────────────────────────────────────────────────────
const STRENGTH_LEVELS = [
    { bars: 1, label: "Weak",   cls: "s1", cssVar: "var(--color-strength-weak)"   },
    { bars: 2, label: "Fair",   cls: "s2", cssVar: "var(--color-strength-fair)"   },
    { bars: 3, label: "Good",   cls: "s3", cssVar: "var(--color-strength-good)"   },
    { bars: 4, label: "Strong", cls: "s4", cssVar: "var(--color-strength-strong)" },
] as const;

function getStrength(pw: string) {
    if (!pw.length) return null;
    let score = 0;
    if (pw.length >= 8)           score++;
    if (/[A-Z]/.test(pw))        score++;
    if (/[0-9]/.test(pw))        score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return STRENGTH_LEVELS[Math.min(score, 3)];
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ResetPassword() {
    const router       = useRouter();
    const searchParams = useSearchParams();
    const oobCode      = searchParams.get("oobCode");

    const [status,    setStatus]    = useState<"verifying" | "ready" | "done" | "invalid">("verifying");
    const [showPass,  setShowPass]  = useState(false);
    const [showConf,  setShowConf]  = useState(false);
    const [error,     setError]     = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState("");

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { password: "", confirm: "" },
    });

    const password = watch("password");
    const strength = getStrength(password ?? "");

    // ── Verify oobCode on mount ───────────────────────────────────────────────
    useEffect(() => {
        if (!oobCode) { setStatus("invalid"); return; }

        verifyPasswordResetCode(auth, oobCode)
            .then(email => { setUserEmail(email); setStatus("ready"); })
            .catch(() => setStatus("invalid"));
    }, [oobCode]);

    // ── Submit ────────────────────────────────────────────────────────────────
    async function onSubmit({ password }: FormValues) {
        if (!oobCode) return;
        setError(null);
        try {
            await confirmPasswordReset(auth, oobCode, password);
            setStatus("done");
            setTimeout(() => router.push("/auth/login"), 2500);
        } catch (err: any) {
            if (err.code === "auth/expired-action-code") {
                setError("This reset link has expired. Please request a new one.");
            } else if (err.code === "auth/invalid-action-code") {
                setStatus("invalid");
            } else {
                setError("Failed to reset password. Please try again.");
            }
        }
    }

    // ── Verifying ─────────────────────────────────────────────────────────────
    if (status === "verifying") {
        return (
            <>
                <div className="card" style={{ textAlign: "center" }}>
                    <span className="spin" style={{ margin: "0 auto" }} />
                    <p className="card-sub" style={{ marginTop: 12 }}>Verifying your link…</p>
                </div>
                <style>{formStyles}</style>
            </>
        );
    }

    // ── Invalid / expired ─────────────────────────────────────────────────────
    if (status === "invalid") {
        return (
            <>
                <div className="card" style={{ textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: "50%",
                            background: "rgba(239,68,68,.10)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                                 stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round">
                                <circle cx="12" cy="12" r="9"/>
                                <path d="M12 8v4M12 16h.01"/>
                            </svg>
                        </div>
                    </div>
                    <h2 className="card-title">Link invalid or expired</h2>
                    <p className="card-sub">
                        This password reset link has already been used or has expired.
                    </p>
                    <Link href="/auth/forgot-password" className="sub-btn"
                          style={{ textAlign: "center", display: "block", marginTop: 8 }}>
                        Request a new link
                    </Link>
                </div>
                <style>{formStyles}</style>
            </>
        );
    }

    // ── Done ──────────────────────────────────────────────────────────────────
    if (status === "done") {
        return (
            <>
                <div className="card" style={{ textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: "50%",
                            background: "rgba(16,185,129,.10)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                                 stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6L9 17l-5-5"/>
                            </svg>
                        </div>
                    </div>
                    <h2 className="card-title">Password reset!</h2>
                    <p className="card-sub">Redirecting you to sign in…</p>
                </div>
                <style>{formStyles}</style>
            </>
        );
    }

    // ── Ready — show form ─────────────────────────────────────────────────────
    return (
        <>
            <div className="card">
                <div>
                    <h2 className="card-title">Set new password</h2>
                    {userEmail && (
                        <p className="card-sub">for <strong>{userEmail}</strong></p>
                    )}
                </div>

                {error && <ErrorBox message={error} onDismiss={() => setError(null)} />}

                <form onSubmit={handleSubmit(onSubmit)} className="fields" noValidate>

                    {/* New password */}
                    <div className="fg">
                        <label className="flabel" htmlFor="new-password">New password</label>
                        <div className="fw fw--icon">
                            <input
                                {...register("password")}
                                id="new-password"
                                type={showPass ? "text" : "password"}
                                className={`fi${errors.password ? " fi--error" : ""}`}
                                placeholder="Min. 6 characters"
                                autoComplete="new-password"
                                autoFocus
                            />
                            <button type="button" className="fi-btn"
                                    onClick={() => setShowPass(v => !v)}
                                    aria-label={showPass ? "Hide password" : "Show password"}>
                                {showPass ? <EyeOff /> : <EyeOn />}
                            </button>
                        </div>
                        {errors.password && <p className="ferr">{errors.password.message}</p>}

                        {/* Strength bars */}
                        {strength && (
                            <div className="sw">
                                <div className="sbars">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className={`sbar${i <= strength.bars ? ` ${strength.cls}` : ""}`} />
                                    ))}
                                </div>
                                <span className="slabel" style={{ color: strength.cssVar }}>
                  {strength.label}
                </span>
                            </div>
                        )}
                    </div>

                    {/* Confirm password */}
                    <div className="fg">
                        <label className="flabel" htmlFor="confirm-password">Confirm password</label>
                        <div className="fw fw--icon">
                            <input
                                {...register("confirm")}
                                id="confirm-password"
                                type={showConf ? "text" : "password"}
                                className={`fi${errors.confirm ? " fi--error" : ""}`}
                                placeholder="Repeat your password"
                                autoComplete="new-password"
                            />
                            <button type="button" className="fi-btn"
                                    onClick={() => setShowConf(v => !v)}
                                    aria-label={showConf ? "Hide password" : "Show password"}>
                                {showConf ? <EyeOff /> : <EyeOn />}
                            </button>
                        </div>
                        {errors.confirm && <p className="ferr">{errors.confirm.message}</p>}
                    </div>

                    <button type="submit" className="sub-btn" disabled={isSubmitting}>
                        {isSubmitting ? <span className="spin" /> : "Reset password"}
                    </button>
                </form>

                <p className="form-footer">
                    <Link href="/auth/login" className="form-link">Back to sign in</Link>
                </p>
            </div>

            <style>{formStyles}</style>
            <style>{`
        .ferr { font-size: 11px; color: var(--color-strength-weak, #ef4444); margin-top: 4px; }
        .fi--error { border-color: var(--color-strength-weak, #ef4444) !important; }
      `}</style>
        </>
    );
}