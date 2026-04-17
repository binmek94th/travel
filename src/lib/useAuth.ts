"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  AuthError,
} from "firebase/auth";
import {auth, db, googleProvider} from "./firebase";
import {doc, getDoc, serverTimestamp, setDoc} from "@firebase/firestore";
import { sendEmailVerification } from "firebase/auth";


function parseAuthError(e: AuthError): string {
  const map: Record<string, string> = {
    "auth/user-not-found":       "No account found with this email.",
    "auth/wrong-password":       "Incorrect password. Please try again.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/weak-password":        "Password must be at least 6 characters.",
    "auth/invalid-email":        "Please enter a valid email address.",
    "auth/too-many-requests":    "Too many attempts. Please try again later.",
    "auth/popup-closed-by-user": "Sign-in popup was closed.",
    "auth/network-request-failed": "Network error. Check your connection.",
  };
  console.log(e);
  return map[e.code] ?? "Something went wrong. Please try again.";
}

export function useAuth() {
  const router = useRouter();
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  async function createSession(idToken: string) {
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
  }

  async function login(email: string, password: string) {
    setLoading(true); setError(null);
    try {
      const cred  = await signInWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdToken();
      await createSession(token);
      router.push("/");
    } catch (e) {
      setError(parseAuthError(e as AuthError));
    } finally {
      setLoading(false);
    }
  }

  async function signup(name: string, email: string, password: string, nationality: string) {
    setLoading(true); setError(null);

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      await updateProfile(user, { displayName: name });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        email,
        provider: "email",
        role: "user",
        nationality: nationality,
        emailVerified: false,
        createdAt: serverTimestamp(),
      });
      const baseUrl = window.location.origin;

      await sendEmailVerification(cred.user, {
        url: `${baseUrl}/dashboard`,
        handleCodeInApp: true,
      });

      const token = await user.getIdToken();
      await createSession(token);

      router.push("/auth/verify-email");
    } catch (e) {
      setError(parseAuthError(e as AuthError));
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setGoogleLoading(true);
    setError(null);

    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const user = cred.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          provider: "google",
          role: "user",
          createdAt: serverTimestamp(),
        });
      }

      const token = await user.getIdToken();
      await createSession(token);

      router.push("/");
    } catch (e) {
      setError(parseAuthError(e as AuthError));
    } finally {
      setGoogleLoading(false);
    }
  }

  return { login, signup, signInWithGoogle, loading, googleLoading, error, setError };
}
