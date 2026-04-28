// src/app/settings/SettingsClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/src/lib/firebase";
import {
    updatePassword, EmailAuthProvider, reauthenticateWithCredential,
    GoogleAuthProvider, linkWithPopup, unlink, signOut,
} from "firebase/auth";
import { toast } from "sonner";
import Link from "next/link";

type User = {
    uid: string; email: string;
    providers: string[];
    notifications?: { bookings?: boolean; offers?: boolean; community?: boolean };
};

type Section = "password" | "notifications" | "connected" | null;

function SectionCard({ title, subtitle, icon, children, id, active, onToggle }: {
    title: string; subtitle: string; icon: React.ReactNode;
    children: React.ReactNode; id: Section; active: boolean; onToggle: () => void;
}) {
    return (
        <div className="rounded-2xl border border-[rgba(14,133,178,0.10)] bg-white shadow-[0_2px_12px_rgba(14,133,178,0.05)] overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-4 p-5 text-left transition-colors hover:bg-[#F8FCFF]">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#EBF8FF] to-[#D6F0FA] text-[#1E9DC8]">
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#0A3D52]">{title}</p>
                    <p className="text-xs font-light text-[#1A6A8A]">{subtitle}</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#1A6A8A" strokeWidth="2" strokeLinecap="round"
                     style={{ transform: active ? "rotate(180deg)" : "none", transition:"transform 0.2s", flexShrink:0 }}>
                    <path d="M2 5l5 5 5-5"/>
                </svg>
            </button>
            {active && (
                <div className="border-t border-[rgba(14,133,178,0.08)] px-5 pb-5 pt-4 bg-[#FAFCFF]">
                    {children}
                </div>
            )}
        </div>
    );
}

function Toggle({ checked, onChange, label, sub }: { checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-[rgba(14,133,178,0.06)] last:border-0">
            <div>
                <p className="text-sm font-medium text-[#0A3D52]">{label}</p>
                {sub && <p className="text-xs text-[#1A6A8A]">{sub}</p>}
            </div>
            <button
                onClick={() => onChange(!checked)}
                className="relative inline-flex h-6 w-10 flex-shrink-0 rounded-full transition-colors duration-200"
                style={{ background: checked ? "linear-gradient(135deg,#28B8E8,#0A6A94)" : "rgba(14,133,178,0.15)" }}>
        <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200"
              style={{ transform: checked ? "translateX(16px)" : "translateX(0)" }}/>
            </button>
        </div>
    );
}

export default function SettingsClient({ user }: { user: User }) {
    const router = useRouter();
    const [activeSection, setActiveSection] = useState<Section>(null);

    // Password change
    const [currentPw, setCurrentPw]   = useState("");
    const [newPw,     setNewPw]       = useState("");
    const [confirmPw, setConfirmPw]   = useState("");
    const [pwSaving,  setPwSaving]    = useState(false);

    // Notifications
    const defaultNotifs = { bookings: true, offers: false, community: true };
    const [notifs, setNotifs] = useState({ ...defaultNotifs, ...(user.notifications ?? {}) });
    const [notifSaving, setNotifSaving] = useState(false);

    // Providers
    const hasGoogle   = user.providers.includes("google.com");
    const hasPassword = user.providers.includes("password");
    const [linking, setLinking] = useState(false);

    function toggle(section: Section) {
        setActiveSection(s => s === section ? null : section);
    }

    async function changePassword() {
        if (!currentPw || !newPw || !confirmPw) { toast.error("Fill in all fields"); return; }
        if (newPw.length < 6) { toast.error("New password must be at least 6 characters"); return; }
        if (newPw !== confirmPw) { toast.error("Passwords don't match"); return; }
        setPwSaving(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser || !currentUser.email) throw new Error("Not authenticated");
            const cred = EmailAuthProvider.credential(currentUser.email, currentPw);
            await reauthenticateWithCredential(currentUser, cred);
            await updatePassword(currentUser, newPw);
            toast.success("Password updated successfully");
            setCurrentPw(""); setNewPw(""); setConfirmPw("");
        } catch (err: any) {
            const msg = err.code === "auth/wrong-password" ? "Current password is incorrect" : err.message ?? "Failed";
            toast.error(msg);
        } finally { setPwSaving(false); }
    }

    async function saveNotifications() {
        setNotifSaving(true);
        try {
            const res = await fetch("/api/profile", {
                method:  "PATCH",
                headers: { "Content-Type":"application/json" },
                body:    JSON.stringify({ notifications: notifs }),
            });
            if (!res.ok) throw new Error();
            toast.success("Notification preferences saved");
        } catch { toast.error("Failed to save"); }
        finally { setNotifSaving(false); }
    }

    async function linkGoogle() {
        setLinking(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("Not authenticated");
            const provider = new GoogleAuthProvider();
            await linkWithPopup(currentUser, provider);
            toast.success("Google account connected");
            router.refresh();
        } catch (err: any) {
            if (err.code !== "auth/popup-closed-by-user") toast.error(err.message ?? "Failed");
        } finally { setLinking(false); }
    }

    async function unlinkGoogle() {
        if (!hasPassword) { toast.error("Set a password before disconnecting Google — otherwise you'll be locked out"); return; }
        setLinking(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error();
            await unlink(currentUser, "google.com");
            toast.success("Google account disconnected");
            router.refresh();
        } catch (err: any) {
            toast.error(err.message ?? "Failed");
        } finally { setLinking(false); }
    }

    async function handleSignOut() {
        await signOut(auth);
        await fetch("/api/auth/session", { method:"DELETE" });
        router.push("/");
    }

    const inputCls = "w-full rounded-xl border border-[rgba(14,133,178,0.18)] bg-white px-4 py-3 text-sm text-[#0A3D52] outline-none transition-all placeholder:text-[#1A6A8A]/50 focus:border-[#1E9DC8] focus:ring-2 focus:ring-[rgba(14,133,178,0.12)]";
    const labelCls = "block text-xs font-semibold text-[#0A3D52] mb-1.5";

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F0F9FF] via-white to-[#F0F9FF]" style={{ paddingTop:64 }}>
            <div className="mx-auto max-w-2xl px-6 py-12">

                {/* Header */}
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(14,133,178,0.18)] bg-[#EBF8FF] px-4 py-1.5 mb-3">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#1E9DC8] inline-block"/>
                        <span className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#1E9DC8]">Account</span>
                    </div>
                    <h1 className="text-3xl font-bold text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif", letterSpacing:"-0.02em" }}>Settings</h1>
                    <p className="text-sm font-light text-[#1A6A8A] mt-1">Manage your account security and preferences.</p>
                </div>

                {/* Account info */}
                <div className="rounded-2xl border border-[rgba(14,133,178,0.10)] bg-white p-5 mb-6 shadow-[0_2px_12px_rgba(14,133,178,0.05)] flex items-center gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#28B8E8] to-[#0A6A94] text-base font-bold text-white">
                        {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#0A3D52] truncate">{user.email}</p>
                        <p className="text-xs text-[#1A6A8A]">
                            Signed in with {[hasGoogle && "Google", hasPassword && "email/password"].filter(Boolean).join(" & ")}
                        </p>
                    </div>
                    <Link href="/profile" className="flex-shrink-0 text-xs font-semibold text-[#1E9DC8] hover:underline">
                        Edit profile →
                    </Link>
                </div>

                <div className="flex flex-col gap-4">

                    {/* ── PASSWORD ── */}
                    {hasPassword && (
                        <SectionCard
                            id="password" active={activeSection === "password"} onToggle={() => toggle("password")}
                            title="Change password" subtitle="Update your login password"
                            icon={<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="4" y="9" width="12" height="9" rx="2"/><path d="M7 9V6a3 3 0 1 1 6 0v3"/></svg>}>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className={labelCls}>Current password</label>
                                    <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" className={inputCls}/>
                                </div>
                                <div>
                                    <label className={labelCls}>New password</label>
                                    <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min. 6 characters" className={inputCls}/>
                                </div>
                                <div>
                                    <label className={labelCls}>Confirm new password</label>
                                    <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat new password" className={inputCls}/>
                                </div>
                                <button onClick={changePassword} disabled={pwSaving}
                                        className="rounded-xl py-3 text-sm font-bold text-white transition-all disabled:opacity-60"
                                        style={{ background:"linear-gradient(135deg,#28B8E8,#0A6A94)" }}>
                                    {pwSaving ? "Updating…" : "Update password"}
                                </button>
                            </div>
                        </SectionCard>
                    )}

                    {/* ── NOTIFICATIONS ── */}
                    <SectionCard
                        id="notifications" active={activeSection === "notifications"} onToggle={() => toggle("notifications")}
                        title="Email notifications" subtitle="Choose what emails you receive"
                        icon={<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 4h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M2 6l8 5 8-5"/></svg>}>
                        <div className="flex flex-col">
                            <Toggle
                                checked={notifs.bookings ?? true}
                                onChange={v => setNotifs(n => ({ ...n, bookings: v }))}
                                label="Booking updates"
                                sub="Confirmations, reminders, and payment receipts"
                            />
                            <Toggle
                                checked={notifs.offers ?? false}
                                onChange={v => setNotifs(n => ({ ...n, offers: v }))}
                                label="Offers & promotions"
                                sub="Special deals and seasonal discounts"
                            />
                            <Toggle
                                checked={notifs.community ?? true}
                                onChange={v => setNotifs(n => ({ ...n, community: v }))}
                                label="Community activity"
                                sub="Replies to your posts and questions"
                            />
                        </div>
                        <button onClick={saveNotifications} disabled={notifSaving}
                                className="mt-4 w-full rounded-xl py-3 text-sm font-bold text-white transition-all disabled:opacity-60"
                                style={{ background:"linear-gradient(135deg,#28B8E8,#0A6A94)" }}>
                            {notifSaving ? "Saving…" : "Save preferences"}
                        </button>
                    </SectionCard>

                    {/* ── CONNECTED ACCOUNTS ── */}
                    <SectionCard
                        id="connected" active={activeSection === "connected"} onToggle={() => toggle("connected")}
                        title="Connected accounts" subtitle="Manage sign-in methods"
                        icon={<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="10" cy="10" r="8"/><path d="M2 10h16M10 2a14 14 0 0 1 0 16M10 2a14 14 0 0 0 0 16"/></svg>}>

                        {/* Google */}
                        <div className="flex items-center justify-between rounded-xl border border-[rgba(14,133,178,0.10)] bg-white p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(0,0,0,0.10)] bg-white shadow-sm">
                                    <svg width="18" height="18" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[#0A3D52]">Google</p>
                                    <p className="text-xs text-[#1A6A8A]">{hasGoogle ? "Connected" : "Not connected"}</p>
                                </div>
                            </div>
                            {hasGoogle ? (
                                <button onClick={unlinkGoogle} disabled={linking}
                                        className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors disabled:opacity-50">
                                    {linking ? "…" : "Disconnect"}
                                </button>
                            ) : (
                                <button onClick={linkGoogle} disabled={linking}
                                        className="flex items-center gap-1.5 rounded-lg border border-[rgba(14,133,178,0.18)] bg-white px-3 py-1.5 text-xs font-semibold text-[#0A3D52] hover:bg-[#EBF8FF] transition-colors disabled:opacity-50">
                                    {linking ? "Connecting…" : "Connect"}
                                </button>
                            )}
                        </div>

                        {/* Email/password indicator */}
                        <div className="mt-3 flex items-center justify-between rounded-xl border border-[rgba(14,133,178,0.10)] bg-white p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(14,133,178,0.14)] bg-[#EBF8FF]">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#1E9DC8" strokeWidth="1.5" strokeLinecap="round">
                                        <path d="M2 4h12a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M1 5l7 4 7-4"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[#0A3D52]">Email & password</p>
                                    <p className="text-xs text-[#1A6A8A]">{hasPassword ? user.email : "Not set up"}</p>
                                </div>
                            </div>
                            {hasPassword && (
                                <button onClick={() => { setActiveSection("password"); }}
                                        className="text-xs font-semibold text-[#1E9DC8] hover:underline">
                                    Change password
                                </button>
                            )}
                        </div>
                    </SectionCard>

                    {/* ── DANGER ZONE ── */}
                    <div className="rounded-2xl border border-[rgba(239,68,68,0.18)] bg-white p-5 shadow-[0_2px_12px_rgba(239,68,68,0.04)]">
                        <p className="text-sm font-bold text-[#0A3D52] mb-1">Account actions</p>
                        <p className="text-xs text-[#1A6A8A] mb-4">Sign out of your account on this device.</p>
                        <button onClick={handleSignOut}
                                className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-all hover:bg-red-100">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M10 11l4-3-4-3M14 8H6"/>
                            </svg>
                            Sign out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}