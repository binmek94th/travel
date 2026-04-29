"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { auth } from "@/src/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import TourRouteMap from "./TourRouteMap";
import {track} from "@/src/lib/analytics/track";

// ── Types ─────────────────────────────────────────────────────────────────────
type ItineraryDay = {
    day: number; title: string; description: string;
    latitude?: number | string; longitude?: number | string;
    transportMode?: "driving" | "walking" | "flying" | "boat";
};

type Tour = {
    id: string; title: string; slug: string; operatorId: string;
    destinationIds: string[]; categories: string[];
    itinerary: ItineraryDay[];
    durationDays: number; priceUSD: number; priceETB: number;
    groupSizeMin: number; groupSizeMax: number;
    includes: string[]; excludes: string[];
    images: string[]; isFeatured: boolean; description: string;
};

type Review = {
    id: string; rating: number; comment: string;
    authorName: string; authorId: string; createdAt: string;
};

type Operator = {
    id: string; name: string; photoURL: string | null;
    nationality: string; createdAt: string;
};

type Destination = { id: string; name: string; slug: string };

// ── Constants ─────────────────────────────────────────────────────────────────
const TAG_STYLES: Record<string, string> = {
    culture:   "bg-blue-50 text-blue-800",
    nature:    "bg-emerald-50 text-emerald-800",
    adventure: "bg-amber-50 text-amber-800",
    religious: "bg-violet-50 text-violet-800",
};

const TRANSPORT_ICONS: Record<string, string> = {
    driving: "🚙", walking: "🚶", flying: "✈️", boat: "⛵",
};

const TRANSPORT_COLORS: Record<string, string> = {
    driving: "bg-blue-50 text-blue-700 border-blue-100",
    walking: "bg-emerald-50 text-emerald-700 border-emerald-100",
    flying:  "bg-violet-50 text-violet-700 border-violet-100",
    boat:    "bg-amber-50 text-amber-700 border-amber-100",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── Save button with auth gate ────────────────────────────────────────────────
function SaveButton({ tourId, tourTitle }: { tourId: string; tourTitle: string }) {
    const router = useRouter();
    const [authed,   setAuthed]   = useState<boolean | null>(null); // null = loading
    const [saved,    setSaved]    = useState(false);
    const [saving,   setSaving]   = useState(false);
    const [animate,  setAnimate]  = useState(false);

    // Check auth state + whether already saved
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async user => {
            setAuthed(!!user);
            if (user) {
                // Check Firestore savedTours subcollection
                try {
                    const res  = await fetch(`/api/user/saved-tours?tourId=${tourId}`);
                    const data = await res.json();
                    setSaved(data.saved ?? false);
                } catch { /* silent */ }
            }
        });
        return () => unsub();
    }, [tourId]);

    async function handleSave() {
        // Not logged in → redirect to signup with return URL
        if (!authed) {
            const returnUrl = encodeURIComponent(window.location.pathname);
            router.push(`/auth/signup?returnUrl=${returnUrl}`);
            return;
        }

        setSaving(true);
        try {
            if (saved) {
                await fetch(`/api/user/saved-tours`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ tourId }),
                });
                setSaved(false);
                toast.success("Removed from saved tours");
            } else {
                await fetch(`/api/user/saved-tours`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ tourId, tourTitle }),
                });
                setSaved(true);
                setAnimate(true);
                setTimeout(() => setAnimate(false), 600);
                toast.success("Tour saved! View in your profile.");
            }
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <button
            onClick={handleSave}
            disabled={saving || authed === null}
            title={saved ? "Remove from saved" : authed ? "Save tour" : "Sign up to save"}
            className="flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all disabled:opacity-50"
            style={{
                border:      saved ? "1.5px solid #EF4444" : "1.5px solid rgba(14,133,178,0.22)",
                background:  saved ? "#FEF2F2" : "white",
                color:       saved ? "#EF4444" : "#1A6A8A",
                boxShadow:   saved ? "0 2px 12px rgba(239,68,68,0.12)" : "none",
            }}
            onMouseEnter={e => {
                if (!saved) (e.currentTarget as HTMLElement).style.background = "#EBF8FF";
            }}
            onMouseLeave={e => {
                if (!saved) (e.currentTarget as HTMLElement).style.background = "white";
            }}
        >
            {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[rgba(14,133,178,0.2)] border-t-[#1E9DC8]"/>
            ) : (
                <svg
                    width="16" height="16" viewBox="0 0 16 16"
                    fill={saved ? "#EF4444" : "none"}
                    stroke={saved ? "#EF4444" : "currentColor"}
                    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: animate ? "scale(1.35)" : "scale(1)", transition: "transform 0.3s cubic-bezier(0.22,1,0.36,1)" }}
                >
                    <path d="M8 13.5S1.5 9.5 1.5 5.5a3.5 3.5 0 0 1 6.5-1.8A3.5 3.5 0 0 1 14.5 5.5c0 4-6.5 8-6.5 8z"/>
                </svg>
            )}
            {authed === null ? "…" : saved ? "Saved" : authed ? "Save tour" : "Save tour"}
        </button>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TourDetail({
                                       tour, reviews, operator, destinations,
                                   }: {
    tour: Tour; reviews: Review[]; operator: Operator | null; destinations: Destination[];
}) {
    const router = useRouter();
    const [activeImg, setActiveImg] = useState(0);
    const [activeDay, setActiveDay] = useState<number | null>(0);

    useEffect(() => {
        if (tour) {
            track("tour_viewed", {tour_id: tour.id, tour_title: tour.title, tour_priceUSD: tour.priceUSD})
        }
     }, [tour.id]);

    const avgRating = reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

    const mappedDays = tour.itinerary.filter(d => {
        const lat = Number(d.latitude), lng = Number(d.longitude);
        return d.latitude && d.longitude && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
    });

    return (
        <div className="min-h-screen mt-10 bg-white">

            {/* ── Hero ── */}
            <div className="relative h-[55vh] min-h-[380px] overflow-hidden bg-gradient-to-br from-[#EBF8FF] to-[#D6F0FA]">
                {tour.images.length > 0 ? (
                    <img src={tour.images[activeImg]} alt={tour.title}
                         className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"/>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-20">🧭</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-[rgba(6,62,90,0.3)] via-transparent to-[rgba(6,62,90,0.80)]"/>

                <button onClick={() => router.back()}
                        className="absolute left-6 top-12 flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/30">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 2L4 7l5 5"/></svg>
                    Back
                </button>

                {tour.isFeatured && (
                    <div className="absolute right-6 top-6 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-white">⭐ Featured</div>
                )}

                <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 md:px-16">
                    <div className="mx-auto max-w-6xl">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            {tour.categories.map(c => (
                                <span key={c} className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur-sm">{c}</span>
                            ))}
                        </div>
                        <h1 className="mb-3 text-4xl font-bold text-white md:text-5xl"
                            style={{ fontFamily:"'Playfair Display',serif", letterSpacing:"-0.025em" }}>
                            {tour.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-white/85">
                            <span className="flex items-center gap-1.5">
                                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="5.5"/><path d="M7 4v3l2 2"/></svg>
                                {tour.durationDays} day{tour.durationDays !== 1 ? "s" : ""}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M7 1.5C5 1.5 3.5 3 3.5 5c0 2.8 3.5 7 3.5 7s3.5-4.2 3.5-7c0-2-1.5-3.5-3.5-3.5z"/><circle cx="7" cy="5" r="1.2"/></svg>
                                {destinations.length > 0 ? destinations.map(d => d.name).join(", ") : `${tour.destinationIds.length} destination${tour.destinationIds.length !== 1 ? "s" : ""}`}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M7 1.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM2.5 12.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5"/></svg>
                                {tour.groupSizeMin}–{tour.groupSizeMax} people
                            </span>
                            {avgRating > 0 && (
                                <span className="flex items-center gap-1.5">
                                    <span className="text-amber-400">★</span>{avgRating.toFixed(1)} ({reviews.length} reviews)
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Thumbnails ── */}
            {tour.images.length > 1 && (
                <div className="border-b border-[rgba(14,133,178,0.08)] bg-[#F8FCFF] px-6 py-3">
                    <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto pb-1">
                        {tour.images.map((img, i) => (
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

                    {/* ── Left ── */}
                    <div className="lg:col-span-2 flex flex-col gap-10">

                        {/* Overview */}
                        <section>
                            <h2 className="mb-4 text-2xl font-semibold text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif" }}>Overview</h2>
                            <p className="text-base font-light leading-relaxed text-[#1A6A8A] whitespace-pre-line">{tour.description}</p>
                        </section>

                        {/* Route map */}
                        {mappedDays.length >= 2 && (
                            <section>
                                <h2 className="mb-4 text-2xl font-semibold text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif" }}>Route map</h2>
                                <TourRouteMap itinerary={tour.itinerary} tourTitle={tour.title}/>
                            </section>
                        )}

                        {/* Itinerary */}
                        {tour.itinerary.length > 0 && (
                            <section>
                                <h2 className="mb-5 text-2xl font-semibold text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif" }}>Day-by-day itinerary</h2>
                                <div className="flex flex-col gap-2">
                                    {tour.itinerary.map((day, i) => {
                                        const hasLocation = day.latitude && day.longitude && Number(day.latitude) !== 0;
                                        return (
                                            <div key={i} className="overflow-hidden rounded-xl border border-[rgba(14,133,178,0.10)]">
                                                {i > 0 && day.transportMode && (
                                                    <div className="flex items-center gap-2 border-b border-[rgba(14,133,178,0.06)] bg-white px-5 py-2">
                                                        <div className="h-px flex-1 bg-[rgba(14,133,178,0.10)]"/>
                                                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold ${TRANSPORT_COLORS[day.transportMode] ?? "bg-slate-50 text-slate-600 border-slate-100"}`}>
                                                            {TRANSPORT_ICONS[day.transportMode]} {day.transportMode}
                                                        </span>
                                                        <div className="h-px flex-1 bg-[rgba(14,133,178,0.10)]"/>
                                                    </div>
                                                )}
                                                <button type="button" onClick={() => setActiveDay(activeDay === i ? null : i)}
                                                        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#F8FCFF]">
                                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#28B8E8] to-[#0A6A94] text-xs font-bold text-white">{i+1}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-[0.72rem] font-bold uppercase tracking-wider text-[#1E9DC8]">Day {i+1}</span>
                                                        <p className="text-sm font-semibold text-[#0A3D52] truncate">{day.title}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        {hasLocation && (
                                                            <span className="flex items-center gap-1 rounded-full bg-[#EBF8FF] px-2 py-0.5 text-[0.6rem] font-semibold text-[#1E9DC8]">
                                                                <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 1C3.34 1 2 2.34 2 4c0 2.54 3 6 3 6s3-3.46 3-6c0-1.66-1.34-3-3-3z"/><circle cx="5" cy="4" r="1"/></svg>
                                                                pinned
                                                            </span>
                                                        )}
                                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#1A6A8A" strokeWidth="1.8" strokeLinecap="round"
                                                             className={`transition-transform duration-200 ${activeDay === i ? "rotate-180" : ""}`}>
                                                            <path d="M4 6l4 4 4-4"/>
                                                        </svg>
                                                    </div>
                                                </button>
                                                {activeDay === i && (
                                                    <div className="border-t border-[rgba(14,133,178,0.08)] bg-[#F8FCFF] px-5 py-4 pl-[4.25rem]">
                                                        <p className="text-sm font-light leading-relaxed text-[#1A6A8A]">{day.description}</p>
                                                        {hasLocation && (
                                                            <a href={`https://www.google.com/maps?q=${day.latitude},${day.longitude}`}
                                                               target="_blank" rel="noopener noreferrer"
                                                               className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#1E9DC8] hover:underline">
                                                                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 1C4.34 1 3 2.34 3 4c0 2.54 3 7 3 7s3-4.46 3-7c0-1.66-1.34-3-3-3z"/><circle cx="6" cy="4" r="1"/></svg>
                                                                View on Google Maps ↗
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Includes / Excludes */}
                        {(tour.includes.length > 0 || tour.excludes.length > 0) && (
                            <section>
                                <h2 className="mb-5 text-2xl font-semibold text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif" }}>What's included</h2>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    {tour.includes.length > 0 && (
                                        <div className="rounded-xl border border-[rgba(14,133,178,0.10)] bg-[#F8FCFF] p-5">
                                            <p className="mb-3 text-sm font-bold text-emerald-700">Included ✓</p>
                                            <ul className="flex flex-col gap-2">
                                                {tour.includes.map((item, i) => (
                                                    <li key={i} className="flex items-start gap-2.5 text-sm font-light text-[#1A6A8A]">
                                                        <svg className="mt-0.5 flex-shrink-0 text-emerald-500" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 7l4 4 6-6"/></svg>
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {tour.excludes.length > 0 && (
                                        <div className="rounded-xl border border-[rgba(14,133,178,0.10)] bg-white p-5">
                                            <p className="mb-3 text-sm font-bold text-red-600">Not included ✗</p>
                                            <ul className="flex flex-col gap-2">
                                                {tour.excludes.map((item, i) => (
                                                    <li key={i} className="flex items-start gap-2.5 text-sm font-light text-[#1A6A8A]">
                                                        <svg className="mt-0.5 flex-shrink-0 text-red-400" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg>
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Destinations */}
                        {destinations.length > 0 && (
                            <section>
                                <h2 className="mb-4 text-2xl font-semibold text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif" }}>Destinations covered</h2>
                                <div className="flex flex-wrap gap-2">
                                    {destinations.map(d => (
                                        <Link key={d.id} href={`/destinations/${d.id}`}
                                              className="flex items-center gap-1.5 rounded-full border border-[rgba(14,133,178,0.18)] bg-[#F8FCFF] px-4 py-1.5 text-sm font-medium text-[#1E9DC8] transition-all hover:border-[#1E9DC8] hover:bg-[#EBF8FF]">
                                            <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M7 1C4.79 1 3 2.79 3 5c0 3.18 4 8 4 8s4-4.82 4-8c0-2.21-1.79-4-4-4z"/><circle cx="7" cy="5" r="1.2"/></svg>
                                            {d.name}
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Operator */}
                        {operator && (
                            <section>
                                <h2 className="mb-4 text-2xl font-semibold text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif" }}>Your guide & operator</h2>
                                <div className="flex items-start gap-4 rounded-2xl border border-[rgba(14,133,178,0.12)] p-5">
                                    <div className="flex-shrink-0">
                                        {operator.photoURL ? (
                                            <img src={operator.photoURL} alt={operator.name} className="h-14 w-14 rounded-full object-cover"/>
                                        ) : (
                                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#28B8E8] to-[#0A6A94] text-xl font-bold text-white">
                                                {operator.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-base font-semibold text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif" }}>{operator.name}</p>
                                        {operator.nationality && <p className="text-sm font-light text-[#1A6A8A]">{operator.nationality}</p>}
                                        {operator.createdAt && <p className="mt-1 text-xs text-[#1A6A8A]">On Tizitaw since {fmtDate(operator.createdAt)}</p>}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Reviews */}
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
                                        <div className="flex-shrink-0 text-center">
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
                    <div className="lg:sticky lg:top-24 flex flex-col gap-5 self-start">

                        {/* Booking card */}
                        <div className="rounded-2xl border border-[rgba(14,133,178,0.15)] bg-white p-5 shadow-[0_8px_32px_rgba(14,133,178,0.10)]">
                            <div className="mb-1 flex items-baseline gap-1.5">
                                <span className="text-3xl font-bold text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif" }}>
                                    ${tour.priceUSD.toLocaleString()}
                                </span>
                                <span className="text-sm font-light text-[#1A6A8A]">per person</span>
                            </div>
                            {tour.priceETB > 0 && <p className="mb-4 text-sm text-[#1A6A8A]">ETB {tour.priceETB.toLocaleString()}</p>}

                            <div className="mb-5 flex flex-col gap-2 rounded-xl bg-[#F8FCFF] p-4">
                                {[
                                    { icon:<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="5.5"/><path d="M7 4v3l2 2"/></svg>, label:"Duration", value:`${tour.durationDays} day${tour.durationDays!==1?"s":""}` },
                                    { icon:<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2.5 5.5a2 2 0 1 1 4 0 2 2 0 0 1-4 0zM1 12c0-2 1.8-3.5 3.5-3.5S8 10 8 12M9 4a2 2 0 1 1 0 4M11.5 12c0-1.5-1-2.8-2.5-3.3"/></svg>, label:"Group size", value:`${tour.groupSizeMin}–${tour.groupSizeMax} people` },
                                    { icon:<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M7 1C4.79 1 3 2.79 3 5c0 3.18 4 8 4 8s4-4.82 4-8c0-2.21-1.79-4-4-4z"/><circle cx="7" cy="5" r="1.2"/></svg>, label:"Destinations", value:`${tour.destinationIds.length} stop${tour.destinationIds.length!==1?"s":""}` },
                                ].map(({ icon, label, value }) => (
                                    <div key={label} className="flex items-center justify-between">
                                        <span className="flex items-center gap-1.5 text-sm text-[#1A6A8A]"><span className="text-[#1E9DC8]">{icon}</span>{label}</span>
                                        <span className="text-sm font-semibold text-[#0A3D52]">{value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Book + Save buttons */}
                            <Link href={`/bookings/new?tourId=${tour.id}`}
                                  className="mb-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#28B8E8] to-[#0A6A94] px-6 py-3.5 text-sm font-bold text-white transition-all hover:shadow-[0_8px_24px_rgba(14,133,178,0.40)] hover:-translate-y-0.5">
                                Book this tour
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 7h10M8 3l4 4-4 4"/></svg>
                            </Link>
                            <div className="flex justify-center">
                                <SaveButton tourId={tour.id} tourTitle={tour.title}/>
                            </div>

                            <p className="mt-2 text-center text-xs font-light text-[#1A6A8A]">No payment required to reserve</p>
                        </div>

                        {/* Categories */}
                        {tour.categories.length > 0 && (
                            <div className="rounded-2xl border border-[rgba(14,133,178,0.10)] bg-white p-5">
                                <p className="mb-3 text-sm font-semibold text-[#0A3D52]">Tour type</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {tour.categories.map(c => (
                                        <span key={c} className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${TAG_STYLES[c] ?? "bg-[#EBF8FF] text-[#1A6A8A]"}`}>{c}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Share */}
                        <div className="rounded-2xl border border-[rgba(14,133,178,0.10)] bg-white p-5">
                            <p className="mb-3 text-sm font-semibold text-[#0A3D52]">Share this tour</p>
                            <button onClick={async () => { await navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}
                                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[rgba(14,133,178,0.18)] px-3 py-2 text-xs font-medium text-[#1A6A8A] transition-all hover:bg-[#EBF8FF]">
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M8.5 2.5h3v3M13 1l-5 5M5.5 3H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V8.5"/></svg>
                                Copy link
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}