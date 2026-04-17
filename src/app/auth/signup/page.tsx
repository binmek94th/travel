"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/src/lib/useAuth";
import {
  formStyles, WaveDivider, GoogleIcon, EyeOn, EyeOff, ErrorBox,
} from "@/src/lib/auth-ui";
import NationalityDropdown from "@/src/components/ui/NationalityDropdown";

// ── Password strength ─────────────────────────────────────────────────────────
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

// ── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  name:        z.string().min(2, "Name must be at least 2 characters"),
  email:       z.string().email("Please enter a valid email"),
  password:    z.string().min(6, "Password must be at least 6 characters"),
  nationality: z.string().min(1),
  agreed:      z.literal(true, {
    errorMap: () => ({ message: "Please agree to the Terms & Privacy Policy" }),
  }),
});

type FormValues = z.infer<typeof schema>;

// ── Component ─────────────────────────────────────────────────────────────────
export default function SignupPage() {
  const { signup, signInWithGoogle, loading, googleLoading, error, setError } = useAuth();
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", email: "", password: "",
      nationality: "", agreed: undefined,
    },
  });

  const password = watch("password");
  const strength = getStrength(password ?? "");
  const agreed   = watch("agreed");

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function onSubmit(data: FormValues) {
    await signup(data.name, data.email, data.password, data.nationality);
  }

  return (
      <>
        {/* Tab navigation */}
        <div className="tab-pills">
          <Link href="/auth/login"  className="pill">Sign in</Link>
          <Link href="/auth/signup" className="pill active">Create account</Link>
        </div>

        <div className="card">
          <div>
            <h2 className="card-title">Start exploring</h2>
            <p className="card-sub">Create your free account</p>
          </div>

          {/* Google */}
          <button
              className="google-btn"
              onClick={signInWithGoogle}
              disabled={googleLoading || loading}
              type="button"
          >
            {googleLoading ? <span className="spin" /> : <GoogleIcon />}
            <span>Continue with Google</span>
          </button>

          <WaveDivider />

          {/* Server / Firebase errors */}
          {error && <ErrorBox message={error} onDismiss={() => setError(null)} />}

          <form onSubmit={handleSubmit(onSubmit)} className="fields" noValidate>

            {/* Full name */}
            <div className="fg">
              <label className="flabel" htmlFor="signup-name">Full name</label>
              <input
                  {...register("name")}
                  id="signup-name"
                  type="text"
                  className={`fi${errors.name ? " fi--error" : ""}`}
                  placeholder="Your name"
                  autoComplete="name"
              />
              {errors.name && <p className="ferr">{errors.name.message}</p>}
            </div>
            <div className="fg">
              <label className="flabel">
                Nationality
                <span style={{ opacity: 0.45, fontWeight: 400, marginLeft: 4 }}>
                (optional)
              </span>
              </label>
              <Controller
                  name="nationality"
                  control={control}
                  render={({ field }) => (
                      <NationalityDropdown
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder="Select your nationality"
                      />
                  )}
              />
            </div>

            {/* Email */}
            <div className="fg">
              <label className="flabel" htmlFor="signup-email">Email address</label>
              <input
                  {...register("email")}
                  id="signup-email"
                  type="email"
                  className={`fi${errors.email ? " fi--error" : ""}`}
                  placeholder="you@example.com"
                  autoComplete="email"
              />
              {errors.email && <p className="ferr">{errors.email.message}</p>}
            </div>

            {/* Password + strength */}
            <div className="fg">
              <label className="flabel" htmlFor="signup-password">Password</label>
              <div className="fw fw--icon">
                <input
                    {...register("password")}
                    id="signup-password"
                    type={showPass ? "text" : "password"}
                    className={`fi${errors.password ? " fi--error" : ""}`}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                />
                <button
                    type="button"
                    className="fi-btn"
                    onClick={() => setShowPass(v => !v)}
                    aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff /> : <EyeOn />}
                </button>
              </div>
              {errors.password && <p className="ferr">{errors.password.message}</p>}

              {/* Strength bars */}
              {strength && (
                  <div className="sw">
                    <div className="sbars">
                      {[1, 2, 3, 4].map(i => (
                          <div
                              key={i}
                              className={`sbar${i <= strength.bars ? ` ${strength.cls}` : ""}`}
                          />
                      ))}
                    </div>
                    <span className="slabel" style={{ color: strength.cssVar }}>
                  {strength.label}
                </span>
                  </div>
              )}
            </div>



            {/* Terms */}
            <div className="fg">
              <Controller
                  name="agreed"
                  control={control}
                  render={({ field }) => (
                      <label className="chk-label">
                        <div
                            className={`chk-box${field.value ? " on" : ""}${errors.agreed ? " chk-box--error" : ""}`}
                            onClick={() => field.onChange(field.value ? undefined : true)}
                            role="checkbox"
                            aria-checked={!!field.value}
                            tabIndex={0}
                            onKeyDown={e => e.key === " " && field.onChange(field.value ? undefined : true)}
                        >
                          {field.value && (
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                                   stroke="var(--color-checkbox-check)"
                                   strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1.5 5l2.5 2.5 4.5-4" />
                              </svg>
                          )}
                        </div>
                        <span className="chk-text">
                    I agree to the{" "}
                          <Link href="/terms"   className="form-link">Terms of Service</Link>
                          {" "}&amp;{" "}
                          <Link href="/privacy" className="form-link">Privacy Policy</Link>
                  </span>
                      </label>
                  )}
              />
              {errors.agreed && <p className="ferr">{errors.agreed.message}</p>}
            </div>

            <button
                type="submit"
                className="sub-btn"
                disabled={loading || googleLoading || !agreed}
            >
              {loading ? <span className="spin" /> : "Create account"}
            </button>
          </form>

          <p className="form-footer">
            Already have an account?{" "}
            <Link href="/login" className="form-link">Sign in</Link>
          </p>
        </div>

        {/* Add .ferr and .fi--error to your formStyles */}
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
        .chk-box--error {
          border-color: var(--color-strength-weak, #ef4444);
        }
      `}</style>
      </>
  );
}