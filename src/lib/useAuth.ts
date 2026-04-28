// src/lib/useAuth.ts
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/src/lib/firebase";

async function createSession(idToken: string) {
  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
}

export function useAuth() {
  const router = useRouter();
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  // ── Email / password login ─────────────────────────────────────────────────
  async function login(email: string, password: string, returnUrl = "/") {
    setLoading(true);
    setError(null);
    try {
      const cred    = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      console.log(returnUrl)
      await createSession(idToken);
      window.location.href = returnUrl;

    } catch (err: any) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  // ── Email / password signup ────────────────────────────────────────────────
  async function signup(
      name: string,
      email: string,
      password: string,
      nationality: string,
      returnUrl = "/"
  ) {
    setLoading(true);
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });

      // Store nationality in Firestore via API
      const idToken = await cred.user.getIdToken();
      await createSession(idToken);

      await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, nationality }),
      });

      window.location.href = returnUrl;
    } catch (err: any) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  // ── Google ─────────────────────────────────────────────────────────────────
  async function signInWithGoogle(returnUrl = "/") {
    setGoogleLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const cred     = await signInWithPopup(auth, provider);
      const idToken  = await cred.user.getIdToken();
      await createSession(idToken);
      window.location.href = returnUrl;
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError(friendlyError(err.code));
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return { login, signup, signInWithGoogle, loading, googleLoading, error, setError };
}

// ── Friendly error messages ───────────────────────────────────────────────────
function friendlyError(code: string): string {
  const map: Record<string, string> = {
    "auth/invalid-credential":       "Incorrect email or password.",
    "auth/user-not-found":           "No account found with this email.",
    "auth/wrong-password":           "Incorrect password.",
    "auth/email-already-in-use":     "An account with this email already exists.",
    "auth/weak-password":            "Password must be at least 6 characters.",
    "auth/invalid-email":            "Please enter a valid email address.",
    "auth/too-many-requests":        "Too many attempts. Please try again later.",
    "auth/network-request-failed":   "Network error. Check your connection.",
    "auth/popup-blocked":            "Popup was blocked. Allow popups and try again.",
  };
  return map[code] ?? "Something went wrong. Please try again.";
}