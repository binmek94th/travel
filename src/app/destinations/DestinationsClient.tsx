"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useTransition, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Dropdown, { DropdownOption } from "@/src/components/ui/Dropdown";

type Destination = {
    id: string; name: string; slug: string; region: string;
    categories: string[]; avgRating: number; reviewCount: number;
    isHiddenGem: boolean; images: string[] ;
    description: string; bestTimeToVisit: string;
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

function buildParams(base: Record<string, string>, patch: Record<string, string | undefined>) {
    const merged = { ...base, ...patch, page: "1" };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) {
        if (v && v !== "all" && v !== "" && v !== "false") params.set(k, v);
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

// ── HERO BACKGROUND ───────────────────────────────────────────────────────────
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

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Parallax orbs responding to mouse */}
            {[
                { cx: 0.1,  cy: 0.3, size: 380, depth: 18, color: "rgba(40,184,232,0.10)", phase: 0   },
                { cx: 0.8,  cy: 0.1, size: 450, depth: 28, color: "rgba(14,133,178,0.08)", phase: 2   },
                { cx: 0.55, cy: 0.7, size: 300, depth: 14, color: "rgba(40,184,232,0.09)", phase: 4   },
                { cx: 0.92, cy: 0.6, size: 220, depth: 22, color: "rgba(10,106,148,0.07)", phase: 1   },
                { cx: 0.3,  cy: 0.85,size: 260, depth: 10, color: "rgba(40,184,232,0.07)", phase: 3   },
            ].map((orb, i) => {
                const floatY = Math.sin(t * 0.0004 + orb.phase) * 16;
                const mx = (mouse.x - orb.cx) * orb.depth;
                const my = (mouse.y - orb.cy) * orb.depth;
                return (
                    <div key={i} style={{
                        position: "absolute",
                        left: `${orb.cx * 100}%`,
                        top: `${orb.cy * 100}%`,
                        width: orb.size, height: orb.size,
                        borderRadius: "50%",
                        background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
                        transform: `translate(calc(-50% + ${mx}px), calc(-50% + ${floatY + my}px))`,
                        transition: "transform 0.15s ease-out",
                    }} />
                );
            })}

            {/* Animated dot grid */}
            <div className="absolute inset-0" style={{
                backgroundImage: "radial-gradient(circle, rgba(14,133,178,0.12) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
                WebkitMaskImage: "radial-gradient(ellipse 90% 100% at 50% 0%, black 30%, transparent 100%)",
                maskImage: "radial-gradient(ellipse 90% 100% at 50% 0%, black 30%, transparent 100%)",
                transform: `translate(${(mouse.x - 0.5) * -8}px, ${(mouse.y - 0.5) * -4}px)`,
                transition: "transform 0.2s ease-out",
            }} />

            {/* Plane */}
            <PlaneAnim />

            {/* Decorative arc lines */}
            <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.06 }}>
                <ellipse cx="75%" cy="0" rx="400" ry="280" fill="none" stroke="#1E9DC8" strokeWidth="1"/>
                <ellipse cx="75%" cy="0" rx="550" ry="400" fill="none" stroke="#1E9DC8" strokeWidth="0.5"/>
                <ellipse cx="10%" cy="100%" rx="300" ry="200" fill="none" stroke="#1E9DC8" strokeWidth="0.8"/>
            </svg>
        </div>
    );
}

function PlaneAnim() {
    const [px, setPx] = useState(-100);
    const [py, setPy] = useState(0);
    const [ptilt, setPtilt] = useState(0);
    useEffect(() => {
        let id: number;
        const tick = (now: number) => {
            const W = window.innerWidth;
            const dur = 20000;
            const p = (now % dur) / dur;
            setPx(-100 + p * (W + 200));
            const path = -Math.sin(p * Math.PI) * 60 + Math.sin(p * Math.PI * 5) * 12;
            setPy(path);
            setPtilt(Math.cos(p * Math.PI) * -8 + Math.cos(p * Math.PI * 5) * 3);
            id = requestAnimationFrame(tick);
        };
        id = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(id);
    }, []);

    return (
        <>
            {px > 0 && (
                <div style={{ position:"absolute", top:"calc(28% + " + py + "px)", left:0, width:px, height:1.5, background:"linear-gradient(90deg,transparent,rgba(14,133,178,0.18))", borderRadius:2, pointerEvents:"none" }}/>
            )}
            <svg style={{ position:"absolute", top:"24%", left:px, transform:`translateY(${py}px) rotate(${ptilt}deg)`, opacity:0.22, transformOrigin:"50px 22px" }} width="110" height="48" viewBox="0 0 110 48">
                <path d="M2 24 Q32 15 78 21 L104 24 L78 27 Q32 33 2 24Z" fill="#0A6A94"/>
                <path d="M30 21 L58 5 L65 11 L40 24Z" fill="#1E9DC8"/>
                <path d="M30 27 L58 43 L65 37 L40 24Z" fill="#28B8E8" opacity="0.8"/>
                <path d="M80 21 L98 12 L100 18 L86 23Z" fill="#1E9DC8"/>
                {[42,53,64].map(cx=><ellipse key={cx} cx={cx} cy="22.5" rx="3.2" ry="2.5" fill="rgba(235,248,255,0.9)"/>)}
            </svg>
        </>
    );
}

// ── STAT PILL WITH COUNT-UP ───────────────────────────────────────────────────
function StatPill({ icon, target, suffix, label, delay = 0 }: {
    icon: string; target: number; suffix?: string; label: string; delay?: number;
}) {
    const { ref, visible } = useReveal();
    const v = useCountUp(target, visible);
    return (
        <div ref={ref} className="flex items-center gap-3 rounded-2xl border border-[rgba(14,133,178,0.14)] bg-white/80 px-4 py-3 backdrop-blur-sm shadow-[0_4px_20px_rgba(14,133,178,0.08)]"
             style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)", transition: `opacity 0.6s ease ${delay}ms, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}ms` }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#EBF8FF] to-[#D6F0FA] text-xl flex-shrink-0">
                {icon}
            </div>
            <div>
                <div className="text-base font-bold text-[#0A3D52] leading-tight tabular-nums">
                    {v}{suffix ?? ""}
                </div>
                <div className="text-[0.63rem] font-light text-[#1A6A8A] uppercase tracking-wider">{label}</div>
            </div>
        </div>
    );
}

// ── REGION STRIP ──────────────────────────────────────────────────────────────
const REGIONS = [
    { name: "All regions", icon: "🌍", value: "all" },
    { name: "Amhara",        icon: "⛪", value: "Amhara" },
    { name: "Tigray",        icon: "🏛", value: "Tigray" },
    { name: "Oromia",        icon: "🌿", value: "Oromia" },
    { name: "Afar",          icon: "🌋", value: "Afar" },
    { name: "Southern Nations", icon: "🐾", value: "Southern Nations" },
    { name: "Addis Ababa",   icon: "🏙", value: "Addis Ababa" },
    { name: "Dire Dawa",     icon: "☀️", value: "Dire Dawa" },
];

function RegionStrip({ active, onChange }: { active: string; onChange: (v: string) => void }) {
    const { ref, visible } = useReveal();
    return (
        <div ref={ref} className="overflow-x-auto pb-2 hide-scrollbar"
             style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}>
            <div className="flex gap-2 min-w-max">
                {REGIONS.map((r, i) => {
                    const isActive = active === r.value;
                    return (
                        <button key={r.value} onClick={() => onChange(r.value)}
                                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
                                style={{
                                    background: isActive ? "linear-gradient(135deg,#28B8E8,#0A6A94)" : "rgba(255,255,255,0.9)",
                                    color: isActive ? "#fff" : "#1A6A8A",
                                    border: isActive ? "none" : "1px solid rgba(14,133,178,0.14)",
                                    boxShadow: isActive ? "0 4px 16px rgba(14,133,178,0.35)" : "0 2px 8px rgba(14,133,178,0.06)",
                                    transform: isActive ? "translateY(-2px)" : "none",
                                    backdropFilter: "blur(8px)",
                                    opacity: visible ? 1 : 0,
                                    transition: `all 0.2s ease, opacity 0.5s ease ${i * 40}ms`,
                                }}>
                            <span className="text-base leading-none">{r.icon}</span>
                            <span className="whitespace-nowrap">{r.name}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ── DESTINATION CARD ──────────────────────────────────────────────────────────
function DestCard({ dest, delay }: { dest: Destination; delay: number }) {
    const { ref, visible } = useReveal();
    const [hovered, setHovered] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
    const cardRef = useRef<HTMLAnchorElement>(null);
    
    // 3D tilt on mouse move
    const onMouseMove = (e: React.MouseEvent) => {
        const el = cardRef.current; if (!el) return;
        const r = el.getBoundingClientRect();
        setMousePos({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
    };

    const tiltX = hovered ? (mousePos.y - 0.5) * -10 : 0;
    const tiltY = hovered ? (mousePos.x - 0.5) * 10 : 0;
    const glareX = mousePos.x * 100;
    const glareY = mousePos.y * 100;

    const catGradient = CAT_GRADIENTS[dest.categories[0]] ?? "from-[#EBF8FF] to-[#D6F0FA]";

    return (
        <div ref={ref} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(36px)",
            transition: `opacity 0.65s ease ${delay}ms, transform 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
            perspective: 1000,
        }}>
            <Link
                ref={cardRef}
                href={`/destinations/${dest.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl bg-white no-underline block"
                style={{
                    border: hovered ? "1px solid rgba(14,133,178,0.28)" : "1px solid rgba(14,133,178,0.10)",
                    boxShadow: hovered
                        ? "0 28px 60px rgba(14,133,178,0.18), 0 8px 20px rgba(14,133,178,0.10)"
                        : "0 2px 12px rgba(14,133,178,0.06)",
                    transform: hovered
                        ? `translateY(-10px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.01)`
                        : "translateY(0) rotateX(0) rotateY(0) scale(1)",
                    transformStyle: "preserve-3d",
                    transition: "transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s, border-color 0.25s",
                }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => { setHovered(false); setMousePos({ x: 0.5, y: 0.5 }); }}
                onMouseMove={onMouseMove}
            >
                {/* Image */}
                <div className={`relative flex h-52 items-center justify-center overflow-hidden bg-gradient-to-br ${catGradient} text-5xl`}>
                    {dest.images?.length > 0 ? (
                        <img src={dest.images[0]} alt={dest.name}
                             className="absolute inset-0 h-full w-full object-cover"
                             loading="lazy"
                             style={{ transform: hovered ? "scale(1.08)" : "scale(1)", transition: "transform 0.6s cubic-bezier(0.22,1,0.36,1)" }} />
                    ) : (
                        <span style={{ transform: hovered ? "scale(1.2) rotate(-8deg)" : "scale(1)", transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1)", display: "block" }}>
              {CAT_ICONS[dest.categories[0]] ?? "📍"}
            </span>
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(6,62,90,0.05)] to-[rgba(6,62,90,0.65)]" />

                    {/* Mouse glare effect */}
                    {hovered && (
                        <div style={{
                            position: "absolute", inset: 0, pointerEvents: "none",
                            background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
                            transition: "background 0.1s",
                        }} />
                    )}

                    {/* Hidden gem badge */}
                    {dest.isHiddenGem && (
                        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[0.65rem] font-bold text-amber-700 shadow-sm backdrop-blur-sm"
                             style={{ transform: hovered ? "scale(1.05)" : "scale(1)", transition: "transform 0.2s" }}>
                            💎 Hidden gem
                        </div>
                    )}

                    {/* Category tags on image */}
                    <div className="absolute left-3 top-3 flex gap-1.5">
                        {dest.categories.slice(0, 2).map(c => (
                            <span key={c} className="rounded-full bg-black/30 px-2.5 py-0.5 text-[0.60rem] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                {c}
              </span>
                        ))}
                    </div>

                    {/* Name + region overlay at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-4"
                         style={{ transform: hovered ? "translateY(-3px)" : "translateY(0)", transition: "transform 0.3s ease" }}>
                        <h2 className="text-lg font-bold text-white leading-tight mb-0.5" style={{ fontFamily:"'Playfair Display',serif", letterSpacing:"-0.01em" }}>
                            {dest.name}
                        </h2>
                        {dest.region && (
                            <span className="inline-flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-wider text-white/80">
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M5 1C3.34 1 2 2.34 2 4c0 2.54 3 6 3 6s3-3.46 3-6c0-1.66-1.34-3-3-3z"/><circle cx="5" cy="4" r="1"/>
                </svg>
                                {dest.region}
              </span>
                        )}
                    </div>
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col p-5">
                    {/* Best time pill */}
                    {dest.bestTimeToVisit && (
                        <div className="mb-3 inline-flex items-center gap-1.5 self-start rounded-full bg-[#F0FDF4] px-3 py-1 text-[0.65rem] font-semibold text-emerald-700">
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="6" cy="6" r="4.5"/><path d="M6 3.5V6l1.5 1.5"/></svg>
                            Best: {dest.bestTimeToVisit}
                        </div>
                    )}

                    <p className="mb-4 line-clamp-2 flex-1 text-sm font-light leading-relaxed text-[#1A6A8A]">
                        {dest.description}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-[#EBF8FF] pt-3">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-[#0A3D52]">
                            {dest.avgRating > 0 ? (
                                <>
                                    {[1,2,3,4,5].map(s => (
                                        <span key={s} className="text-xs" style={{ color: s <= Math.round(dest.avgRating) ? "#F59E0B" : "rgba(14,133,178,0.2)" }}>★</span>
                                    ))}
                                    <span className="ml-1">{dest.avgRating.toFixed(1)}</span>
                                    <span className="font-light text-[#1A6A8A] text-xs">({dest.reviewCount})</span>
                                </>
                            ) : (
                                <span className="text-xs font-light text-[#1A6A8A]">No reviews yet</span>
                            )}
                        </div>
                        <span className="flex items-center gap-1 rounded-lg bg-[#EBF8FF] px-3 py-1.5 text-xs font-bold text-[#1E9DC8] transition-all"
                              style={{ background: hovered ? "linear-gradient(135deg,#28B8E8,#0A6A94)" : "#EBF8FF", color: hovered ? "#fff" : "#1E9DC8", transition: "all 0.25s ease" }}>
              Explore
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M2 6h8M6 2l4 4-4 4"/>
              </svg>
            </span>
                    </div>
                </div>

                {/* Bottom progress bar animates in on hover */}
                <div className="h-[3px] w-full bg-gradient-to-r from-[#28B8E8] via-[#1E9DC8] to-[#0A6A94]"
                     style={{ transform: hovered ? "scaleX(1)" : "scaleX(0)", transformOrigin: "left", transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1)" }} />
            </Link>
        </div>
    );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function DestinationsClient({
                                               destinations, total, page, perPage,
                                               category, region, hiddenGems, sort,
                                               categories, regions,
                                           }: {
    destinations: Destination[]; total: number; page: number; perPage: number;
    category: string; region: string; hiddenGems: boolean; sort: string;
    categories: string[]; regions: string[];
}) {
    const router   = useRouter();
    const pathname = usePathname();
    const [pending, startTransition] = useTransition();
    const heroReveal = useReveal();
    const gridReveal = useReveal();

    const baseParams = { category, region, sort, hidden: hiddenGems ? "true" : "" };

    const push = useCallback((patch: Record<string, string | undefined>) => {
        startTransition(() => router.push(`${pathname}?${buildParams(baseParams, patch)}`));
    }, [category, region, hiddenGems, sort, pathname, router]);

    const totalPages = Math.ceil(total / perPage);

    const categoryOptions: DropdownOption[] = [
        { label: "All categories", value: "all" },
        ...categories.map(c => ({ label: c.charAt(0).toUpperCase() + c.slice(1), value: c })),
    ];
    const sortOptions: DropdownOption[] = [
        { label: "Name (A–Z)",    value: "name"    },
        { label: "Highest rated", value: "rating"  },
        { label: "Most reviewed", value: "reviews" },
    ];

    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
        .reduce<(number | "…")[]>((acc, p, i, arr) => {
            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
            acc.push(p);
            return acc;
        }, []);

    const activeFiltersCount = [category !== "all", region !== "all", hiddenGems].filter(Boolean).length;

    return (
        <div className="min-h-screen bg-white">
            <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

            {/* ── HERO ── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#EBF8FF] via-white to-[#EBF8FF] px-6 pb-16 pt-28 border-b border-[rgba(14,133,178,0.08)]">
                <HeroBackground />
                <div className="relative mx-auto max-w-6xl">
                    <div ref={heroReveal.ref} style={{ opacity: heroReveal.visible ? 1 : 0, transform: heroReveal.visible ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.8s ease, transform 0.8s ease" }}>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(14,133,178,0.18)] bg-[#EBF8FF] px-4 py-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#1E9DC8] inline-block" style={{ animation: "pulse 2s infinite" }} />
                            <span className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#1E9DC8]">Explore Ethiopia</span>
                        </div>
                        <h1 className="mb-4 leading-tight text-[#0A3D52]"
                            style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(2.4rem,5vw,3.6rem)", fontWeight:700, letterSpacing:"-0.025em" }}>
                            <em className="italic text-[#1E9DC8]">Extraordinary</em><br />destinations await you
                        </h1>
                        <p className="max-w-lg text-base font-light leading-relaxed text-[#1A6A8A]">
                            From ancient rock-hewn churches to volcanic landscapes — discover the places that make Ethiopia unlike anywhere else on earth.
                        </p>
                    </div>

                    {/* Count-up stat pills */}
                    <div className="mt-10 flex flex-wrap gap-3">
                        <StatPill icon="📍" target={total}  suffix="+" label="Destinations" delay={100} />
                        <StatPill icon="🌍" target={8}       label="Regions"      delay={200} />
                        <StatPill icon="⭐" target={49} suffix="/50" label="Avg rating"   delay={300} />
                        <StatPill icon="💎" target={12}      label="Hidden gems"  delay={400} />
                    </div>
                </div>
            </div>

            {/* ── REGION STRIP ── */}
            <div className="border-b border-[rgba(14,133,178,0.07)] bg-gradient-to-r from-[#F8FCFF] to-white px-6 py-4">
                <div className="mx-auto max-w-6xl">
                    <RegionStrip active={region} onChange={v => push({ region: v })} />
                </div>
            </div>

            {/* ── STICKY FILTERS ── */}
            <div className="sticky top-16 z-40 border-b border-[rgba(14,133,178,0.08)] bg-white/96 px-6 py-3 shadow-[0_2px_20px_rgba(14,133,178,0.07)] backdrop-blur-lg">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
                    <Dropdown options={categoryOptions} value={category} onChange={v => push({ category: v })} width="w-40" />
                    <Dropdown options={sortOptions}     value={sort}     onChange={v => push({ sort: v })}     width="w-44" />
                    <div className="h-6 w-px bg-[rgba(14,133,178,0.12)]" />
                    <button onClick={() => push({ hidden: hiddenGems ? "" : "true" })}
                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-all ${
                                hiddenGems ? "border-[#1E9DC8] bg-[#EBF8FF] font-semibold text-[#0A3D52]" : "border-[rgba(14,133,178,0.18)] bg-white font-light text-[#1A6A8A] hover:bg-[#EBF8FF]"
                            }`}>
                        💎 <span>{hiddenGems ? "Hidden gems" : "Hidden gems"}</span>
                    </button>

                    {/* Active filter badge */}
                    {activeFiltersCount > 0 && (
                        <button onClick={() => push({ category: "all", region: "all", hidden: "", sort: "name" })}
                                className="flex items-center gap-1.5 rounded-full bg-[#1E9DC8] px-3 py-1 text-[0.7rem] font-bold text-white transition-all hover:bg-[#0E85B2]">
                            {activeFiltersCount} active
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M2 2l6 6M8 2L2 8"/>
                            </svg>
                        </button>
                    )}

                    <span className="ml-auto text-xs font-light text-[#1A6A8A]">{total} result{total !== 1 ? "s" : ""}</span>
                </div>
            </div>

            {/* ── GRID ── */}
            <div className="mx-auto max-w-6xl px-6 pb-24 pt-10">
                <div className="relative" ref={gridReveal.ref}>
                    {/* Loading overlay */}
                    <div className={`absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/75 backdrop-blur-sm transition-opacity duration-300 ${pending ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative h-12 w-12">
                                <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-[rgba(14,133,178,0.12)] border-t-[#1E9DC8]" />
                                <div className="absolute inset-2 animate-spin rounded-full border-[2px] border-[rgba(14,133,178,0.08)] border-t-[#28B8E8]" style={{ animationDirection:"reverse", animationDuration:"0.7s" }} />
                            </div>
                            <span className="text-xs font-light text-[#1A6A8A]">Finding destinations…</span>
                        </div>
                    </div>

                    {destinations.length === 0 ? (
                        <div className="flex flex-col items-center py-28 text-center">
                            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#EBF8FF] to-[#D6F0FA] text-5xl shadow-[0_8px_32px_rgba(14,133,178,0.12)]"
                                 style={{ animation: "bounce-gentle 3s ease-in-out infinite" }}>
                                📍
                            </div>
                            <p className="mb-2 text-2xl font-semibold text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif" }}>No destinations found</p>
                            <p className="mb-8 text-sm font-light text-[#1A6A8A]">Try adjusting your filters or exploring a different region.</p>
                            <button onClick={() => push({ category:"all", region:"all", hidden:"" })}
                                    className="rounded-xl bg-gradient-to-r from-[#28B8E8] to-[#0A6A94] px-6 py-3 text-sm font-bold text-white shadow-[0_4px_16px_rgba(14,133,178,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(14,133,178,0.45)]">
                                Clear all filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {destinations.map((dest, i) => (
                                <DestCard key={dest.id} dest={dest} delay={Math.min(i % 6, 5) * 70} />
                            ))}
                        </div>
                    )}
                </div>

                {/* ── PAGINATION ── */}
                {totalPages > 1 && (
                    <nav className="mt-16 flex items-center justify-center gap-1.5" aria-label="Destinations pagination">
                        <Link href={`?${buildParams(baseParams, { page: String(page - 1) })}`} aria-disabled={page <= 1}
                              className={`flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(14,133,178,0.18)] bg-white text-[#1A6A8A] transition-all hover:border-[#1E9DC8] hover:bg-[#EBF8FF] ${page <= 1 ? "pointer-events-none opacity-30" : ""}`}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 2L4 7l5 5"/></svg>
                        </Link>
                        {pageNumbers.map((p, i) =>
                            p === "…" ? (
                                <span key={`el-${i}`} className="px-1 text-sm text-[#1A6A8A]">…</span>
                            ) : (
                                <Link key={p} href={`?${buildParams(baseParams, { page: String(p) })}`}
                                      aria-current={p === page ? "page" : undefined}
                                      className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-all ${
                                          p === page
                                              ? "border-transparent bg-gradient-to-br from-[#28B8E8] to-[#0A6A94] font-bold text-white shadow-[0_4px_14px_rgba(14,133,178,0.38)]"
                                              : "border-[rgba(14,133,178,0.18)] bg-white text-[#1A6A8A] hover:border-[#1E9DC8] hover:bg-[#EBF8FF]"
                                      }`}>
                                    {p}
                                </Link>
                            )
                        )}
                        <Link href={`?${buildParams(baseParams, { page: String(page + 1) })}`} aria-disabled={page >= totalPages}
                              className={`flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(14,133,178,0.18)] bg-white text-[#1A6A8A] transition-all hover:border-[#1E9DC8] hover:bg-[#EBF8FF] ${page >= totalPages ? "pointer-events-none opacity-30" : ""}`}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 2l5 5-5 5"/></svg>
                        </Link>
                    </nav>
                )}
            </div>

            <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        @keyframes bounce-gentle { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
      `}</style>
        </div>
    );
}