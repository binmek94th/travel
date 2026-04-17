"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/src/lib/useAuth";
import { formStyles, WaveDivider, GoogleIcon, EyeOn, EyeOff, ErrorBox } from "@/src/lib/auth-ui";

export default function LoginPage() {
  const { login, signInWithGoogle, loading, googleLoading, error, setError } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await login(email, password);
  }

  return (
    <>
      {/* Tab navigation */}
      <div className="tab-pills">
        <Link href="/auth/login"  className="pill active">Sign in</Link>
        <Link href="/auth/signup" className="pill">Create account</Link>
      </div>

      <div className="card">
        <div>
          <h2 className="card-title">Welcome back</h2>
          <p className="card-sub">Continue your journey through Ethiopia</p>
        </div>

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

        {error && <ErrorBox message={error} onDismiss={() => setError(null)} />}

        <form onSubmit={handleSubmit} className="fields" noValidate>
          <div className="fg">
            <label className="flabel" htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              className="fi"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="fg">
            <div className="flabel-row">
              <label className="flabel" htmlFor="login-password">Password</label>
              <Link href="/forgot-password" className="flink">Forgot password?</Link>
            </div>
            <div className="fw fw--icon">
              <input
                id="login-password"
                type={showPass ? "text" : "password"}
                className="fi"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
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
          </div>

          <button type="submit" className="sub-btn" disabled={loading || googleLoading}>
            {loading ? <span className="spin" /> : "Sign in"}
          </button>
        </form>

        <p className="form-footer">
          No account yet?{" "}
          <Link href="/signup" className="form-link">Create one</Link>
        </p>
      </div>

      <style>{formStyles}</style>
    </>
  );
}
