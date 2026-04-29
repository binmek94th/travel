// src/app/guides/[slug]/GuideDetailClient.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { Guide } from "../page";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso?: string): string {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" });
}

function readTime(body: string): number {
    return Math.max(1, Math.ceil(body.split(/\s+/).length / 200));
}

function excerpt(body: string, words = 22): string {
    const plain = body.replace(/#{1,6}\s/g, "").replace(/[*_`>\[\]]/g, "").replace(/\n+/g, " ").trim();
    const w = plain.split(/\s+/);
    return w.slice(0, words).join(" ") + (w.length > words ? "…" : "");
}

// ─── Simple markdown → HTML renderer ──────────────────────────────────────────
// Handles: headings, bold, italic, inline code, code blocks, blockquotes, links,
// unordered lists, ordered lists, horizontal rules, paragraphs

function renderMarkdown(md: string): string {
    let html = md
        // Code blocks
        .replace(/```[\w]*\n([\s\S]*?)```/gm, (_, code) =>
            `<pre><code>${code.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</code></pre>`)
        // Headings
        .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
        .replace(/^### (.+)$/gm,  "<h3>$1</h3>")
        .replace(/^## (.+)$/gm,   "<h2>$1</h2>")
        .replace(/^# (.+)$/gm,    "<h1>$1</h1>")
        // Blockquotes
        .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
        // HR
        .replace(/^---$/gm, "<hr/>")
        // Bold + italic
        .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/_(.+?)_/g, "<em>$1</em>")
        // Inline code
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        // Links
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        // Images
        .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1"/>')
        // Unordered lists
        .replace(/^\* (.+)$/gm, "<li>$1</li>")
        .replace(/^- (.+)$/gm,  "<li>$1</li>")
        // Ordered lists
        .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
        // Wrap consecutive <li> in <ul>
        .replace(/(<li>[\s\S]+?<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
        // Paragraphs — wrap non-tag lines
        .split(/\n{2,}/)
        .map(block => {
            block = block.trim();
            if (!block) return "";
            if (/^<(h[1-6]|ul|ol|pre|blockquote|hr)/.test(block)) return block;
            return `<p>${block.replace(/\n/g, "<br/>")}</p>`;
        })
        .join("\n");

    return html;
}

// ─── Category pill ────────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
    "culture":"#6D28D9", "history":"#92400E", "food":"#065F46",
    "adventure":"#0A6A94", "wildlife":"#064E3B", "travel tips":"#B91C1C", "religion":"#4338CA",
};

function CatPill({ cat }: { cat: string }) {
    const color = CAT_COLORS[cat.toLowerCase()] ?? "#1A6A8A";
    return (
        <Link href={`/guides?category=${encodeURIComponent(cat)}`}
              style={{ display:"inline-flex", alignItems:"center", gap:5, background:`${color}14`, border:`1px solid ${color}30`, borderRadius:30, padding:"0.25rem 0.75rem", fontSize:"0.68rem", fontWeight:700, color, textDecoration:"none", letterSpacing:"0.06em", textTransform:"uppercase" }}>
            {cat}
        </Link>
    );
}

// ─── Reading progress bar ──────────────────────────────────────────────────────

function ReadingProgress() {
    const [pct, setPct] = useState(0);
    useEffect(() => {
        function onScroll() {
            const el  = document.documentElement;
            const top = el.scrollTop;
            const max = el.scrollHeight - el.clientHeight;
            setPct(max > 0 ? Math.min(100, (top / max) * 100) : 0);
        }
        window.addEventListener("scroll", onScroll, { passive:true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    return (
        <div style={{ position:"fixed", top:64, left:0, right:0, height:3, zIndex:50, background:"rgba(14,133,178,0.08)" }}>
            <div style={{ height:"100%", background:"linear-gradient(90deg,#28B8E8,#0A6A94)", width:`${pct}%`, transition:"width 0.1s linear" }}/>
        </div>
    );
}

// ─── Related card ─────────────────────────────────────────────────────────────

function RelatedCard({ guide }: { guide: Guide }) {
    const [hovered, setHovered] = useState(false);
    return (
        <Link href={`/guides/${guide.slug}`}
              style={{ display:"flex", gap:14, textDecoration:"none", padding:"12px 0", borderBottom:"1px solid rgba(14,133,178,0.07)" }}
              onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
            <div style={{ width:72, height:56, borderRadius:10, overflow:"hidden", background:"linear-gradient(135deg,#EBF8FF,#D6F0FA)", flexShrink:0 }}>
                {guide.coverImage ? (
                    <img src={guide.coverImage} alt={guide.title} style={{ width:"100%", height:"100%", objectFit:"cover", transform:hovered?"scale(1.08)":"scale(1)", transition:"transform 0.3s ease" }}/>
                ) : (
                    <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.4rem", opacity:0.3 }}>📖</div>
                )}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontFamily:"'Playfair Display',serif", fontSize:"0.85rem", fontWeight:700, color:hovered?"#1E9DC8":"#0A3D52", lineHeight:1.3, margin:"0 0 4px", transition:"color 0.2s", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                    {guide.title}
                </p>
                <p style={{ fontSize:"0.68rem", color:"#94A3B8", margin:0 }}>{readTime(guide.body)} min read</p>
            </div>
        </Link>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function GuideDetailClient({ guide, relatedGuides }: { guide: Guide; relatedGuides: Guide[] }) {
    const mins    = readTime(guide.body);
    const bodyHtml = renderMarkdown(guide.body);
    const [copied, setCopied] = useState(false);

    function share() {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    return (
        <>
            <ReadingProgress/>

            <div style={{ minHeight:"100vh", background:"#F8FBFF", paddingTop:64 }}>
                <style>{`
          @keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

          .guide-body { font-family: Georgia, serif; font-size: 1.05rem; line-height: 1.85; color: #1E293B; font-weight: 300; }
          .guide-body h1,.guide-body h2,.guide-body h3,.guide-body h4 {
            font-family: 'Playfair Display', serif; font-weight: 700; color: #0A3D52;
            letter-spacing: -0.02em; margin: 2rem 0 0.75rem; line-height: 1.25;
          }
          .guide-body h1 { font-size: 2rem; }
          .guide-body h2 { font-size: 1.5rem; }
          .guide-body h3 { font-size: 1.2rem; }
          .guide-body h4 { font-size: 1rem; }
          .guide-body p  { margin: 0 0 1.25rem; }
          .guide-body strong { font-weight: 700; color: #0A3D52; }
          .guide-body em { font-style: italic; color: #1A6A8A; }
          .guide-body a  { color: #1E9DC8; text-decoration: none; border-bottom: 1px solid rgba(14,133,178,0.3); transition: border-color 0.2s; }
          .guide-body a:hover { border-color: #1E9DC8; }
          .guide-body ul, .guide-body ol { padding-left: 1.5rem; margin: 0 0 1.25rem; }
          .guide-body li { margin-bottom: 0.4rem; }
          .guide-body blockquote {
            border-left: 4px solid #28B8E8; padding: 0.75rem 1.25rem;
            background: rgba(14,133,178,0.05); border-radius: 0 12px 12px 0;
            margin: 1.5rem 0; font-style: italic; color: #1A6A8A;
          }
          .guide-body code { background: rgba(14,133,178,0.08); border-radius: 5px; padding: 2px 6px; font-size: 0.88em; font-family: monospace; color: #0A6A94; }
          .guide-body pre { background: #061E32; border-radius: 12px; padding: 1.25rem; overflow-x: auto; margin: 1.5rem 0; }
          .guide-body pre code { background: none; color: #28B8E8; font-size: 0.85rem; padding: 0; }
          .guide-body img { max-width: 100%; border-radius: 14px; margin: 1.5rem 0; display: block; }
          .guide-body hr { border: none; border-top: 1px solid rgba(14,133,178,0.12); margin: 2.5rem 0; }
        `}</style>

                {/* ── Cover hero ────────────────────────────────────────────────── */}
                <div style={{ position:"relative", height:420, overflow:"hidden", background:"linear-gradient(135deg,#0A3D52,#0A6A94)" }}>
                    {guide.coverImage ? (
                        <img src={guide.coverImage} alt={guide.title} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }}/>
                    ) : (
                        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"8rem", opacity:0.08 }}>📖</div>
                    )}
                    <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(6,18,36,0.3) 0%, rgba(6,18,36,0.75) 100%)" }}/>

                    <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"2.5rem", maxWidth:860, margin:"0 auto" }}>
                        {/* Categories */}
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:"1rem" }}>
                            {guide.categories.map(c => (
                                <span key={c} style={{ background:"rgba(255,255,255,0.18)", backdropFilter:"blur(12px)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:30, padding:"0.25rem 0.7rem", fontSize:"0.62rem", fontWeight:700, color:"#fff", letterSpacing:"0.06em", textTransform:"uppercase" }}>
                  {c}
                </span>
                            ))}
                        </div>

                        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.8rem,4vw,3rem)", fontWeight:700, color:"#fff", lineHeight:1.15, letterSpacing:"-0.025em", margin:"0 0 1rem", textShadow:"0 2px 20px rgba(0,0,0,0.3)", animation:"fadeIn 0.5s ease both" }}>
                            {guide.title}
                        </h1>

                        <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
                            <span style={{ fontSize:"0.78rem", color:"rgba(255,255,255,0.7)" }}>{fmtDate(guide.publishedAt)}</span>
                            <span style={{ width:3, height:3, borderRadius:"50%", background:"rgba(255,255,255,0.4)" }}/>
                            <span style={{ fontSize:"0.78rem", color:"rgba(255,255,255,0.7)" }}>{mins} min read</span>
                        </div>
                    </div>
                </div>

                {/* ── Body layout ───────────────────────────────────────────────── */}
                <div style={{ maxWidth:1100, margin:"0 auto", padding:"3rem 2rem 5rem", display:"grid", gridTemplateColumns:"1fr 300px", gap:"3.5rem", alignItems:"start" }}>

                    {/* Article */}
                    <article style={{ animation:"fadeIn 0.5s 0.1s ease both", animationFillMode:"both" }}>

                        {/* Breadcrumb */}
                        <nav style={{ display:"flex", alignItems:"center", gap:6, marginBottom:"2rem", fontSize:"0.75rem", color:"#94A3B8" }}>
                            <Link href="/" style={{ color:"#94A3B8", textDecoration:"none" }}>Home</Link>
                            <span>›</span>
                            <Link href="/guides" style={{ color:"#94A3B8", textDecoration:"none" }}>Guides</Link>
                            <span>›</span>
                            <span style={{ color:"#0A3D52" }}>{guide.title}</span>
                        </nav>

                        {/* Body */}
                        <div
                            className="guide-body"
                            dangerouslySetInnerHTML={{ __html: bodyHtml }}
                        />

                        {/* Tags */}
                        {guide.categories.length > 0 && (
                            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:"2.5rem", paddingTop:"2rem", borderTop:"1px solid rgba(14,133,178,0.10)" }}>
                                {guide.categories.map(c => <CatPill key={c} cat={c}/>)}
                            </div>
                        )}

                        {/* Share */}
                        <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:"2rem" }}>
                            <span style={{ fontSize:"0.78rem", color:"#94A3B8" }}>Share:</span>
                            <button onClick={share}
                                    style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 16px", borderRadius:30, border:"1px solid rgba(14,133,178,0.20)", background:"transparent", cursor:"pointer", fontSize:"0.78rem", fontWeight:600, color:copied?"#059669":"#1A6A8A", transition:"all 0.2s" }}>
                                {copied ? "✓ Copied!" : "Copy link"}
                            </button>
                            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(guide.title)}&url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                               target="_blank" rel="noopener"
                               style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 16px", borderRadius:30, border:"1px solid rgba(14,133,178,0.20)", background:"transparent", textDecoration:"none", fontSize:"0.78rem", fontWeight:600, color:"#1A6A8A" }}>
                                Share on X
                            </a>
                        </div>

                        {/* Back link */}
                        <div style={{ marginTop:"2.5rem" }}>
                            <Link href="/guides" style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:"0.83rem", fontWeight:600, color:"#1E9DC8", textDecoration:"none" }}>
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 2L4 7l5 5"/></svg>
                                Back to all guides
                            </Link>
                        </div>
                    </article>

                    {/* Sidebar */}
                    <aside style={{ position:"sticky", top:100, animation:"fadeIn 0.5s 0.2s ease both", animationFillMode:"both" }}>

                        {/* TOC stub — reading time + meta */}
                        <div style={{ background:"#fff", borderRadius:18, border:"1px solid rgba(14,133,178,0.10)", padding:"1.25rem 1.25rem 1rem", marginBottom:"1.5rem", boxShadow:"0 2px 12px rgba(14,133,178,0.06)" }}>
                            <p style={{ fontSize:"0.62rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"#94A3B8", marginBottom:"1rem" }}>Article info</p>
                            {[
                                { label:"Published",  val:fmtDate(guide.publishedAt) || "—" },
                                { label:"Read time",  val:`${mins} min` },
                                { label:"Category",   val:guide.categories[0] ?? "—" },
                            ].map(({ label, val }) => (
                                <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid rgba(14,133,178,0.06)" }}>
                                    <span style={{ fontSize:"0.75rem", color:"#94A3B8" }}>{label}</span>
                                    <span style={{ fontSize:"0.78rem", fontWeight:600, color:"#0A3D52" }}>{val}</span>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <div style={{ background:"linear-gradient(135deg,#0A3D52,#0A6A94)", borderRadius:18, padding:"1.5rem", marginBottom:"1.5rem" }}>
                            <p style={{ fontFamily:"'Playfair Display',serif", fontSize:"1rem", fontWeight:700, color:"#fff", lineHeight:1.3, marginBottom:"0.6rem" }}>
                                Ready to explore Ethiopia?
                            </p>
                            <p style={{ fontSize:"0.78rem", color:"rgba(255,255,255,0.65)", marginBottom:"1.1rem", fontWeight:300, lineHeight:1.6 }}>
                                Browse curated tours guided by local experts.
                            </p>
                            <Link href="/tours" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, background:"rgba(255,255,255,0.92)", borderRadius:12, padding:"0.7rem", fontSize:"0.83rem", fontWeight:700, color:"#0A3D52", textDecoration:"none" }}>
                                Browse tours
                                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 6.5h9M7 3l3.5 3.5L7 10"/></svg>
                            </Link>
                        </div>

                        {/* Related */}
                        {relatedGuides.length > 0 && (
                            <div style={{ background:"#fff", borderRadius:18, border:"1px solid rgba(14,133,178,0.10)", padding:"1.25rem", boxShadow:"0 2px 12px rgba(14,133,178,0.06)" }}>
                                <p style={{ fontSize:"0.62rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"#94A3B8", marginBottom:"0.75rem" }}>Related guides</p>
                                {relatedGuides.map(g => <RelatedCard key={g.id} guide={g}/>)}
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </>
    );
}