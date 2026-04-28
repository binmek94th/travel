// src/app/profile/ProfileClient.tsx
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/src/lib/firebase";
import { updateProfile } from "firebase/auth";
import { toast } from "sonner";

type User = {
    uid: string;
    displayName?: string;
    name?: string;
    email?: string;
    photoURL?: string;
    nationality?: string;
    language?: string;
    bio?: string;
};

const LANGUAGES = [
    { value: "en",  label: "English"  },
    { value: "am",  label: "Amharic"  },
    { value: "fr",  label: "French"   },
    { value: "de",  label: "German"   },
    { value: "es",  label: "Spanish"  },
    { value: "it",  label: "Italian"  },
    { value: "zh",  label: "Chinese"  },
    { value: "ar",  label: "Arabic"   },
    { value: "pt",  label: "Portuguese" },
];

function initials(name: string) {
    return (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function ProfileClient({ user }: { user: User }) {
    const router  = useRouter();
    const name    = user.displayName ?? user.name ?? "";

    const [displayName, setDisplayName] = useState(name);
    const [language,    setLanguage]    = useState(user.language ?? "en");
    const [photoURL,    setPhotoURL]    = useState(user.photoURL ?? "");
    const [uploading,   setUploading]   = useState(false);
    const [saving,      setSaving]      = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res  = await fetch("/api/profile/upload-photo", { method:"POST", body:fd });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Upload failed");
            setPhotoURL(data.url);
            toast.success("Photo updated");
        } catch (err: any) {
            toast.error(err.message ?? "Upload failed");
        } finally { setUploading(false); }
    }

    async function save() {
        if (!displayName.trim()) { toast.error("Name is required"); return; }
        setSaving(true);
        try {
            // Update Firebase Auth display name
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, {
                    displayName: displayName.trim(),
                    photoURL:    photoURL || null,
                });
            }
            // Update Firestore user doc
            const res = await fetch("/api/profile", {
                method:  "PATCH",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ displayName: displayName.trim(), language, photoURL: photoURL || null }),
            });
            if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
            toast.success("Profile saved!");
            router.refresh();
        } catch (err: any) {
            toast.error(err.message ?? "Failed to save");
        } finally { setSaving(false); }
    }

    const inputCls = "w-full rounded-xl border border-[rgba(14,133,178,0.18)] bg-white px-4 py-3 text-sm text-[#0A3D52] outline-none transition-all placeholder:text-[#1A6A8A]/50 focus:border-[#1E9DC8] focus:ring-2 focus:ring-[rgba(14,133,178,0.12)]";
    const labelCls = "block text-sm font-semibold text-[#0A3D52] mb-1.5";

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F0F9FF] via-white to-[#F0F9FF]" style={{ paddingTop:64 }}>
            <div className="mx-auto max-w-2xl px-6 py-12">

                {/* Header */}
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(14,133,178,0.18)] bg-[#EBF8FF] px-4 py-1.5 mb-3">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#1E9DC8] inline-block"/>
                        <span className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#1E9DC8]">Your profile</span>
                    </div>
                    <h1 className="text-3xl font-bold text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif", letterSpacing:"-0.02em" }}>
                        Edit profile
                    </h1>
                    <p className="text-sm font-light text-[#1A6A8A] mt-1">Update how you appear on Tizitaw Ethiopia.</p>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-[rgba(14,133,178,0.10)] bg-white shadow-[0_4px_24px_rgba(14,133,178,0.07)] overflow-hidden">

                    {/* Avatar section */}
                    <div className="bg-gradient-to-br from-[#0A3D52] to-[#0E85B2] px-8 py-10 flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/30 shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
                                {photoURL ? (
                                    <img src={photoURL} alt={displayName} className="w-full h-full object-cover"/>
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-[#28B8E8] to-[#0A6A94] flex items-center justify-center text-2xl font-bold text-white">
                                        {initials(displayName)}
                                    </div>
                                )}
                            </div>
                            {uploading && (
                                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                                </div>
                            )}
                        </div>
                        <div className="text-center">
                            <p className="text-white font-bold text-lg" style={{ fontFamily:"'Playfair Display',serif" }}>
                                {displayName || "Your name"}
                            </p>
                            <p className="text-white/60 text-sm">{user.email}</p>
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange}/>
                        <button
                            onClick={() => fileRef.current?.click()}
                            disabled={uploading}
                            className="flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/20 disabled:opacity-50">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                <path d="M7 1v8M4 4l3-3 3 3"/><path d="M1 10v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1"/>
                            </svg>
                            {uploading ? "Uploading…" : "Change photo"}
                        </button>
                    </div>

                    {/* Form */}
                    <div className="p-8 flex flex-col gap-5">

                        <div>
                            <label className={labelCls}>Display name</label>
                            <input
                                value={displayName}
                                onChange={e => setDisplayName(e.target.value)}
                                placeholder="Your full name"
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>Email address</label>
                            <div className={`${inputCls} bg-[#F8FCFF] text-[#1A6A8A] cursor-default`}>
                                {user.email}
                            </div>
                            <p className="mt-1 text-xs text-[#1A6A8A]">Email cannot be changed here. Go to <a href="/settings" className="text-[#1E9DC8] hover:underline">Settings</a> to manage account security.</p>
                        </div>

                        <div>
                            <label className={labelCls}>Preferred language</label>
                            <select
                                value={language}
                                onChange={e => setLanguage(e.target.value)}
                                className={inputCls}
                                style={{ cursor:"pointer" }}>
                                {LANGUAGES.map(l => (
                                    <option key={l.value} value={l.value}>{l.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-3 py-2">
                            {[
                                { icon:"❤️", label:"Saved",    href:"/saved"    },
                                { icon:"🧭", label:"Bookings", href:"/bookings" },
                                { icon:"💬", label:"Posts",    href:"/community"},
                            ].map(({ icon, label, href }) => (
                                <a key={label} href={href}
                                   className="flex flex-col items-center gap-1 rounded-xl border border-[rgba(14,133,178,0.10)] bg-[#F8FCFF] py-4 no-underline transition-all hover:border-[#1E9DC8] hover:bg-[#EBF8FF]">
                                    <span className="text-xl">{icon}</span>
                                    <span className="text-xs font-semibold text-[#0A3D52]">{label}</span>
                                </a>
                            ))}
                        </div>

                        <button
                            onClick={save}
                            disabled={saving}
                            className="w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(14,133,178,0.32)] transition-all disabled:opacity-60 hover:enabled:-translate-y-0.5"
                            style={{ background:"linear-gradient(135deg,#28B8E8,#0A6A94)" }}>
                            {saving ? (
                                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>
                  Saving…
                </span>
                            ) : "Save changes"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}