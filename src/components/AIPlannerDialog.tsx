// src/components/AIPlannerDialog.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import MarkdownRenderer from "./MarkdownRenderer";

type Destination = { id: string; name: string; region: string; categories: string[]; description: string; images: string[]; avgRating: number };
type Tour        = { id: string; title: string; priceUSD: number; durationDays: number; categories: string[]; description: string; images: string[]; avgRating: number; region: string };
type Message     = { role: "user" | "assistant"; content: string; suggestedTourIds?: string[]; suggestedDestIds?: string[]; timestamp: number };

const QUICK_STARTS = [
    "Plan a 7-day cultural tour of northern Ethiopia",
    "I want to see Danakil Depression and Lalibela",
    "Budget adventure trip for 2, 10 days",
    "Family-friendly Ethiopia in 2 weeks",
    "Photography trip — landscapes and wildlife",
];

const SUGGESTIONS = [
    "What should I pack?",
    "Add a budget breakdown",
    "Make it more adventurous",
    "Best time to visit?",
    "Shorten to 5 days",
    "Add a rest day",
];

// ── Full-dialog underwater background ────────────────────────────────────────
function UnderwaterBackground({ t }: { t: number }) {
    const W = 500;

    // Diver — figure-8 path across full width
    const diverDur = 20000;
    const dp     = (t % diverDur) / diverDur;
    const dx     = -110 + dp * (W + 220);
    const dy     = Math.sin(dp * Math.PI * 4) * 35 + Math.sin(dp * Math.PI * 2) * 18;
    const dtilt  = Math.atan2(-Math.cos(dp * Math.PI * 4) * 35 * (Math.PI * 4 / diverDur) * 500, 1) * (180 / Math.PI) * 0.32;
    const flipper = Math.sin(t / 200) * 26;

    // Fish 1 — slow left-to-right, wavy
    const f1x = -50 + ((t * 0.052) % (W + 100));
    const f1y = Math.sin(t / 750) * 16;

    // Fish 2 — right-to-left, different speed
    const f2x = W + 40 - ((t * 0.036) % (W + 100));

    // Rising bubbles — cycle through height
    const bubbles = [6, 15, 24, 34, 43, 54, 65, 77, 87, 94].map((lp, i) => ({
        left:   `${lp}%`,
        bottom: `${((t * 0.014 + i * 200) % 700)}px`,
        size:   3 + (i % 3) * 2.5,
        opacity: 0.18 + (i % 2) * 0.08,
    }));

    return (
        <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>

            {/* Base ocean gradient — covers full dialog */}
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,rgba(0,65,95,0.28) 0%,rgba(0,90,125,0.20) 45%,rgba(0,65,95,0.14) 100%)" }}/>

            {/* Light shafts from top */}
            {[8, 20, 36, 52, 67, 82].map((x, i) => (
                <div key={i} style={{ position:"absolute", top:0, left:`${x}%`, width:1.5, height:"70%", background:`linear-gradient(180deg,rgba(40,184,232,${0.10 - i * 0.012}),transparent)`, transform:`rotate(${(i - 2.5) * 3}deg)`, transformOrigin:"top center" }}/>
            ))}

            {/* Bubbles */}
            {bubbles.map((b, i) => (
                <div key={i} style={{ position:"absolute", left:b.left, bottom:b.bottom, width:b.size, height:b.size, borderRadius:"50%", border:`1.5px solid rgba(40,184,232,${b.opacity + 0.10})`, background:"rgba(235,248,255,0.08)" }}/>
            ))}

            {/* Coral at bottom */}
            {[3, 15, 29, 44, 58, 72, 87].map((lp, i) => (
                <svg key={i} style={{ position:"absolute", bottom:0, left:`${lp}%`, opacity:0.22 }} width="40" height="56" viewBox="0 0 40 56">
                    <path d="M20 56 Q20 34 13 19 Q8 5 15 2 Q20 0 25 2 Q32 5 27 19 Q20 34 20 56Z" fill={["#1E9DC8","#0E85B2","#28B8E8","#0A6A94","#1E9DC8"][i % 5]}/>
                    <path d="M20 44 Q11 34 6 21" stroke="rgba(40,184,232,0.45)" strokeWidth="1.5" fill="none"/>
                    <path d="M20 44 Q29 34 34 21" stroke="rgba(40,184,232,0.45)" strokeWidth="1.5" fill="none"/>
                </svg>
            ))}

            {/* Fish 1 — left to right */}
            <svg style={{ position:"absolute", top:`calc(32% + ${f1y}px)`, left:f1x, opacity:0.28 }} width="50" height="32" viewBox="0 0 50 32">
                <path d="M5 16 Q25 6 42 16 Q25 26 5 16Z" fill="#28B8E8"/>
                <path d="M0 8 L8 16 L0 24Z" fill="#28B8E8"/>
                <circle cx="36" cy="14" r="3.5" fill="rgba(10,61,82,0.5)"/>
                <circle cx="37" cy="13" r="1.4" fill="rgba(235,248,255,0.85)"/>
            </svg>

            {/* Fish 2 — right to left */}
            <svg style={{ position:"absolute", top:"62%", left:f2x, transform:"scaleX(-1)", opacity:0.22 }} width="40" height="26" viewBox="0 0 40 26">
                <path d="M4 13 Q20 4 34 13 Q20 22 4 13Z" fill="#26C6DA"/>
                <path d="M0 6 L7 13 L0 20Z" fill="#26C6DA"/>
                <circle cx="28" cy="11" r="2.8" fill="rgba(10,61,82,0.5)"/>
            </svg>

            {/* Scuba diver */}
            <svg
                style={{ position:"absolute", top:"18%", left:dx, transform:`translateY(${dy}px) rotate(${dtilt}deg)`, opacity:0.32, transformOrigin:"48px 32px" }}
                width="100" height="64" viewBox="0 0 100 64"
            >
                {/* Tank */}
                <rect x="32" y="16" width="14" height="26" rx="6" fill="#0A3D52"/>
                <rect x="34" y="12" width="10" height="8" rx="3" fill="#0E85B2"/>
                {/* Body suit */}
                <ellipse cx="42" cy="32" rx="16" ry="12" fill="#1E9DC8"/>
                {/* Legs */}
                <path d="M30 38 Q23 46 20 54" stroke="#1E9DC8" strokeWidth="7" strokeLinecap="round" fill="none"/>
                <path d="M42 42 Q36 50 32 58" stroke="#1E9DC8" strokeWidth="7" strokeLinecap="round" fill="none"/>
                {/* Flippers */}
                <path d="M20 54 Q9 58 5 63 Q14 59 25 56Z" fill="#0E85B2" transform={`rotate(${flipper * 0.65} 20 54)`}/>
                <path d="M32 58 Q21 62 17 67 Q26 63 38 60Z" fill="#0E85B2" transform={`rotate(${-flipper * 0.65} 32 58)`}/>
                {/* Head / mask */}
                <circle cx="62" cy="26" r="12" fill="#0A6A94"/>
                <rect x="55" y="18" width="16" height="13" rx="4.5" fill="rgba(235,248,255,0.88)"/>
                <rect x="57" y="20" width="12" height="9" rx="3" fill="rgba(14,133,178,0.32)"/>
                {/* Arm */}
                <path d="M48 24 Q64 16 77 20" stroke="#1E9DC8" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
                {/* Regulator bubbles */}
                <circle cx="78" cy="18" r="3.5" fill="rgba(235,248,255,0.42)"/>
                <circle cx="83" cy="12" r="2.8" fill="rgba(235,248,255,0.32)"/>
                <circle cx="87" cy="7"  r="2.2" fill="rgba(235,248,255,0.22)"/>
                <circle cx="90" cy="3"  r="1.8" fill="rgba(235,248,255,0.14)"/>
            </svg>
        </div>
    );
}

// ── Suggested card ────────────────────────────────────────────────────────────
function SuggestedCard({ item, type }: { item: Destination | Tour; type: "dest" | "tour" }) {
    const [hovered, setHovered] = useState(false);
    const href  = type === "dest" ? `/destinations/${item.id}` : `/tours/${item.id}`;
    const img   = item.images?.[0];
    const title = type === "dest" ? (item as Destination).name : (item as Tour).title;
    const sub   = type === "dest" ? (item as Destination).region : `${(item as Tour).durationDays}d · $${(item as Tour).priceUSD.toLocaleString()}`;

    return (
        <Link href={href} target="_blank"
              style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.92)", border:`1px solid ${hovered ? "rgba(14,133,178,0.38)" : "rgba(14,133,178,0.16)"}`, borderRadius:12, padding:"7px 10px", textDecoration:"none", minWidth:175, maxWidth:215, flexShrink:0, backdropFilter:"blur(8px)", transform: hovered ? "translateY(-3px)" : "none", boxShadow: hovered ? "0 8px 20px rgba(14,133,178,0.18)" : "0 2px 6px rgba(14,133,178,0.08)", transition:"all 0.2s cubic-bezier(0.22,1,0.36,1)" }}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}>
            <div style={{ width:38, height:38, borderRadius:8, overflow:"hidden", flexShrink:0, background:"linear-gradient(135deg,#EBF8FF,#D6F0FA)" }}>
                {img ? <img src={img} alt={title} style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>{type==="dest"?"📍":"🧭"}</div>}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:"0.75rem", fontWeight:700, color:"#0A3D52", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"'Playfair Display',serif" }}>{title}</div>
                <div style={{ fontSize:"0.62rem", color:"#1A6A8A", marginTop:1 }}>{sub}</div>
            </div>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke={hovered ? "#1E9DC8" : "rgba(14,133,178,0.4)"} strokeWidth="2" strokeLinecap="round" style={{ flexShrink:0, transition:"stroke 0.2s" }}>
                <path d="M2 6h8M6 2l4 4-4 4"/>
            </svg>
        </Link>
    );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function TypewriterMarkdown({ content }: { content: string }) {
    const [displayed, setDisplayed] = useState("");
    const [done,      setDone]      = useState(false);
    const indexRef = useRef(0);

    useEffect(() => {
        indexRef.current = 0;
        setDisplayed("");
        setDone(false);

        const interval = setInterval(() => {
            const i = indexRef.current;
            if (i >= content.length) { setDone(true); clearInterval(interval); return; }
            const end = Math.min(i + 3, content.length);
            setDisplayed(content.slice(0, end));
            indexRef.current = end;
        }, 30);

        return () => clearInterval(interval);
    }, [content]);

    return (
        <>
            <MarkdownRenderer content={displayed}/>
            {!done && (
                <span style={{ display:"inline-block", width:2, height:13, background:"#1E9DC8", marginLeft:2, animation:"blink 1s step-end infinite", verticalAlign:"text-bottom" }}/>
            )}
        </>
    );
}

function MessageBubble({ msg, destinations, tours }: { msg: Message; destinations: Destination[]; tours: Tour[] }) {
    const isUser   = msg.role === "user";
    const sugDests = (msg.suggestedDestIds ?? []).map(id => destinations.find(d => d.id === id)).filter(Boolean) as Destination[];
    const sugTours = (msg.suggestedTourIds ?? []).map(id => tours.find(t => t.id === id)).filter(Boolean) as Tour[];

    return (
        <div style={{ display:"flex", gap:8, alignItems:"flex-start", flexDirection: isUser ? "row-reverse" : "row" }}>
            {!isUser && (
                <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#28B8E8,#0A6A94)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2, boxShadow:"0 2px 8px rgba(14,133,178,0.35)" }}>
                    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M10 2a8 8 0 1 0 0 16A8 8 0 0 0 10 2z"/><path d="M7 9h6M7 12h4"/>
                    </svg>
                </div>
            )}
            <div style={{ flex:1, maxWidth:"84%", display:"flex", flexDirection:"column", gap:6, alignItems: isUser ? "flex-end" : "flex-start" }}>
                <div style={{
                    background:     isUser ? "linear-gradient(135deg,#28B8E8,#0A6A94)" : "rgba(255,255,255,0.90)",
                    borderRadius:   isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                    padding:        "10px 14px",
                    border:         isUser ? "none" : "1px solid rgba(14,133,178,0.14)",
                    wordBreak:      "break-word",
                    width:          "100%",
                    boxSizing:      "border-box" as const,
                    backdropFilter: "blur(12px)",
                    boxShadow:      isUser ? "0 4px 16px rgba(14,133,178,0.28)" : "0 2px 10px rgba(14,133,178,0.08)",
                }}>
                    {isUser
                        ? <p style={{ margin:0, fontSize:"0.83rem", color:"white", lineHeight:1.65 }}>{msg.content}</p>
                        : <MarkdownRenderer content={msg.content}/>
                    }
                </div>

                {sugDests.length > 0 && (
                    <div style={{ width:"100%" }}>
                        <p style={{ fontSize:"0.58rem", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase" as const, color:"#1A6A8A", marginBottom:5 }}>📍 Destinations</p>
                        <div style={{ display:"flex", gap:6, overflowX:"auto" as const, paddingBottom:3 }}>
                            {sugDests.map(d => <SuggestedCard key={d.id} item={d} type="dest"/>)}
                        </div>
                    </div>
                )}
                {sugTours.length > 0 && (
                    <div style={{ width:"100%" }}>
                        <p style={{ fontSize:"0.58rem", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase" as const, color:"#1A6A8A", marginBottom:5 }}>🧭 Tours</p>
                        <div style={{ display:"flex", gap:6, overflowX:"auto" as const, paddingBottom:3 }}>
                            {sugTours.map(t => <SuggestedCard key={t.id} item={t} type="tour"/>)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
    return (
        <div style={{ display:"flex", alignItems:"center", gap:5, padding:"10px 14px", background:"rgba(255,255,255,0.88)", borderRadius:"4px 16px 16px 16px", border:"1px solid rgba(14,133,178,0.14)", backdropFilter:"blur(12px)", width:"fit-content", boxShadow:"0 2px 8px rgba(14,133,178,0.08)" }}>
            {[0,1,2].map(i => (
                <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#1E9DC8", animation:`dot-bounce 1.2s ease-in-out ${i*0.2}s infinite` }}/>
            ))}
        </div>
    );
}

// ── DIALOG ────────────────────────────────────────────────────────────────────
export type AIPlannerDialogProps = {
    open: boolean; onClose: () => void;
    destinations: Destination[]; tours: Tour[];
};

export default function AIPlannerDialog({ open, onClose, destinations, tours }: AIPlannerDialogProps) {
    const [messages,         setMessages]         = useState<Message[]>([]);
    const [streaming,        setStreaming]         = useState(false);
    const [streamingContent, setStreamingContent] = useState("");
    const [input,            setInput]            = useState("");
    const [t,                setT]                = useState(0);
    const conversationRef = useRef<{ role: string; content: string }[]>([]);
    const bottomRef       = useRef<HTMLDivElement>(null);
    const inputRef        = useRef<HTMLTextAreaElement>(null);
    const hasMessages     = messages.length > 0;

    // RAF — only when open
    useEffect(() => {
        if (!open) return;
        let id: number;
        const tick = (now: number) => { setT(now); id = requestAnimationFrame(tick); };
        id = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(id);
    }, [open]);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, streamingContent]);
    useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 150); }, [open]);

    useEffect(() => {
        if (!open) return;
        const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", fn);
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", fn); document.body.style.overflow = ""; };
    }, [open, onClose]);

    const sendToAI = useCallback(async (userText: string) => {
        if (!userText.trim() || streaming) return;
        setStreaming(true);
        setStreamingContent("");
        const userMsg: Message = { role:"user", content:userText.trim(), timestamp:Date.now() };
        setMessages(prev => [...prev, userMsg]);
        conversationRef.current = [...conversationRef.current, { role:"user", content:userText.trim() }];
        try {
            const res = await fetch("/api/ai-planner", {
                method:"POST", headers:{ "Content-Type":"application/json" },
                body: JSON.stringify({
                    messages: conversationRef.current,
                    destinations: destinations.map(d => ({ id:d.id, name:d.name, region:d.region, categories:d.categories, description:d.description.slice(0,200) })),
                    tours: tours.map(t => ({ id:t.id, title:t.title, priceUSD:t.priceUSD, durationDays:t.durationDays, categories:t.categories, region:t.region, description:t.description.slice(0,150) })),
                }),
            });
            if (!res.ok || !res.body) throw new Error("Failed");
            const reader  = res.body.getReader();
            const decoder = new TextDecoder();
            let full = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream:true });
                for (const line of chunk.split("\n")) {
                    if (!line.startsWith("data: ")) continue;
                    const data = line.slice(6).trim();
                    if (data === "[DONE]") break;
                    try { const p = JSON.parse(data); if (p.text) { full += p.text; setStreamingContent(full); } } catch {}
                }
            }
            const destIds = [...full.matchAll(/\[dest:([a-zA-Z0-9]+)\]/g)].map(m => m[1]);
            const tourIds = [...full.matchAll(/\[tour:([a-zA-Z0-9]+)\]/g)].map(m => m[1]);
            const clean   = full.replace(/\[dest:[a-zA-Z0-9]+\]/g,"").replace(/\[tour:[a-zA-Z0-9]+\]/g,"").trim();
            conversationRef.current = [...conversationRef.current, { role:"assistant", content:clean }];
            setMessages(prev => [...prev, { role:"assistant", content:clean, suggestedDestIds:destIds, suggestedTourIds:tourIds, timestamp:Date.now() }]);
        } catch {
            setMessages(prev => [...prev, { role:"assistant", content:"Sorry, something went wrong. Please try again.", timestamp:Date.now() }]);
        } finally { setStreaming(false); setStreamingContent(""); }
    }, [streaming, destinations, tours]);

    const send  = () => { if (!input.trim() || streaming) return; sendToAI(input.trim()); setInput(""); };
    const reset = () => { setMessages([]); setStreamingContent(""); setInput(""); conversationRef.current = []; };
    const stripTags = (s: string) => s.replace(/\[dest:[a-zA-Z0-9]+\]/g,"").replace(/\[tour:[a-zA-Z0-9]+\]/g,"");

    if (!open) return null;

    return (
        <>
            <style>{`
        @keyframes dot-bounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
        @keyframes blink       { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes spin        { to{transform:rotate(360deg)} }
        @keyframes dialog-rise { from{opacity:0;transform:translateY(28px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes fade-in     { from{opacity:0} to{opacity:1} }
        @keyframes chip-in     { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

            {/* Backdrop */}
            <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(10,61,82,0.50)", backdropFilter:"blur(8px)", zIndex:400, animation:"fade-in 0.2s ease both" }}/>

            {/* Dialog */}
            <div style={{
                position:"fixed", bottom:24, right:24, zIndex:401,
                width:"min(500px,calc(100vw - 32px))",
                height:"min(660px,calc(100vh - 88px))",
                borderRadius:22, overflow:"hidden",
                display:"flex", flexDirection:"column",
                boxShadow:"0 40px 100px rgba(14,133,178,0.30), 0 8px 28px rgba(14,133,178,0.16)",
                animation:"dialog-rise 0.32s cubic-bezier(0.22,1,0.36,1) both",
                border:"1px solid rgba(14,133,178,0.22)",
                // Underwater base colour visible behind transparent layers
                background:"linear-gradient(180deg,#062B3A 0%,#0A4558 40%,#083D50 100%)",
            }}>

                {/* ── FULL-DIALOG UNDERWATER ANIMATION ── */}
                <UnderwaterBackground t={t}/>

                {/* ── HEADER (floats above animation) ── */}
                <div style={{ position:"relative", zIndex:10, flexShrink:0, padding:"14px 16px 12px", borderBottom:"1px solid rgba(40,184,232,0.15)", background:"rgba(6,43,58,0.70)", backdropFilter:"blur(16px)" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <div style={{ width:36, height:36, borderRadius:11, background:"linear-gradient(135deg,#28B8E8,#0A6A94)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 14px rgba(14,133,178,0.45)", flexShrink:0 }}>
                                <svg width="17" height="17" viewBox="0 0 22 22" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                                    <path d="M11 2a9 9 0 1 0 0 18A9 9 0 0 0 11 2z"/><path d="M8 10h6M8 14h4"/>
                                </svg>
                            </div>
                            <div>
                                <div style={{ fontSize:"0.88rem", fontWeight:800, color:"white", letterSpacing:"-0.01em", fontFamily:"'Playfair Display',serif" }}>AI Journey Planner</div>
                                <div style={{ fontSize:"0.62rem", color:"rgba(40,184,232,0.80)", display:"flex", alignItems:"center", gap:4, fontWeight:600 }}>
                                    <span style={{ width:5, height:5, borderRadius:"50%", background:"#34D399", display:"inline-block", boxShadow:"0 0 5px #34D399" }}/>
                                    Powered by Claude
                                </div>
                            </div>
                        </div>
                        <div style={{ display:"flex", gap:5 }}>
                            {hasMessages && (
                                <button onClick={reset} title="New conversation"
                                        style={{ width:30, height:30, borderRadius:8, border:"1px solid rgba(40,184,232,0.25)", background:"rgba(40,184,232,0.10)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all 0.15s" }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background="rgba(40,184,232,0.22)"; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="rgba(40,184,232,0.10)"; }}>
                                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="rgba(235,248,255,0.80)" strokeWidth="2" strokeLinecap="round">
                                        <path d="M1 7a6 6 0 1 0 2-4.5L1 1"/><path d="M1 1v2.5H3.5"/>
                                    </svg>
                                </button>
                            )}
                            <button onClick={onClose}
                                    style={{ width:30, height:30, borderRadius:8, border:"1px solid rgba(40,184,232,0.25)", background:"rgba(40,184,232,0.10)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all 0.15s" }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background="rgba(239,68,68,0.28)"; (e.currentTarget as HTMLElement).style.borderColor="rgba(239,68,68,0.40)"; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="rgba(40,184,232,0.10)"; (e.currentTarget as HTMLElement).style.borderColor="rgba(40,184,232,0.25)"; }}>
                                <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="rgba(235,248,255,0.80)" strokeWidth="2" strokeLinecap="round">
                                    <path d="M2 2l10 10M12 2L2 12"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── MESSAGES ── */}
                <div style={{ position:"relative", zIndex:10, flex:1, overflowY:"auto", padding:"14px", display:"flex", flexDirection:"column", gap:14 }}>

                    {/* Empty state */}
                    {!hasMessages && !streaming && (
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:14, padding:"0 6px" }}>
                            <div style={{ textAlign:"center" }}>
                                <p style={{ fontSize:"1.05rem", fontWeight:700, color:"white", marginBottom:"0.3rem", fontFamily:"'Playfair Display',serif", textShadow:"0 2px 8px rgba(0,0,0,0.30)" }}>
                                    Plan your <em style={{ color:"#28B8E8", fontStyle:"italic" }}>Ethiopia</em> journey
                                </p>
                                <p style={{ fontSize:"0.78rem", color:"rgba(235,248,255,0.70)", fontWeight:300, lineHeight:1.65, maxWidth:300 }}>
                                    Tell me about your dream trip and I'll craft a personalised itinerary with real tours and destinations.
                                </p>
                            </div>

                            <div style={{ display:"flex", flexDirection:"column", gap:5, width:"100%" }}>
                                <p style={{ fontSize:"0.6rem", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"rgba(40,184,232,0.70)", textAlign:"center", marginBottom:2 }}>✦ Quick start</p>
                                {QUICK_STARTS.map((q, i) => (
                                    <button key={q} onClick={() => sendToAI(q)}
                                            style={{ padding:"9px 14px", borderRadius:12, border:"1px solid rgba(40,184,232,0.22)", background:"rgba(6,43,58,0.65)", backdropFilter:"blur(12px)", color:"rgba(235,248,255,0.90)", fontSize:"0.79rem", textAlign:"left", cursor:"pointer", lineHeight:1.4, animation:`chip-in 0.4s ease ${i*0.07}s both`, transition:"all 0.18s cubic-bezier(0.22,1,0.36,1)" }}
                                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background="rgba(14,133,178,0.35)"; (e.currentTarget as HTMLElement).style.borderColor="rgba(40,184,232,0.50)"; (e.currentTarget as HTMLElement).style.transform="translateX(5px)"; (e.currentTarget as HTMLElement).style.color="white"; }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="rgba(6,43,58,0.65)"; (e.currentTarget as HTMLElement).style.borderColor="rgba(40,184,232,0.22)"; (e.currentTarget as HTMLElement).style.transform="none"; (e.currentTarget as HTMLElement).style.color="rgba(235,248,255,0.90)"; }}>
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div key={i} style={{ animation:"chip-in 0.35s cubic-bezier(0.22,1,0.36,1) both" }}>
                            <MessageBubble msg={msg} destinations={destinations} tours={tours}/>
                        </div>
                    ))}

                    {/* Streaming bubble */}
                    {streaming && (
                        <div style={{ display:"flex", gap:8, alignItems:"flex-start", animation:"chip-in 0.3s ease both" }}>
                            <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#28B8E8,#0A6A94)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2, boxShadow:"0 2px 8px rgba(14,133,178,0.35)" }}>
                                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                                    <path d="M10 2a8 8 0 1 0 0 16A8 8 0 0 0 10 2z"/><path d="M7 9h6M7 12h4"/>
                                </svg>
                            </div>
                            <div style={{ flex:1, maxWidth:"84%" }}>
                                {streamingContent ? (
                                    <div style={{ background:"rgba(255,255,255,0.90)", borderRadius:"4px 16px 16px 16px", padding:"10px 14px", border:"1px solid rgba(14,133,178,0.14)", backdropFilter:"blur(12px)", wordBreak:"break-word", boxShadow:"0 2px 10px rgba(14,133,178,0.10)" }}>
                                        <MarkdownRenderer content={stripTags(streamingContent)}/>
                                        <span style={{ display:"inline-block", width:2, height:13, background:"#1E9DC8", marginLeft:2, animation:"blink 1s step-end infinite", verticalAlign:"text-bottom" }}/>
                                    </div>
                                ) : <TypingIndicator/>}
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef}/>
                </div>

                {/* ── SUGGESTION CHIPS ── */}
                {hasMessages && !streaming && (
                    <div style={{ position:"relative", zIndex:10, padding:"6px 12px", borderTop:"1px solid rgba(40,184,232,0.12)", display:"flex", gap:5, flexWrap: "wrap", flexShrink:0, background:"rgba(6,43,58,0.70)", backdropFilter:"blur(16px)" }}>
                        {SUGGESTIONS.map((s, i) => (
                            <button key={s} onClick={() => sendToAI(s)}
                                    style={{ whiteSpace:"nowrap", padding:"4px 10px", borderRadius:20, border:"1px solid rgba(40,184,232,0.22)", background:"rgba(14,133,178,0.12)", color:"rgba(235,248,255,0.80)", fontSize:"0.68rem", cursor:"pointer", flexShrink:0, animation:`chip-in 0.3s ease ${i*0.04}s both`, transition:"all 0.15s" }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background="linear-gradient(135deg,#28B8E8,#0A6A94)"; (e.currentTarget as HTMLElement).style.color="white"; (e.currentTarget as HTMLElement).style.borderColor="transparent"; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="rgba(14,133,178,0.12)"; (e.currentTarget as HTMLElement).style.color="rgba(235,248,255,0.80)"; (e.currentTarget as HTMLElement).style.borderColor="rgba(40,184,232,0.22)"; }}>
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                {/* ── INPUT ── */}
                <div style={{ position:"relative", zIndex:10, padding:"10px 12px", borderTop:"1px solid rgba(40,184,232,0.12)", background:"rgba(6,43,58,0.80)", backdropFilter:"blur(20px)", flexShrink:0 }}>
                    <div style={{ display:"flex", gap:8, alignItems:"flex-end", background:"rgba(255,255,255,0.08)", borderRadius:14, border:"1.5px solid rgba(40,184,232,0.25)", padding:"7px 8px 7px 12px", transition:"border-color 0.2s, box-shadow 0.2s" }}
                         onFocusCapture={e => { (e.currentTarget as HTMLElement).style.borderColor="rgba(40,184,232,0.60)"; (e.currentTarget as HTMLElement).style.boxShadow="0 0 0 3px rgba(40,184,232,0.12)"; }}
                         onBlurCapture={e  => { (e.currentTarget as HTMLElement).style.borderColor="rgba(40,184,232,0.25)"; (e.currentTarget as HTMLElement).style.boxShadow="none"; }}>
            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                      placeholder="Tell me about your dream Ethiopia trip…"
                      rows={1} disabled={streaming}
                      style={{ flex:1, border:"none", background:"transparent", resize:"none", fontSize:"0.83rem", color:"rgba(235,248,255,0.92)", outline:"none", fontFamily:"inherit", lineHeight:1.5, maxHeight:100, overflowY:"auto" }}
            />
                        <button onClick={send} disabled={!input.trim() || streaming}
                                style={{ width:32, height:32, borderRadius:10, border:"none", background: input.trim() && !streaming ? "linear-gradient(135deg,#28B8E8,#0A6A94)" : "rgba(40,184,232,0.15)", display:"flex", alignItems:"center", justifyContent:"center", cursor: input.trim() && !streaming ? "pointer" : "default", transition:"all 0.18s", flexShrink:0, boxShadow: input.trim() && !streaming ? "0 3px 12px rgba(14,133,178,0.40)" : "none" }}>
                            {streaming
                                ? <div style={{ width:12, height:12, borderRadius:"50%", border:"2px solid rgba(40,184,232,0.25)", borderTop:"2px solid #28B8E8", animation:"spin 0.7s linear infinite" }}/>
                                : <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke={input.trim() ? "white" : "rgba(40,184,232,0.50)"} strokeWidth="2" strokeLinecap="round"><path d="M15 1L8 8M15 1L10 14l-2-6-6-2L15 1z"/></svg>
                            }
                        </button>
                    </div>
                    <p style={{ fontSize:"0.58rem", color:"rgba(40,184,232,0.38)", textAlign:"center", marginTop:5 }}>
                        AI-generated · verify details before booking
                    </p>
                </div>
            </div>
        </>
    );
}