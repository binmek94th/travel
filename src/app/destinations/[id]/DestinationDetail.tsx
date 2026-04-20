"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/src/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";

type Review = {
    id: string; rating: number; comment: string;
    authorName: string; authorId: string; createdAt: string;
};

type NearbyTour = {
    id: string; title: string; slug: string; priceUSD: number;
    durationDays: number; avgRating: number; reviewCount: number;
    coverImage: string | null; categories: string[]; isFeatured: boolean;
};

type TravelTip = { title: string; tip: string };

type Destination = {
    id: string; name: string; slug: string; region: string;
    categories: string[]; avgRating: number; reviewCount: number;
    isHiddenGem: boolean; coverImage: string | null; images: string[];
    description: string; bestTimeToVisit: string;
    travelTips: TravelTip[];
    latitude: number | null; longitude: number | null;
};

const TAG_STYLES: Record<string, string> = {
    culture:   "bg-blue-50 text-blue-800",
    nature:    "bg-emerald-50 text-emerald-800",
    adventure: "bg-amber-50 text-amber-800",
    religious: "bg-violet-50 text-violet-800",
};

const CAT_ICONS: Record<string, string> = {
    culture: "🏛", nature: "🌿", adventure: "⛰", religious: "⛪",
};

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1,2,3,4,5].map(i => (
                <svg key={i} width="14" height="14" viewBox="0 0 14 14"
                     fill={i <= rating ? "#F59E0B" : "none"} stroke="#F59E0B" strokeWidth="1.2">
                    <polygon points="7 1 8.8 5.1 13.3 5.5 10 8.4 11 12.8 7 10.4 3 12.8 4 8.4 0.7 5.5 5.2 5.1"/>
                </svg>
            ))}
        </div>
    );
}

function fmtDate(iso: string) {
    if (!iso) return "";
    try { return new Date(iso).toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" }); }
    catch { return ""; }
}

// ── SAVE BUTTON ───────────────────────────────────────────────────────────────
function SaveButton({ destId, destName }: { destId: string; destName: string }) {
    const router = useRouter();
    const [uid,    setUid]    = useState<string | null | undefined>(undefined);
    const [saved,  setSaved]  = useState(false);
    const [saving, setSaving] = useState(false);
    const [bounce, setBounce] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async u => {
            setUid(u ? u.uid : null);
            if (u) {
                try {
                    const res  = await fetch(`/api/user/saved-destinations?destinationId=${destId}`);
                    const data = await res.json();
                    setSaved(data.saved ?? false);
                } catch {}
            }
        });
        return () => unsub();
    }, [destId]);

    async function toggle() {
        if (!uid) {
            const returnUrl = encodeURIComponent(window.location.pathname);
            router.push(`/auth/signup?returnUrl=${returnUrl}`);
            return;
        }
        setSaving(true);
        try {
            if (saved) {
                await fetch("/api/user/saved-destinations", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ destinationId: destId }),
                });
                setSaved(false);
                toast.success("Removed from saved destinations");
            } else {
                await fetch("/api/user/saved-destinations", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ destinationId: destId, destinationName: destName }),
                });
                setSaved(true);
                setBounce(true);
                setTimeout(() => setBounce(false), 500);
                toast.success("Destination saved! View in your profile.");
            }
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <button
            onClick={toggle}
            disabled={saving || uid === undefined}
            className="flex items-center justify-center gap-2 rounded-xl border w-full px-4 py-3 text-sm font-semibold transition-all disabled:opacity-50"
            style={{
                border:     saved ? "1.5px solid #EF4444" : "1.5px solid rgba(14,133,178,0.22)",
                background: saved ? "#FEF2F2" : "white",
                color:      saved ? "#EF4444" : "#1A6A8A",
                boxShadow:  saved ? "0 2px 12px rgba(239,68,68,0.12)" : "none",
            }}
            onMouseEnter={e => { if (!saved) (e.currentTarget as HTMLElement).style.background = "#EBF8FF"; }}
            onMouseLeave={e => { if (!saved) (e.currentTarget as HTMLElement).style.background = "white"; }}
        >
            {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[rgba(14,133,178,0.2)] border-t-[#1E9DC8]"/>
            ) : (
                <svg width="16" height="16" viewBox="0 0 16 16"
                     fill={saved ? "#EF4444" : "none"}
                     stroke={saved ? "#EF4444" : "currentColor"}
                     strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                     style={{ transform: bounce ? "scale(1.35)" : "scale(1)", transition: "transform 0.3s cubic-bezier(0.22,1,0.36,1)" }}>
                    <path d="M8 13.5S1.5 9.5 1.5 5.5a3.5 3.5 0 0 1 6.5-1.8A3.5 3.5 0 0 1 14.5 5.5c0 4-6.5 8-6.5 8z"/>
                </svg>
            )}
            {uid === undefined ? "…" : saved ? "Saved" : uid ? "Save destination" : "Save destination"}
        </button>
    );
}

// ── MAP ───────────────────────────────────────────────────────────────────────
function DestinationMap({ lat, lng, name }: { lat: number; lng: number; name: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef       = useRef<any>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (mapRef.current || !containerRef.current) return;
        const load = async () => {
            if (!document.getElementById("leaflet-css")) {
                const link = document.createElement("link");
                link.id = "leaflet-css"; link.rel = "stylesheet";
                link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
                document.head.appendChild(link);
            }
            if (!(window as any).L) {
                await new Promise<void>((res, rej) => {
                    const s = document.createElement("script");
                    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
                    s.onload = () => res(); s.onerror = rej;
                    document.head.appendChild(s);
                });
            }
            const L = (window as any).L;
            const map = L.map(containerRef.current!, { center:[lat,lng], zoom:11, zoomControl:true, attributionControl:false, scrollWheelZoom:false });
            mapRef.current = map;
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom:18 }).addTo(map);
            const icon = L.divIcon({
                html:`<div style="width:36px;height:44px;filter:drop-shadow(0 4px 8px rgba(14,133,178,0.45))"><svg viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 0C11.37 0 6 5.37 6 12c0 9 12 32 12 32S30 21 30 12C30 5.37 24.63 0 18 0z" fill="url(#dg)" stroke="white" stroke-width="1.5"/><circle cx="18" cy="12" r="6" fill="white"/><circle cx="18" cy="12" r="3" fill="url(#dg)"/><defs><linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#28B8E8"/><stop offset="100%" stop-color="#0A6A94"/></linearGradient></defs></svg></div>`,
                className:"", iconSize:[36,44], iconAnchor:[18,44], popupAnchor:[0,-46],
            });
            L.marker([lat,lng],{icon}).addTo(map)
                .bindPopup(`<div style="font-family:'Lato',sans-serif;padding:4px 2px"><div style="font-weight:700;font-size:13px;color:#0A3D52;margin-bottom:2px">${name}</div><div style="font-size:11px;color:#1A6A8A">${lat.toFixed(4)}, ${lng.toFixed(4)}</div></div>`,{closeButton:false,offset:[0,-4]})
                .openPopup();
            setReady(true);
        };
        load().catch(console.error);
        return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
    }, [lat, lng, name]);

    return (
        <div className="overflow-hidden rounded-2xl border border-[rgba(14,133,178,0.12)] shadow-[0_4px_24px_rgba(14,133,178,0.07)]">
            <div className="flex items-center justify-between bg-white px-4 py-3 border-b border-[rgba(14,133,178,0.08)]">
                <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#28B8E8] to-[#0A6A94]">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round"><path d="M6 1C4.34 1 3 2.34 3 4c0 2.54 3 7 3 7s3-4.46 3-7c0-1.66-1.34-3-3-3z"/><circle cx="6" cy="4" r="1"/></svg>
                    </div>
                    <span className="text-sm font-semibold text-[#0A3D52]">Location</span>
                </div>
                <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-1 text-xs font-medium text-[#1E9DC8] hover:underline">
                    Open in Maps
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 8L8 2M4 2h4v4"/></svg>
                </a>
            </div>
            <div className="relative" style={{ height:260 }}>
                <div ref={containerRef} style={{ width:"100%", height:"100%" }}/>
                {!ready && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#EBF8FF] z-10">
                        <div className="flex flex-col items-center gap-2">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[rgba(14,133,178,0.2)] border-t-[#1E9DC8]"/>
                            <span className="text-xs text-[#1A6A8A]">Loading map…</span>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex items-center justify-between bg-[#F8FCFF] px-4 py-2.5 border-t border-[rgba(14,133,178,0.08)]">
                <span className="font-mono text-[0.72rem] text-[#1A6A8A]">{lat.toFixed(6)}, {lng.toFixed(6)}</span>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-[#28B8E8] to-[#0A6A94] px-3 py-1 text-[0.7rem] font-bold text-white transition-all hover:shadow-[0_2px_10px_rgba(14,133,178,0.40)]">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 1C4.34 1 3 2.34 3 4c0 2.54 3 7 3 7s3-4.46 3-7c0-1.66-1.34-3-3-3z"/><circle cx="6" cy="4" r="1"/></svg>
                    Get directions
                </a>
            </div>
        </div>
    );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function DestinationDetail({
                                              destination, reviews, nearbyTours,
                                          }: {
    destination: Destination; reviews: Review[]; nearbyTours: NearbyTour[];
}) {
    const router = useRouter();
    const [activeImg, setActiveImg] = useState(0);

    const allImages = [
        ...(destination.coverImage ? [destination.coverImage] : []),
        ...destination.images.filter(i => i !== destination.coverImage),
    ];

    const avgRating = reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : destination.avgRating;

    return (
        <div className="min-h-screen mt-10 pt-3 bg-white">

            {/* ── Hero ── */}
            <div className="relative h-[55vh] min-h-[360px] overflow-hidden bg-gradient-to-br from-[#EBF8FF] to-[#D6F0FA]">
                {allImages.length > 0 ? (
                    <img src={allImages[activeImg]} alt={destination.name}
                         className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"/>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-20">
                        {CAT_ICONS[destination.categories[0]] ?? "📍"}
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(6,62,90,0.15)] to-[rgba(6,62,90,0.75)]"/>
                <button onClick={() => router.back()}
                        className="absolute left-6 top-6 flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/30">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 2L4 7l5 5"/></svg>
                    Back
                </button>
                <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 md:px-16">
                    <div className="mx-auto max-w-6xl">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            {destination.isHiddenGem && <span className="rounded-full bg-amber-400/90 px-3 py-0.5 text-xs font-bold text-white">💎 Hidden gem</span>}
                            {destination.categories.map(c => (
                                <span key={c} className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur-sm">{c}</span>
                            ))}
                        </div>
                        <h1 className="mb-2 text-4xl font-bold text-white md:text-5xl"
                            style={{ fontFamily:"'Playfair Display',serif", letterSpacing:"-0.025em" }}>
                            {destination.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
                            {destination.region && (
                                <span className="flex items-center gap-1.5">
                                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M7 1C4.79 1 3 2.79 3 5c0 3.18 4 8 4 8s4-4.82 4-8c0-2.21-1.79-4-4-4z"/><circle cx="7" cy="5" r="1.2"/></svg>
                                    {destination.region}
                                </span>
                            )}
                            {avgRating > 0 && (
                                <span className="flex items-center gap-1.5">
                                    <span className="text-amber-400">★</span>{avgRating.toFixed(1)} ({destination.reviewCount} reviews)
                                </span>
                            )}
                            {destination.bestTimeToVisit && (
                                <span className="flex items-center gap-1.5">
                                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="5.5"/><path d="M7 4v3l2 2"/></svg>
                                    Best time: {destination.bestTimeToVisit}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Thumbnails ── */}
            {allImages.length > 1 && (
                <div className="border-b border-[rgba(14,133,178,0.08)] bg-[#F8FCFF] px-6 py-3">
                    <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto pb-1">
                        {allImages.map((img, i) => (
                            <button key={i} onClick={() => setActiveImg(i)}
                                    className={`h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${i === activeImg ? "border-[#1E9DC8] opacity-100" : "border-transparent opacity-60 hover:opacity-100"}`}>
                                <img src={img} alt="" className="h-full w-full object-cover"/>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Body ── */}
            <div className="mx-auto max-w-6xl px-6 py-12">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">

                    {/* Left */}
                    <div className="lg:col-span-2 flex flex-col gap-10">
                        <section>
                            <h2 className="mb-4 text-2xl font-semibold text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif" }}>About {destination.name}</h2>
                            <p className="text-base font-light leading-relaxed text-[#1A6A8A] whitespace-pre-line">{destination.description}</p>
                        </section>

                        {destination.travelTips.length > 0 && (
                            <section>
                                <h2 className="mb-4 text-2xl font-semibold text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif" }}>Travel tips</h2>
                                <div className="flex flex-col gap-3">
                                    {destination.travelTips.map((tip, i) => (
                                        <div key={i} className="rounded-xl border border-[rgba(14,133,178,0.10)] bg-[#F8FCFF] p-4">
                                            <div className="mb-1.5 flex items-center gap-2.5">
                                                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#1E9DC8] text-xs font-bold text-white">{i+1}</div>
                                                <p className="text-sm font-semibold text-[#0A3D52]">{tip.title}</p>
                                            </div>
                                            <p className="pl-8 text-sm font-light leading-relaxed text-[#1A6A8A]">{tip.tip}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {nearbyTours.length > 0 && (
                            <section>
                                <div className="mb-5 flex items-center justify-between">
                                    <h2 className="text-2xl font-semibold text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif" }}>Tours in {destination.name}</h2>
                                    <Link href={`/tours?destination=${destination.id}`} className="text-sm font-medium text-[#1E9DC8] hover:underline">View all</Link>
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {nearbyTours.map(tour => (
                                        <Link key={tour.id} href={`/tours/${tour.id}`}
                                              className="group flex overflow-hidden rounded-xl border border-[rgba(14,133,178,0.10)] bg-white no-underline transition-all hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(14,133,178,0.12)]">
                                            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden bg-gradient-to-br from-[#EBF8FF] to-[#D6F0FA]">
                                                {tour.coverImage ? (
                                                    <img src={tour.coverImage} alt={tour.title} className="h-full w-full object-cover" loading="lazy"/>
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-2xl">{CAT_ICONS[tour.categories[0]] ?? "🧭"}</div>
                                                )}
                                                {tour.isFeatured && <div className="absolute left-0 top-1 rounded-r bg-[#1E9DC8] px-1.5 py-0.5 text-[0.55rem] font-bold text-white">⭐</div>}
                                            </div>
                                            <div className="flex flex-1 flex-col justify-between p-3">
                                                <p className="line-clamp-2 text-sm font-semibold leading-snug text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif" }}>{tour.title}</p>
                                                <div className="mt-2 flex items-center justify-between">
                                                    <span className="flex items-center gap-1 text-xs text-[#1A6A8A]">
                                                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="6" cy="6" r="4.5"/><path d="M6 3.5V6l1.5 1.5"/></svg>
                                                        {tour.durationDays}d
                                                    </span>
                                                    <span className="text-sm font-bold text-[#1E9DC8]">${tour.priceUSD.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        <section>
                            <h2 className="mb-5 text-2xl font-semibold text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif" }}>
                                Reviews {reviews.length > 0 && <span className="ml-2 text-base font-light text-[#1A6A8A]">({reviews.length})</span>}
                            </h2>
                            {reviews.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-[rgba(14,133,178,0.20)] p-8 text-center">
                                    <p className="text-sm font-light text-[#1A6A8A]">No reviews yet. Be the first to share your experience.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-6 rounded-xl border border-[rgba(14,133,178,0.10)] bg-[#F8FCFF] p-5">
                                        <div className="text-center flex-shrink-0">
                                            <div className="text-4xl font-bold text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif" }}>{avgRating.toFixed(1)}</div>
                                            <StarRating rating={Math.round(avgRating)}/>
                                            <div className="mt-1 text-xs text-[#1A6A8A]">{reviews.length} reviews</div>
                                        </div>
                                        <div className="h-14 w-px bg-[rgba(14,133,178,0.12)]"/>
                                        <div className="flex flex-1 flex-col gap-1.5">
                                            {[5,4,3,2,1].map(star => {
                                                const count = reviews.filter(r => r.rating === star).length;
                                                const pct   = reviews.length ? (count / reviews.length) * 100 : 0;
                                                return (
                                                    <div key={star} className="flex items-center gap-2">
                                                        <span className="w-3 text-right text-xs text-[#1A6A8A]">{star}</span>
                                                        <span className="text-amber-400 text-xs">★</span>
                                                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[rgba(14,133,178,0.10)]">
                                                            <div className="h-full rounded-full bg-amber-400 transition-all duration-700" style={{ width:`${pct}%` }}/>
                                                        </div>
                                                        <span className="w-5 text-xs text-[#1A6A8A]">{count}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    {reviews.map(r => (
                                        <div key={r.id} className="rounded-xl border border-[rgba(14,133,178,0.10)] p-4">
                                            <div className="mb-3 flex items-start justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#28B8E8] to-[#0A6A94] text-sm font-bold text-white">
                                                        {r.authorName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-[#0A3D52]">{r.authorName}</p>
                                                        {r.createdAt && <p className="text-xs text-[#1A6A8A]">{fmtDate(r.createdAt)}</p>}
                                                    </div>
                                                </div>
                                                <StarRating rating={r.rating}/>
                                            </div>
                                            <p className="text-sm font-light leading-relaxed text-[#1A6A8A]">{r.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* ── Right sidebar ── */}
                    <div className="flex flex-col gap-5">

                        {/* Quick facts */}
                        <div className="rounded-2xl border border-[rgba(14,133,178,0.12)] bg-white p-5 shadow-[0_4px_24px_rgba(14,133,178,0.07)]">
                            <h3 className="mb-4 text-lg font-semibold text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif" }}>Quick facts</h3>
                            <div className="flex flex-col gap-3">
                                {destination.region && (
                                    <div className="flex items-center justify-between border-b border-[#EBF8FF] pb-3">
                                        <span className="text-sm text-[#1A6A8A]">Region</span>
                                        <span className="text-sm font-semibold text-[#0A3D52]">{destination.region}</span>
                                    </div>
                                )}
                                {destination.bestTimeToVisit && (
                                    <div className="flex items-center justify-between border-b border-[#EBF8FF] pb-3">
                                        <span className="text-sm text-[#1A6A8A]">Best time</span>
                                        <span className="text-sm font-semibold text-[#0A3D52]">{destination.bestTimeToVisit}</span>
                                    </div>
                                )}
                                {destination.categories.length > 0 && (
                                    <div className="flex items-start justify-between border-b border-[#EBF8FF] pb-3">
                                        <span className="text-sm text-[#1A6A8A]">Categories</span>
                                        <div className="flex flex-wrap justify-end gap-1 max-w-[140px]">
                                            {destination.categories.map(c => (
                                                <span key={c} className={`rounded-full px-2 py-0.5 text-[0.62rem] font-bold uppercase ${TAG_STYLES[c] ?? "bg-[#EBF8FF] text-[#1A6A8A]"}`}>{c}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {nearbyTours.length > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-[#1A6A8A]">Available tours</span>
                                        <span className="text-sm font-semibold text-[#0A3D52]">{nearbyTours.length}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="rounded-2xl bg-gradient-to-br from-[#0A3D52] to-[#0E85B2] p-5 text-white">
                            <h3 className="mb-2 text-lg font-semibold" style={{ fontFamily:"'Playfair Display',serif" }}>Ready to visit?</h3>
                            <p className="mb-4 text-sm font-light leading-relaxed text-white/80">
                                Book a guided tour or plan your own itinerary with our AI journey builder.
                            </p>
                            <Link href={nearbyTours.length > 0 ? `/tours/${nearbyTours[0].id}` : "/tours"}
                                  className="mb-2 flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#0A3D52] transition-all hover:bg-[#EBF8FF]">
                                Browse tours
                                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 6.5h9M7 3l3.5 3.5L7 10"/></svg>
                            </Link>
                            <Link href="/ai-planner"
                                  className="flex items-center justify-center gap-2 rounded-xl border border-white/25 px-4 py-2.5 text-sm font-medium text-white/90 transition-all hover:bg-white/10">
                                🤖 AI journey planner
                            </Link>
                        </div>

                        {/* ── SAVE BUTTON ── */}
                        <SaveButton destId={destination.id} destName={destination.name}/>

                        {/* Map */}
                        {destination.latitude && destination.longitude && (
                            <DestinationMap lat={destination.latitude} lng={destination.longitude} name={destination.name}/>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}