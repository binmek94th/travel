// src/app/guides/GuidesClient.tsx
"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import type { Guide } from "./page";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso?: string): string {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function readTime(body: string): number {
    return Math.max(1, Math.ceil(body.split(/\s+/).length / 200));
}

function excerpt(body: string, words = 24): string {
    // Strip markdown-ish syntax for the excerpt
    const plain = body.replace(/#{1,6}\s/g, "").replace(/[*_`>\[\]]/g, "").replace(/\n+/g, " ").trim();
    const w = plain.split(/\s+/);
    return w.slice(0, words).join(" ") + (w.length > words ? "…" : "");
}

function useReveal(delay = 0) {
    const ref = useRef<HTMLDivElement>(null);
    const [v, setV] = useState(false);
    useEffect(() => {
        const el = ref.current; if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setTimeout(() => setV(true), delay); obs.disconnect(); } },
            { threshold: 0.05 }
        );
        obs.observe(el); return () => obs.disconnect();
    }, [delay]);
    return { ref, visible: v };
}

// ─── Category colors ──────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    "culture":     { bg:"rgba(109,40,217,0.10)",  text:"#6D28D9", dot:"#8B5CF6" },
    "history":     { bg:"rgba(146,64,14,0.10)",   text:"#92400E", dot:"#D97706" },
    "food":        { bg:"rgba(6,95,70,0.10)",      text:"#065F46", dot:"#10B981" },
    "adventure":   { bg:"rgba(14,133,178,0.10)",   text:"#0A6A94", dot:"#1E9DC8" },
    "wildlife":    { bg:"rgba(6,78,59,0.10)",      text:"#064E3B", dot:"#059669" },
    "travel tips": { bg:"rgba(239,68,68,0.10)",    text:"#B91C1C", dot:"#EF4444" },
    "religion":    { bg:"rgba(79,70,229,0.10)",    text:"#4338CA", dot:"#6366F1" },
};

function catStyle(cat: string) {
    return CAT_COLORS[cat.toLowerCase()] ?? { bg:"rgba(14,133,178,0.08)", text:"#1A6A8A", dot:"#1E9DC8" };
}

// ─── Feature card (large, first article) ─────────────────────────────────────

function FeatureCard({ guide }: { guide: Guide }) {
    const [hovered, setHovered] = useState(false);
    const { ref, visible } = useReveal();
    const mins = readTime(guide.body);

    return (
        <div ref={ref} style={{ opacity:visible?1:0, transform:visible?"translateY(0)":"translateY(24px)", transition:"opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)" }}>
            <Link
                href={`/guides/${guide.slug}`}
                style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0, borderRadius:24, overflow:"hidden", textDecoration:"none", border:hovered?"1.5px solid rgba(14,133,178,0.35)":"1.5px solid rgba(14,133,178,0.10)", boxShadow:hovered?"0 28px 64px rgba(14,133,178,0.18)":"0 4px 20px rgba(14,133,178,0.07)", transform:hovered?"translateY(-4px)":"translateY(0)", transition:"all 0.3s cubic-bezier(0.22,1,0.36,1)", background:"#fff" }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                {/* Image */}
                <div style={{ position:"relative", minHeight:360, background:"linear-gradient(135deg,#0A3D52,#0A6A94)", overflow:"hidden" }}>
                    {guide.coverImage ? (
                        <img src={guide.coverImage} alt={guide.title} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", transform:hovered?"scale(1.05)":"scale(1)", transition:"transform 0.6s cubic-bezier(0.22,1,0.36,1)" }}/>
                    ) : (
                        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"5rem", opacity:0.15 }}>📖</div>
                    )}
                    <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right, transparent 60%, rgba(255,255,255,0.08))" }}/>

                    {/* Categories */}
                    <div style={{ position:"absolute", top:20, left:20, display:"flex", gap:6, flexWrap:"wrap" }}>
                        {guide.categories.slice(0, 2).map(c => {
                            const cs = catStyle(c);
                            return (
                                <span key={c} style={{ background:"rgba(255,255,255,0.18)", backdropFilter:"blur(12px)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:30, padding:"0.25rem 0.7rem", fontSize:"0.62rem", fontWeight:700, color:"#fff", letterSpacing:"0.06em", textTransform:"uppercase" }}>
                  {c}
                </span>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding:"48px 44px", display:"flex", flexDirection:"column", justifyContent:"center" }}>
                    <p style={{ margin:"0 0 16px", fontSize:"0.62rem", fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase", color:"#1E9DC8" }}>
                        ✦ Featured guide
                    </p>
                    <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.5rem,2.5vw,2rem)", fontWeight:700, color:"#0A3D52", lineHeight:1.2, letterSpacing:"-0.02em", margin:"0 0 16px" }}>
                        {guide.title}
                    </h2>
                    <p style={{ fontSize:"0.9rem", color:"#1A6A8A", lineHeight:1.75, fontWeight:300, margin:"0 0 28px" }}>
                        {excerpt(guide.body, 36)}
                    </p>
                    <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                        <span style={{ fontSize:"0.75rem", color:"#94A3B8" }}>{fmtDate(guide.publishedAt)}</span>
                        <span style={{ width:3, height:3, borderRadius:"50%", background:"#CBD5E1" }}/>
                        <span style={{ fontSize:"0.75rem", color:"#94A3B8" }}>{mins} min read</span>
                    </div>
                </div>
            </Link>
        </div>
    );
}

// ─── Standard card ────────────────────────────────────────────────────────────

function GuideCard({ guide, index }: { guide: Guide; index: number }) {
    const [hovered, setHovered] = useState(false);
    const { ref, visible } = useReveal(index * 55);
    const mins = readTime(guide.body);

    return (
        <div ref={ref} style={{ opacity:visible?1:0, transform:visible?"translateY(0)":"translateY(28px)", transition:`opacity 0.55s ease, transform 0.55s cubic-bezier(0.22,1,0.36,1)` }}>
            <Link
                href={`/guides/${guide.slug}`}
                style={{ display:"flex", flexDirection:"column", height:"100%", borderRadius:20, overflow:"hidden", textDecoration:"none", background:"#fff", border:hovered?"1.5px solid rgba(14,133,178,0.30)":"1.5px solid rgba(14,133,178,0.08)", boxShadow:hovered?"0 20px 48px rgba(14,133,178,0.15)":"0 2px 10px rgba(14,133,178,0.05)", transform:hovered?"translateY(-6px)":"translateY(0)", transition:"all 0.28s cubic-bezier(0.22,1,0.36,1)" }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                {/* Cover */}
                <div style={{ position:"relative", height:200, overflow:"hidden", background:"linear-gradient(135deg,#EBF8FF,#D6F0FA)", flexShrink:0 }}>
                    {guide.coverImage ? (
                        <img src={guide.coverImage} alt={guide.title} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", transform:hovered?"scale(1.06)":"scale(1)", transition:"transform 0.55s cubic-bezier(0.22,1,0.36,1)" }}/>
                    ) : (
                        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"3rem", opacity:0.2 }}>📖</div>
                    )}
                    <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, transparent 50%, rgba(6,20,40,0.55))" }}/>

                    {/* Category pill */}
                    {guide.categories[0] && (() => {
                        const cs = catStyle(guide.categories[0]);
                        return (
                            <div style={{ position:"absolute", top:12, left:12, display:"flex", alignItems:"center", gap:5, background:"rgba(255,255,255,0.18)", backdropFilter:"blur(12px)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:30, padding:"0.22rem 0.65rem" }}>
                                <span style={{ width:5, height:5, borderRadius:"50%", background:"#fff", flexShrink:0 }}/>
                                <span style={{ fontSize:"0.6rem", fontWeight:700, color:"#fff", textTransform:"uppercase", letterSpacing:"0.06em" }}>{guide.categories[0]}</span>
                            </div>
                        );
                    })()}

                    {/* Read time */}
                    <div style={{ position:"absolute", bottom:12, right:12, background:"rgba(0,0,0,0.45)", backdropFilter:"blur(8px)", borderRadius:20, padding:"0.2rem 0.6rem" }}>
                        <span style={{ fontSize:"0.6rem", fontWeight:700, color:"rgba(255,255,255,0.85)" }}>{mins} min</span>
                    </div>
                </div>

                {/* Body */}
                <div style={{ flex:1, padding:"1.25rem 1.25rem 1rem", display:"flex", flexDirection:"column" }}>
                    <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.05rem", fontWeight:700, color:"#0A3D52", lineHeight:1.3, margin:"0 0 10px", letterSpacing:"-0.01em" }}>
                        {guide.title}
                    </h3>
                    <p style={{ fontSize:"0.82rem", color:"#1A6A8A", lineHeight:1.65, fontWeight:300, margin:"0 0 auto", display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                        {excerpt(guide.body)}
                    </p>

                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:"1rem", paddingTop:"0.85rem", borderTop:"1px solid rgba(14,133,178,0.07)" }}>
                        <span style={{ fontSize:"0.7rem", color:"#94A3B8" }}>{fmtDate(guide.publishedAt)}</span>
                        <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:"0.78rem", fontWeight:700, color:"#1E9DC8", opacity:hovered?1:0.6, transition:"opacity 0.2s" }}>
              Read
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 6h8M6 2l4 4-4 4"/></svg>
            </span>
                    </div>
                </div>
            </Link>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const ALL_CATS = ["All", "Culture", "History", "Food", "Adventure", "Wildlife", "Travel Tips", "Religion"];

export default function GuidesClient({ guides }: { guides: Guide[] }) {
    const [category, setCategory] = useState("All");
    const [search, setSearch]     = useState("");

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return guides.filter(g => {
            if (category !== "All" && !g.categories.map(c => c.toLowerCase()).includes(category.toLowerCase())) return false;
            if (q && !g.title.toLowerCase().includes(q) && !g.body.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [guides, category, search]);

    const [featured, ...rest] = filtered;

    return (
        <div style={{ minHeight:"100vh", background:"#F8FBFF", paddingTop:64 }}>
            <style>{`
        @keyframes fadeIn  { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        .scroll-hide::-webkit-scrollbar { display:none }
        .scroll-hide { -ms-overflow-style:none; scrollbar-width:none }
      `}</style>

            {/* ── HERO ──────────────────────────────────────────────────────────── */}
            <div style={{ position:"relative", overflow:"hidden", background:"linear-gradient(145deg,#061E32 0%,#0A3D52 45%,#0A6A94 100%)", padding:"6rem 2rem 5rem" }}>
                {[
                    { left:"4%",  top:"10%", size:450, color:"rgba(40,184,232,0.10)"  },
                    { left:"80%", top:"-15%",size:550, color:"rgba(14,133,178,0.09)"  },
                    { left:"48%", top:"70%", size:320, color:"rgba(30,157,200,0.07)"  },
                ].map((o,i) => (
                    <div key={i} style={{ position:"absolute", left:o.left, top:o.top, width:o.size, height:o.size, borderRadius:"50%", background:`radial-gradient(circle,${o.color} 0%,transparent 70%)`, transform:"translate(-50%,-50%)", pointerEvents:"none" }}/>
                ))}
                <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle,rgba(255,255,255,0.055) 1px,transparent 1px)", backgroundSize:"28px 28px", WebkitMaskImage:"radial-gradient(ellipse 90% 100% at 50% 0%,black 40%,transparent 100%)", maskImage:"radial-gradient(ellipse 90% 100% at 50% 0%,black 40%,transparent 100%)", pointerEvents:"none" }}/>

                <div style={{ maxWidth:1100, margin:"0 auto", position:"relative" }}>
                    <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.10)", backdropFilter:"blur(12px)", border:"1px solid rgba(255,255,255,0.16)", borderRadius:30, padding:"0.4rem 1rem", marginBottom:"1.5rem", animation:"fadeIn 0.5s ease both" }}>
                        <span style={{ width:6, height:6, borderRadius:"50%", background:"#10B981", display:"inline-block", animation:"pulse 2s infinite" }}/>
                        <span style={{ fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.18em", color:"rgba(255,255,255,0.82)", textTransform:"uppercase" }}>Guides & Blog</span>
                    </div>

                    <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(2.4rem,5vw,3.8rem)", fontWeight:700, color:"#fff", letterSpacing:"-0.03em", lineHeight:1.15, marginBottom:"1.1rem", animation:"fadeIn 0.5s 0.1s ease both", animationFillMode:"both" }}>
                        Know Ethiopia<br/>
                        <em style={{ fontStyle:"italic", color:"#28B8E8" }}>before you go</em>
                    </h1>

                    <p style={{ fontSize:"1rem", fontWeight:300, color:"rgba(235,248,255,0.72)", maxWidth:500, lineHeight:1.75, marginBottom:"2.5rem", animation:"fadeIn 0.5s 0.2s ease both", animationFillMode:"both" }}>
                        In-depth travel guides, cultural stories, food discoveries, and local insights — everything you need to experience Ethiopia deeply.
                    </p>

                    {/* Stats */}
                    <div style={{ display:"flex", flexWrap:"wrap", gap:"0.75rem", animation:"fadeIn 0.5s 0.3s ease both", animationFillMode:"both" }}>
                        {[
                            { icon:"📖", label:"Guides",     val:guides.length          },
                            { icon:"🗂", label:"Categories", val:ALL_CATS.length - 1    },
                        ].map(({ icon, label, val }) => (
                            <div key={label} style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,0.08)", backdropFilter:"blur(12px)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:16, padding:"0.65rem 1.1rem" }}>
                                <span style={{ fontSize:"1.1rem" }}>{icon}</span>
                                <div>
                                    <div style={{ fontSize:"1rem", fontWeight:800, color:"#fff", lineHeight:1 }}>{val}</div>
                                    <div style={{ fontSize:"0.62rem", fontWeight:500, color:"rgba(255,255,255,0.48)", textTransform:"uppercase", letterSpacing:"0.08em", marginTop:2 }}>{label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── FILTER BAR ──────────────────────────────────────────────────────── */}
            <div style={{ position:"sticky", top:64, zIndex:40, background:"rgba(248,251,255,0.96)", backdropFilter:"blur(16px)", borderBottom:"1px solid rgba(14,133,178,0.08)", boxShadow:"0 2px 16px rgba(14,133,178,0.06)", padding:"0.75rem 2rem" }}>
                <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", gap:"0.6rem" }}>

                    {/* Search */}
                    <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(14,133,178,0.05)", border:"1px solid rgba(14,133,178,0.16)", borderRadius:30, padding:"0.4rem 1rem", minWidth:200 }}>
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round"><circle cx="6" cy="6" r="4.5"/><path d="M10 10l3 3"/></svg>
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search guides…"
                               style={{ border:"none", outline:"none", background:"transparent", fontSize:"0.8rem", color:"#0F172A", width:140 }}/>
                    </div>

                    <div style={{ width:1, height:18, background:"rgba(14,133,178,0.15)", flexShrink:0 }}/>

                    {/* Category pills */}
                    <div style={{ display:"flex", gap:"0.4rem", overflowX:"auto", flex:1 }} className="scroll-hide">
                        {ALL_CATS.map(cat => {
                            const active = category === cat;
                            return (
                                <button key={cat} onClick={() => setCategory(cat)}
                                        style={{ display:"flex", alignItems:"center", gap:5, borderRadius:30, padding:"0.4rem 0.9rem", fontSize:"0.78rem", fontWeight:600, whiteSpace:"nowrap", flexShrink:0, cursor:"pointer", transition:"all 0.18s", border:active?"none":"1px solid rgba(14,133,178,0.16)", background:active?"linear-gradient(135deg,#28B8E8,#0A6A94)":"transparent", color:active?"#fff":"#1A6A8A", boxShadow:active?"0 3px 12px rgba(14,133,178,0.28)":"none" }}>
                                    {cat}
                                </button>
                            );
                        })}
                    </div>

                    <span style={{ fontSize:"0.72rem", color:"#94A3B8", flexShrink:0 }}>
            {filtered.length} article{filtered.length !== 1 ? "s" : ""}
          </span>
                </div>
            </div>

            {/* ── CONTENT ──────────────────────────────────────────────────────────── */}
            <div style={{ maxWidth:1100, margin:"0 auto", padding:"3rem 2rem 5rem" }}>

                {filtered.length === 0 ? (
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"6rem 1rem", textAlign:"center" }}>
                        <div style={{ width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,#EBF8FF,#D6F0FA)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2.5rem", marginBottom:"1.5rem" }}>
                            📖
                        </div>
                        <p style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.35rem", fontWeight:700, color:"#0A3D52", marginBottom:"0.5rem" }}>No guides found</p>
                        <p style={{ fontSize:"0.88rem", color:"#1A6A8A", fontWeight:300 }}>Try a different category or search term.</p>
                    </div>
                ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:"3rem" }}>

                        {/* Featured article */}
                        {featured && <FeatureCard guide={featured}/>}

                        {/* Grid */}
                        {rest.length > 0 && (
                            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1.5rem", alignItems:"start" }}>
                                {rest.map((g, i) => <GuideCard key={g.id} guide={g} index={i}/>)}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}