"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useTransition, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Dropdown, { DropdownOption } from "@/src/components/ui/Dropdown";

type Tour = {
    id: string; title: string; slug: string; operatorId: string;
    priceUSD: number; priceETB: number; durationDays: number;
    avgRating: number; reviewCount: number; bookingCount: number;
    isFeatured: boolean; categories: string[]; images: string[];
    description: string;
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

const CAT_GRADIENTS: Record<string, string> = {
    culture:   "from-blue-50 to-blue-100",
    nature:    "from-emerald-50 to-emerald-100",
    adventure: "from-amber-50 to-orange-100",
    religious: "from-violet-50 to-violet-100",
};

const DURATION_BADGES = [
    { value: "all", label: "Any", icon: "🗓" },
    { value: "1-3", label: "1–3 days", icon: "⚡" },
    { value: "4-7", label: "4–7 days", icon: "🌄" },
    { value: "8+",  label: "8+ days",  icon: "🏕" },
];

function buildParams(base: Record<string, string>, patch: Record<string, string | undefined>) {
    const merged = { ...base, ...patch, page: "1" };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) {
        if (v && v !== "all" && v !== "" && v !== "0") params.set(k, v);
    }
    return params.toString();
}

function useReveal(threshold = 0.08) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current; if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
            { threshold }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);
    return { ref, visible };
}

function useCountUp(target: number, active: boolean) {
    const [v, setV] = useState(0);
    useEffect(() => {
        if (!active) return;
        const t0 = performance.now();
        const tick = (now: number) => {
            const p = Math.min((now - t0) / 1400, 1);
            const e = 1 - Math.pow(1 - p, 3);
            setV(Math.round(e * target));
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [active, target]);
    return v;
}

// ── HERO BACKGROUND — jeep on savanna ────────────────────────────────────────
function HeroBackground() {
    const [t, setT] = useState(0);
    const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

    useEffect(() => {
        let id: number;
        const tick = (now: number) => { setT(now); id = requestAnimationFrame(tick); };
        id = requestAnimationFrame(tick);
        const onMouse = (e: MouseEvent) => setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
        window.addEventListener("mousemove", onMouse, { passive: true });
        return () => { cancelAnimationFrame(id); window.removeEventListener("mousemove", onMouse); };
    }, []);

    // Jeep state
    const [jx, setJx] = useState(-130);
    const [jy, setJy] = useState(0);
    const [wheel, setWheel] = useState(0);
    useEffect(() => {
        let id: number;
        const tick = (now: number) => {
            const W = window.innerWidth;
            const dur = 20000;
            const p = (now % dur) / dur;
            setJx(-130 + p * (W + 260));
            setJy(Math.sin(p * Math.PI * 8) * 4 + Math.sin(p * Math.PI * 15) * 1.5);
            setWheel((now / 55) % 360);
            id = requestAnimationFrame(tick);
        };
        id = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(id);
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Savanna gradient tint */}
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,rgba(255,248,225,0.45) 0%,transparent 60%)" }}/>

            {/* Parallax orbs */}
            {[
                { cx:0.08, cy:0.25, size:360, depth:16, color:"rgba(40,184,232,0.09)",  phase:0  },
                { cx:0.82, cy:0.08, size:480, depth:26, color:"rgba(14,133,178,0.07)",  phase:2  },
                { cx:0.5,  cy:0.75, size:280, depth:12, color:"rgba(40,184,232,0.08)",  phase:4  },
                { cx:0.95, cy:0.55, size:200, depth:20, color:"rgba(10,106,148,0.06)",  phase:1  },
            ].map((orb, i) => {
                const floatY = Math.sin(t * 0.0004 + orb.phase) * 14;
                const mx = (mouse.x - orb.cx) * orb.depth;
                const my = (mouse.y - orb.cy) * orb.depth;
                return (
                    <div key={i} style={{
                        position:"absolute", left:`${orb.cx*100}%`, top:`${orb.cy*100}%`,
                        width:orb.size, height:orb.size, borderRadius:"50%",
                        background:`radial-gradient(circle,${orb.color} 0%,transparent 70%)`,
                        transform:`translate(calc(-50% + ${mx}px),calc(-50% + ${floatY+my}px))`,
                        transition:"transform 0.15s ease-out",
                    }}/>
                );
            })}

            {/* Dot grid */}
            <div style={{
                position:"absolute", inset:0,
                backgroundImage:"radial-gradient(circle,rgba(14,133,178,0.11) 1px,transparent 1px)",
                backgroundSize:"32px 32px",
                WebkitMaskImage:"radial-gradient(ellipse 90% 100% at 50% 0%,black 30%,transparent 100%)",
                maskImage:"radial-gradient(ellipse 90% 100% at 50% 0%,black 30%,transparent 100%)",
                transform:`translate(${(mouse.x-0.5)*-8}px,${(mouse.y-0.5)*-4}px)`,
                transition:"transform 0.2s ease-out",
            }}/>

            {/* Acacia trees */}
            {[{x:"5%",s:0.55,o:0.10},{x:"20%",s:0.80,o:0.08},{x:"45%",s:0.60,o:0.07},{x:"65%",s:0.85,o:0.09},{x:"82%",s:0.65,o:0.08}].map((tr,i)=>(
                <svg key={i} style={{ position:"absolute", bottom:"14%", left:tr.x, opacity:tr.o, transform:`scale(${tr.s})`, transformOrigin:"bottom center" }} width="65" height="70" viewBox="0 0 65 70">
                    <line x1="32" y1="70" x2="32" y2="30" stroke="#92400E" strokeWidth="4"/>
                    <line x1="32" y1="48" x2="14" y2="36" stroke="#92400E" strokeWidth="2.5"/>
                    <line x1="32" y1="42" x2="50" y2="30" stroke="#92400E" strokeWidth="2.5"/>
                    <ellipse cx="32" cy="24" rx="28" ry="20" fill="#065F46"/>
                    <ellipse cx="16" cy="33" rx="15" ry="11" fill="#065F46"/>
                    <ellipse cx="48" cy="32" rx="16" ry="12" fill="#065F46"/>
                </svg>
            ))}

            {/* Ground strip */}
            <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"20%", background:"linear-gradient(180deg,transparent,rgba(253,230,138,0.22))" }}/>

            {/* Arc lines */}
            <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.05 }}>
                <ellipse cx="80%" cy="0" rx="380" ry="260" fill="none" stroke="#1E9DC8" strokeWidth="1"/>
                <ellipse cx="80%" cy="0" rx="520" ry="380" fill="none" stroke="#1E9DC8" strokeWidth="0.5"/>
                <ellipse cx="5%"  cy="100%" rx="280" ry="180" fill="none" stroke="#1E9DC8" strokeWidth="0.8"/>
            </svg>

            {/* JEEP */}
            <svg style={{ position:"absolute", bottom:"14%", left:jx, transform:`translateY(${jy}px)`, opacity:0.25 }} width="120" height="68" viewBox="0 0 120 68">
                <rect x="8" y="20" width="104" height="34" rx="5" fill="#0A3D52"/>
                <rect x="20" y="10" width="68" height="24" rx="4" fill="#0E85B2"/>
                <rect x="26" y="13" width="22" height="16" rx="2.5" fill="rgba(235,248,255,0.85)"/>
                <rect x="54" y="13" width="28" height="16" rx="2.5" fill="rgba(235,248,255,0.85)"/>
                <rect x="22" y="8" width="66" height="5" rx="2" fill="#28B8E8" opacity="0.55"/>
                <rect x="106" y="28" width="10" height="10" rx="2" fill="#FEF3C7"/>
                <circle cx="30" cy="58" r="12" fill="#1A1A2E"/>
                <circle cx="30" cy="58" r="5" fill="#0A3D52" transform={`rotate(${wheel} 30 58)`}/>
                <circle cx="90" cy="58" r="12" fill="#1A1A2E"/>
                <circle cx="90" cy="58" r="5" fill="#0A3D52" transform={`rotate(${wheel} 90 58)`}/>
                <ellipse cx="-10" cy="56" rx="12" ry="7" fill="rgba(146,64,14,0.25)"/>
                <ellipse cx="-26" cy="54" rx="17" ry="10" fill="rgba(146,64,14,0.15)"/>
                <ellipse cx="-46" cy="51" rx="22" ry="12" fill="rgba(146,64,14,0.08)"/>
            </svg>
        </div>
    );
}

// ── STAT PILL ─────────────────────────────────────────────────────────────────
function StatPill({ icon, target, suffix, label, delay = 0 }: {
    icon: string; target: number; suffix?: string; label: string; delay?: number;
}) {
    const { ref, visible } = useReveal();
    const v = useCountUp(target, visible);
    return (
        <div ref={ref} className="flex items-center gap-3 rounded-2xl border border-[rgba(14,133,178,0.14)] bg-white/80 px-4 py-3 backdrop-blur-sm shadow-[0_4px_20px_rgba(14,133,178,0.08)]"
             style={{ opacity:visible?1:0, transform:visible?"translateY(0) scale(1)":"translateY(20px) scale(0.95)", transition:`opacity 0.6s ease ${delay}ms,transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}ms` }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#EBF8FF] to-[#D6F0FA] text-xl flex-shrink-0">{icon}</div>
            <div>
                <div className="text-base font-bold text-[#0A3D52] leading-tight tabular-nums">{v}{suffix ?? ""}</div>
                <div className="text-[0.63rem] font-light text-[#1A6A8A] uppercase tracking-wider">{label}</div>
            </div>
        </div>
    );
}

// ── DURATION STRIP ────────────────────────────────────────────────────────────
function DurationStrip({ active, onChange }: { active: string; onChange: (v: string) => void }) {
    const { ref, visible } = useReveal();
    return (
        <div ref={ref} className="flex gap-2 flex-wrap"
             style={{ opacity:visible?1:0, transform:visible?"translateY(0)":"translateY(16px)", transition:"opacity 0.6s ease,transform 0.6s ease" }}>
            {DURATION_BADGES.map((d, i) => {
                const isActive = active === d.value;
                return (
                    <button key={d.value} onClick={() => onChange(d.value)}
                            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
                            style={{
                                background: isActive ? "linear-gradient(135deg,#28B8E8,#0A6A94)" : "rgba(255,255,255,0.9)",
                                color: isActive ? "#fff" : "#1A6A8A",
                                border: isActive ? "none" : "1px solid rgba(14,133,178,0.14)",
                                boxShadow: isActive ? "0 4px 16px rgba(14,133,178,0.35)" : "0 2px 8px rgba(14,133,178,0.06)",
                                transform: isActive ? "translateY(-2px)" : "none",
                                backdropFilter:"blur(8px)",
                                opacity: visible ? 1 : 0,
                                transition:`all 0.2s ease,opacity 0.5s ease ${i*50}ms`,
                            }}>
                        <span className="text-base leading-none">{d.icon}</span>
                        <span className="whitespace-nowrap">{d.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

// ── TOUR CARD ─────────────────────────────────────────────────────────────────
function TourCard({ tour, delay }: { tour: Tour; delay: number }) {
    const { ref, visible } = useReveal();
    const [hovered, setHovered] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
    const cardRef = useRef<HTMLAnchorElement>(null);

    const onMouseMove = (e: React.MouseEvent) => {
        const el = cardRef.current; if (!el) return;
        const r = el.getBoundingClientRect();
        setMousePos({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
    };

    const tiltX = hovered ? (mousePos.y - 0.5) * -10 : 0;
    const tiltY = hovered ? (mousePos.x - 0.5) * 10 : 0;
    const catGradient = CAT_GRADIENTS[tour.categories[0]] ?? "from-[#EBF8FF] to-[#D6F0FA]";

    return (
        <div ref={ref} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(36px)",
            transition: `opacity 0.65s ease ${delay}ms,transform 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
            perspective: 1000,
        }}>
            <Link
                ref={cardRef}
                href={`/tours/${tour.id}`}
                className="group relative flex flex-col overflow-hidden rounded-2xl bg-white no-underline block"
                style={{
                    border: hovered ? "1px solid rgba(14,133,178,0.28)" : "1px solid rgba(14,133,178,0.10)",
                    boxShadow: hovered
                        ? "0 28px 60px rgba(14,133,178,0.18),0 8px 20px rgba(14,133,178,0.10)"
                        : "0 2px 12px rgba(14,133,178,0.06)",
                    transform: hovered
                        ? `translateY(-10px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.01)`
                        : "translateY(0) rotateX(0) rotateY(0) scale(1)",
                    transformStyle: "preserve-3d",
                    transition: "transform 0.25s cubic-bezier(0.22,1,0.36,1),box-shadow 0.25s,border-color 0.25s",
                }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => { setHovered(false); setMousePos({ x:0.5, y:0.5 }); }}
                onMouseMove={onMouseMove}
            >
                {/* Featured ribbon */}
                {tour.isFeatured && (
                    <div style={{
                        position:"absolute", left:0, top:14, zIndex:10,
                        background:"linear-gradient(135deg,#28B8E8,#0A6A94)",
                        color:"#fff", fontSize:"0.62rem", fontWeight:700,
                        letterSpacing:"0.08em", padding:"0.28rem 0.75rem",
                        borderRadius:"0 6px 6px 0", textTransform:"uppercase",
                        boxShadow:"0 2px 8px rgba(14,133,178,0.35)",
                        transform: hovered ? "translateX(2px)" : "none",
                        transition: "transform 0.2s ease",
                    }}>
                        ⭐ Featured
                    </div>
                )}

                {/* Image */}
                <div className={`relative flex h-52 items-center justify-center overflow-hidden bg-gradient-to-br ${catGradient} text-5xl`}>
                    {tour.images?.length > 0 ? (
                        <img src={tour.images[0]} alt={tour.title}
                             className="absolute inset-0 h-full w-full object-cover"
                             loading="lazy"
                             style={{ transform:hovered?"scale(1.08)":"scale(1)", transition:"transform 0.6s cubic-bezier(0.22,1,0.36,1)" }}/>
                    ) : (
                        <span style={{ transform:hovered?"scale(1.2) rotate(-8deg)":"scale(1)", transition:"transform 0.4s cubic-bezier(0.22,1,0.36,1)", display:"block" }}>
              {CAT_ICONS[tour.categories[0]] ?? "🧭"}
            </span>
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(6,62,90,0.05)] to-[rgba(6,62,90,0.65)]"/>

                    {/* Mouse glare */}
                    {hovered && (
                        <div style={{
                            position:"absolute", inset:0, pointerEvents:"none",
                            background:`radial-gradient(circle at ${mousePos.x*100}% ${mousePos.y*100}%,rgba(255,255,255,0.15) 0%,transparent 60%)`,
                            transition:"background 0.1s",
                        }}/>
                    )}

                    {/* Category tags */}
                    <div className="absolute left-3 top-3 flex gap-1.5">
                        {tour.categories.slice(0, 2).map(c => (
                            <span key={c} className="rounded-full bg-black/30 px-2.5 py-0.5 text-[0.60rem] font-bold uppercase tracking-wide text-white backdrop-blur-sm">{c}</span>
                        ))}
                    </div>

                    {/* Duration + bookings badges */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                        {tour.bookingCount > 0 && (
                            <div className="flex items-center gap-1 rounded-md bg-amber-500/85 px-2 py-0.5 text-[0.62rem] font-bold text-white backdrop-blur-sm">
                                🔥 {tour.bookingCount} booked
                            </div>
                        )}
                        <div className="flex items-center gap-1 rounded-md bg-[rgba(6,62,90,0.75)] px-2 py-0.5 text-[0.65rem] font-bold text-white backdrop-blur-sm">
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                <circle cx="6" cy="6" r="4.5"/><path d="M6 3.5V6l1.5 1.5"/>
                            </svg>
                            {tour.durationDays}d
                        </div>
                    </div>

                    {/* Title overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4"
                         style={{ transform:hovered?"translateY(-3px)":"translateY(0)", transition:"transform 0.3s ease" }}>
                        <h2 className="text-lg font-bold text-white leading-tight" style={{ fontFamily:"'Playfair Display',serif", letterSpacing:"-0.01em" }}>
                            {tour.title}
                        </h2>
                    </div>
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col p-5">
                    <p className="mb-4 line-clamp-2 flex-1 text-sm font-light leading-relaxed text-[#1A6A8A]">
                        {tour.description}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-[#EBF8FF] pt-3">
                        <div className="flex items-center gap-1 text-sm font-bold text-[#0A3D52]">
                            {tour.avgRating > 0 ? (
                                <>
                                    {[1,2,3,4,5].map(s=>(
                                        <span key={s} className="text-xs" style={{ color:s<=Math.round(tour.avgRating)?"#F59E0B":"rgba(14,133,178,0.2)" }}>★</span>
                                    ))}
                                    <span className="ml-1">{tour.avgRating.toFixed(1)}</span>
                                    <span className="font-light text-[#1A6A8A] text-xs ml-0.5">({tour.reviewCount})</span>
                                </>
                            ) : (
                                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">✨ New tour</span>
                            )}
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[0.62rem] font-light text-[#1A6A8A]">from</span>
                            <span className="text-lg font-bold text-[#1E9DC8]" style={{ transition:"color 0.2s", color:hovered?"#0A6A94":"#1E9DC8" }}>
                ${tour.priceUSD.toLocaleString()}
              </span>
                        </div>
                    </div>
                </div>

                {/* Hover CTA strip */}
                <div style={{
                    padding: hovered ? "0.65rem 1.25rem" : "0 1.25rem",
                    maxHeight: hovered ? "48px" : "0px",
                    overflow:"hidden",
                    background:"linear-gradient(135deg,#28B8E8,#0A6A94)",
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    transition:"max-height 0.3s cubic-bezier(0.22,1,0.36,1),padding 0.3s ease",
                }}>
                    <span className="text-xs font-bold text-white">Book this tour</span>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                        <path d="M2 7h10M8 3l4 4-4 4"/>
                    </svg>
                </div>

                {/* Bottom bar */}
                <div className="h-[3px] w-full bg-gradient-to-r from-[#28B8E8] via-[#1E9DC8] to-[#0A6A94]"
                     style={{ transform:hovered?"scaleX(1)":"scaleX(0)", transformOrigin:"left", transition:"transform 0.4s cubic-bezier(0.22,1,0.36,1)" }}/>
            </Link>
        </div>
    );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function ToursPublicClient({
                                              tours, total, page, perPage,
                                              category, duration, maxPrice, sort,
                                              categories, durations,
                                          }: {
    tours: Tour[]; total: number; page: number; perPage: number;
    category: string; duration: string; maxPrice: number; sort: string;
    categories: string[]; durations: string[];
}) {
    const router   = useRouter();
    const pathname = usePathname();
    const [pending, startTransition] = useTransition();
    const heroReveal = useReveal();

    const baseParams = { category, duration, sort, maxPrice: maxPrice > 0 ? String(maxPrice) : "" };

    const push = useCallback((patch: Record<string, string | undefined>) => {
        startTransition(() => router.push(`${pathname}?${buildParams(baseParams, patch)}`));
    }, [category, duration, maxPrice, sort, pathname, router]);

    const totalPages = Math.ceil(total / perPage);

    const categoryOptions: DropdownOption[] = [
        { label: "All categories", value: "all" },
        ...categories.map(c => ({ label: c.charAt(0).toUpperCase() + c.slice(1), value: c })),
    ];
    const sortOptions: DropdownOption[] = [
        { label: "Featured first",  value: "featured"   },
        { label: "Highest rated",   value: "rating"     },
        { label: "Price: low→high", value: "price_asc"  },
        { label: "Price: high→low", value: "price_desc" },
        { label: "Shortest first",  value: "duration"   },
    ];
    const priceOptions: DropdownOption[] = [
        { label: "Any price",    value: "0"    },
        { label: "Under $200",   value: "200"  },
        { label: "Under $500",   value: "500"  },
        { label: "Under $1,000", value: "1000" },
        { label: "Under $2,000", value: "2000" },
    ];

    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
        .reduce<(number | "…")[]>((acc, p, i, arr) => {
            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
            acc.push(p);
            return acc;
        }, []);

    const activeFiltersCount = [category !== "all", duration !== "all", maxPrice > 0].filter(Boolean).length;

    return (
        <div className="min-h-screen bg-white">
            <style>{`
        .hide-scrollbar::-webkit-scrollbar{display:none}
        .hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.8)}}
        @keyframes bounce-gentle{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
      `}</style>

            {/* ── HERO ── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#EBF8FF] via-white to-[#EBF8FF] px-6 pb-16 pt-28 border-b border-[rgba(14,133,178,0.08)]">
                <HeroBackground />
                <div className="relative mx-auto max-w-6xl">
                    <div ref={heroReveal.ref} style={{ opacity:heroReveal.visible?1:0, transform:heroReveal.visible?"translateY(0)":"translateY(24px)", transition:"opacity 0.8s ease,transform 0.8s ease" }}>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(14,133,178,0.18)] bg-[#EBF8FF] px-4 py-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#1E9DC8] inline-block" style={{ animation:"pulse 2s infinite" }}/>
                            <span className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#1E9DC8]">Curated experiences</span>
                        </div>
                        <h1 className="mb-4 leading-tight text-[#0A3D52]"
                            style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(2.4rem,5vw,3.6rem)", fontWeight:700, letterSpacing:"-0.025em" }}>
                            Find your perfect<br/><em className="italic text-[#1E9DC8]">Ethiopia tour</em>
                        </h1>
                        <p className="max-w-lg text-base font-light leading-relaxed text-[#1A6A8A]">
                            Expert-guided tours across every corner of Ethiopia — from single-day cultural walks to multi-week wilderness expeditions.
                        </p>
                    </div>

                    {/* Stat pills */}
                    <div className="mt-10 flex flex-wrap gap-3">
                        <StatPill icon="🧭" target={total}  suffix="+" label="Tours"          delay={100}/>
                        <StatPill icon="👥" target={120}    suffix="+"  label="Expert guides"  delay={200}/>
                        <StatPill icon="⭐" target={49} suffix="/50"    label="Avg rating"     delay={300}/>
                        <StatPill icon="🌍" target={8}               label="Regions covered"  delay={400}/>
                    </div>
                </div>
            </div>

            {/* ── DURATION STRIP ── */}
            <div className="border-b border-[rgba(14,133,178,0.07)] bg-gradient-to-r from-[#F8FCFF] to-white px-6 py-4">
                <div className="mx-auto max-w-6xl">
                    <DurationStrip active={duration} onChange={v => push({ duration: v })} />
                </div>
            </div>

            {/* ── STICKY FILTERS ── */}
            <div className="sticky top-16 z-40 border-b border-[rgba(14,133,178,0.08)] bg-white/96 px-6 py-3 shadow-[0_2px_20px_rgba(14,133,178,0.07)] backdrop-blur-lg">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
                    <Dropdown options={categoryOptions} value={category}        onChange={v => push({ category: v })}  width="w-40"/>
                    <Dropdown options={priceOptions}    value={String(maxPrice)} onChange={v => push({ maxPrice: v })} width="w-40"/>
                    <div className="h-6 w-px bg-[rgba(14,133,178,0.12)]"/>
                    <Dropdown options={sortOptions}     value={sort}             onChange={v => push({ sort: v })}     width="w-44"/>

                    {activeFiltersCount > 0 && (
                        <button onClick={() => push({ category:"all", duration:"all", maxPrice:"0" })}
                                className="flex items-center gap-1.5 rounded-full bg-[#1E9DC8] px-3 py-1 text-[0.7rem] font-bold text-white transition-all hover:bg-[#0E85B2]">
                            {activeFiltersCount} active
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M2 2l6 6M8 2L2 8"/>
                            </svg>
                        </button>
                    )}

                    <span className="ml-auto text-xs font-light text-[#1A6A8A]">{total} tour{total !== 1 ? "s" : ""}</span>
                </div>
            </div>

            {/* ── GRID ── */}
            <div className="mx-auto max-w-6xl px-6 pb-24 pt-10">
                <div className="relative">
                    {/* Loading overlay */}
                    <div className={`absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/75 backdrop-blur-sm transition-opacity duration-300 ${pending?"opacity-100 pointer-events-auto":"opacity-0 pointer-events-none"}`}>
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative h-12 w-12">
                                <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-[rgba(14,133,178,0.12)] border-t-[#1E9DC8]"/>
                                <div className="absolute inset-2 animate-spin rounded-full border-[2px] border-[rgba(14,133,178,0.08)] border-t-[#28B8E8]" style={{ animationDirection:"reverse", animationDuration:"0.7s" }}/>
                            </div>
                            <span className="text-xs font-light text-[#1A6A8A]">Finding tours…</span>
                        </div>
                    </div>

                    {tours.length === 0 ? (
                        <div className="flex flex-col items-center py-28 text-center">
                            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#EBF8FF] to-[#D6F0FA] text-5xl shadow-[0_8px_32px_rgba(14,133,178,0.12)]"
                                 style={{ animation:"bounce-gentle 3s ease-in-out infinite" }}>
                                🧭
                            </div>
                            <p className="mb-2 text-2xl font-semibold text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif" }}>No tours found</p>
                            <p className="mb-8 text-sm font-light text-[#1A6A8A]">Try adjusting your filters or exploring a different duration.</p>
                            <button onClick={() => push({ category:"all", duration:"all", maxPrice:"0" })}
                                    className="rounded-xl bg-gradient-to-r from-[#28B8E8] to-[#0A6A94] px-6 py-3 text-sm font-bold text-white shadow-[0_4px_16px_rgba(14,133,178,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(14,133,178,0.45)]">
                                Clear all filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {tours.map((tour, i) => (
                                <TourCard key={tour.id} tour={tour} delay={Math.min(i % 6, 5) * 70}/>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── PAGINATION ── */}
                {totalPages > 1 && (
                    <nav className="mt-16 flex items-center justify-center gap-1.5" aria-label="Tours pagination">
                        <Link href={`?${buildParams(baseParams,{page:String(page-1)})}`} aria-disabled={page<=1}
                              className={`flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(14,133,178,0.18)] bg-white text-[#1A6A8A] transition-all hover:border-[#1E9DC8] hover:bg-[#EBF8FF] ${page<=1?"pointer-events-none opacity-30":""}`}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 2L4 7l5 5"/></svg>
                        </Link>
                        {pageNumbers.map((p,i) =>
                            p === "…" ? (
                                <span key={`el-${i}`} className="px-1 text-sm text-[#1A6A8A]">…</span>
                            ) : (
                                <Link key={p} href={`?${buildParams(baseParams,{page:String(p)})}`}
                                      aria-current={p===page?"page":undefined}
                                      className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-all ${
                                          p===page
                                              ?"border-transparent bg-gradient-to-br from-[#28B8E8] to-[#0A6A94] font-bold text-white shadow-[0_4px_14px_rgba(14,133,178,0.38)]"
                                              :"border-[rgba(14,133,178,0.18)] bg-white text-[#1A6A8A] hover:border-[#1E9DC8] hover:bg-[#EBF8FF]"
                                      }`}>
                                    {p}
                                </Link>
                            )
                        )}
                        <Link href={`?${buildParams(baseParams,{page:String(page+1)})}`} aria-disabled={page>=totalPages}
                              className={`flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(14,133,178,0.18)] bg-white text-[#1A6A8A] transition-all hover:border-[#1E9DC8] hover:bg-[#EBF8FF] ${page>=totalPages?"pointer-events-none opacity-30":""}`}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 2l5 5-5 5"/></svg>
                        </Link>
                    </nav>
                )}
            </div>
        </div>
    );
}