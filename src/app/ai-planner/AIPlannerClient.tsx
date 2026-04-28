// src/app/ai-planner/AIPlannerClient.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type Destination = { id: string; name: string; region: string; categories: string[]; description: string; images: string[]; avgRating: number };
type Tour        = { id: string; title: string; priceUSD: number; durationDays: number; categories: string[]; description: string; images: string[]; avgRating: number; region: string };

type Message = {
    role: "user" | "assistant";
    content: string;
    suggestedTourIds?: string[];
    suggestedDestIds?: string[];
    timestamp: number;
};

type TripForm = {
    duration:     string;
    budget:       string;
    travelers:    string;
    style:        string[];
    destinations: string;
    dietary:      string;
    arrivalCity:  string;
};

const TRAVEL_STYLES = [
    { key: "adventure",   label: "Adventure",   icon: "⛰" },
    { key: "culture",     label: "Culture",     icon: "🏛" },
    { key: "nature",      label: "Nature",      icon: "🌿" },
    { key: "religious",   label: "Religious",   icon: "⛪" },
    { key: "relaxation",  label: "Relaxation",  icon: "🌅" },
    { key: "photography", label: "Photography", icon: "📸" },
    { key: "wildlife",    label: "Wildlife",    icon: "🦁" },
    { key: "history",     label: "History",     icon: "📜" },
];

const BUDGETS = [
    { key: "budget",  label: "Budget",    sub: "< $800",      icon: "💰" },
    { key: "mid",     label: "Mid-range", sub: "$800–$2000",  icon: "💳" },
    { key: "luxury",  label: "Luxury",    sub: "$2000–$5000", icon: "💎" },
    { key: "premium", label: "Premium",   sub: "$5000+",      icon: "✨" },
];

const ARRIVAL_CITIES = ["Addis Ababa", "Lalibela", "Axum", "Gondar", "Dire Dawa", "Mekele", "Other"];

// ── HELPERS ───────────────────────────────────────────────────────────────────
function Avatar({ role }: { role: "user" | "assistant" }) {
    if (role === "assistant") {
        return (
            <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#28B8E8,#0A6A94)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 2px 10px rgba(14,133,178,0.30)" }}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round">
                    <path d="M10 2a8 8 0 1 0 0 16A8 8 0 0 0 10 2z"/>
                    <path d="M7 9h6M7 12h4"/>
                </svg>
            </div>
        );
    }
    return (
        <div style={{ width:36, height:36, borderRadius:"50%", background:"rgba(14,133,178,0.12)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#1E9DC8" strokeWidth="1.6" strokeLinecap="round">
                <circle cx="10" cy="7" r="3.5"/>
                <path d="M3 18c0-3.5 3-6 7-6s7 2.5 7 6"/>
            </svg>
        </div>
    );
}

function TypingIndicator() {
    return (
        <div style={{ display:"flex", alignItems:"center", gap:4, padding:"12px 16px", background:"#F8FCFF", borderRadius:"4px 18px 18px 18px", border:"1px solid rgba(14,133,178,0.10)", width:"fit-content" }}>
            {[0,1,2].map(i => (
                <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:"#1E9DC8", animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite` }}/>
            ))}
        </div>
    );
}

function SuggestedCard({ item, type }: { item: Destination | Tour; type: "dest" | "tour" }) {
    const href  = type === "dest" ? `/destinations/${item.id}` : `/tours/${item.id}`;
    const img   = item.images?.[0];
    const title = type === "dest" ? (item as Destination).name : (item as Tour).title;
    const sub   = type === "dest"
        ? `${(item as Destination).region} · ${(item as Destination).categories[0] ?? "Destination"}`
        : `${(item as Tour).durationDays}d · $${(item as Tour).priceUSD.toLocaleString()}`;
    const rating = item.avgRating;

    return (
        <Link href={href} target="_blank"
              style={{ display:"flex", alignItems:"center", gap:10, background:"white", border:"1px solid rgba(14,133,178,0.14)", borderRadius:12, padding:"8px 10px", textDecoration:"none", minWidth:220, maxWidth:260, transition:"all 0.18s", flexShrink:0 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(14,133,178,0.14)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.transform = "none"; }}>
            <div style={{ width:48, height:48, borderRadius:10, overflow:"hidden", flexShrink:0, background:"linear-gradient(135deg,#EBF8FF,#D6F0FA)" }}>
                {img ? <img src={img} alt={title} style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{type === "dest" ? "📍" : "🧭"}</div>}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:"0.78rem", fontWeight:700, color:"#0A3D52", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", fontFamily:"'Playfair Display',serif" }}>{title}</div>
                <div style={{ fontSize:"0.65rem", color:"#1A6A8A", marginTop:1 }}>{sub}</div>
                {rating > 0 && (
                    <div style={{ fontSize:"0.62rem", color:"#F59E0B", marginTop:1 }}>{"★".repeat(Math.round(rating))} {rating.toFixed(1)}</div>
                )}
            </div>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#1E9DC8" strokeWidth="2" strokeLinecap="round">
                <path d="M2 6h8M6 2l4 4-4 4"/>
            </svg>
        </Link>
    );
}

function MessageBubble({ msg, destinations, tours }: { msg: Message; destinations: Destination[]; tours: Tour[] }) {
    const isUser = msg.role === "user";

    const sugDests = (msg.suggestedDestIds ?? []).map(id => destinations.find(d => d.id === id)).filter(Boolean) as Destination[];
    const sugTours = (msg.suggestedTourIds ?? []).map(id => tours.find(t => t.id === id)).filter(Boolean) as Tour[];

    return (
        <div style={{ display:"flex", gap:10, alignItems:"flex-start", flexDirection: isUser ? "row-reverse" : "row" }}>
            <Avatar role={msg.role}/>
            <div style={{ flex:1, maxWidth:"85%", display:"flex", flexDirection:"column", gap:8, alignItems: isUser ? "flex-end" : "flex-start" }}>
                <div style={{
                    background:   isUser ? "linear-gradient(135deg,#28B8E8,#0A6A94)" : "#F8FCFF",
                    color:        isUser ? "white" : "#0A3D52",
                    borderRadius: isUser ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
                    padding:      "12px 16px",
                    fontSize:     "0.875rem",
                    lineHeight:   1.65,
                    border:       isUser ? "none" : "1px solid rgba(14,133,178,0.10)",
                    whiteSpace:   "pre-wrap",
                }}>
                    {msg.content}
                </div>

                {/* Suggested destinations */}
                {sugDests.length > 0 && (
                    <div>
                        <p style={{ fontSize:"0.65rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#1A6A8A", marginBottom:6 }}>📍 Suggested destinations</p>
                        <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4 }}>
                            {sugDests.map(d => <SuggestedCard key={d.id} item={d} type="dest"/>)}
                        </div>
                    </div>
                )}

                {/* Suggested tours */}
                {sugTours.length > 0 && (
                    <div>
                        <p style={{ fontSize:"0.65rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#1A6A8A", marginBottom:6 }}>🧭 Suggested tours</p>
                        <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4 }}>
                            {sugTours.map(t => <SuggestedCard key={t.id} item={t} type="tour"/>)}
                        </div>
                    </div>
                )}

                <span style={{ fontSize:"0.6rem", color:"rgba(26,106,138,0.45)" }}>
          {new Date(msg.timestamp).toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" })}
        </span>
            </div>
        </div>
    );
}

// ── INTAKE FORM ───────────────────────────────────────────────────────────────
function IntakeForm({ onSubmit, destinations }: {
    onSubmit: (form: TripForm) => void;
    destinations: Destination[];
}) {
    const [form, setForm] = useState<TripForm>({
        duration: "7", budget: "mid", travelers: "2",
        style: [], destinations: "", dietary: "", arrivalCity: "Addis Ababa",
    });

    const toggle = (key: string) => {
        setForm(f => ({
            ...f,
            style: f.style.includes(key) ? f.style.filter(s => s !== key) : [...f.style, key],
        }));
    };

    const canSubmit = form.duration && form.budget && form.style.length > 0;

    const labelCls: React.CSSProperties = { fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#1A6A8A", display:"block", marginBottom:6 };
    const inputCls: React.CSSProperties = { width:"100%", borderRadius:12, border:"1.5px solid rgba(14,133,178,0.18)", padding:"10px 14px", fontSize:"0.87rem", color:"#0A3D52", outline:"none", fontFamily:"inherit", boxSizing:"border-box", background:"white", transition:"border-color 0.15s" };

    return (
        <div style={{ maxWidth:620, margin:"0 auto", padding:"0 1rem" }}>
            {/* Header */}
            <div style={{ textAlign:"center", marginBottom:"2rem" }}>
                <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:64, height:64, borderRadius:"50%", background:"linear-gradient(135deg,#28B8E8,#0A6A94)", marginBottom:"1rem", boxShadow:"0 8px 24px rgba(14,133,178,0.30)" }}>
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M14 3a11 11 0 1 0 0 22A11 11 0 0 0 14 3z"/>
                        <path d="M10 13h8M10 17h5"/>
                    </svg>
                </div>
                <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.6rem", fontWeight:700, color:"#0A3D52", marginBottom:"0.4rem", letterSpacing:"-0.02em" }}>
                    Plan your Ethiopia journey
                </h2>
                <p style={{ fontSize:"0.87rem", color:"#1A6A8A", fontWeight:300, lineHeight:1.6 }}>
                    Tell us a little about your trip and our AI will craft a personalised itinerary — then refine it in chat.
                </p>
            </div>

            <div style={{ background:"white", borderRadius:20, border:"1px solid rgba(14,133,178,0.12)", boxShadow:"0 8px 32px rgba(14,133,178,0.08)", padding:"1.75rem", display:"flex", flexDirection:"column", gap:"1.5rem" }}>

                {/* Duration + travelers */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
                    <div>
                        <label style={labelCls}>Trip duration (days)</label>
                        <input type="number" min={1} max={30} value={form.duration}
                               onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                               style={inputCls}
                               onFocus={e => (e.target.style.borderColor = "#1E9DC8")}
                               onBlur={e  => (e.target.style.borderColor = "rgba(14,133,178,0.18)")}
                        />
                    </div>
                    <div>
                        <label style={labelCls}>Number of travelers</label>
                        <input type="number" min={1} max={20} value={form.travelers}
                               onChange={e => setForm(f => ({ ...f, travelers: e.target.value }))}
                               style={inputCls}
                               onFocus={e => (e.target.style.borderColor = "#1E9DC8")}
                               onBlur={e  => (e.target.style.borderColor = "rgba(14,133,178,0.18)")}
                        />
                    </div>
                </div>

                {/* Arrival city */}
                <div>
                    <label style={labelCls}>Arrival city</label>
                    <select value={form.arrivalCity} onChange={e => setForm(f => ({ ...f, arrivalCity: e.target.value }))}
                            style={{ ...inputCls, cursor:"pointer" }}>
                        {ARRIVAL_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {/* Budget */}
                <div>
                    <label style={labelCls}>Budget per person</label>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.6rem" }}>
                        {BUDGETS.map(b => {
                            const active = form.budget === b.key;
                            return (
                                <button key={b.key} type="button" onClick={() => setForm(f => ({ ...f, budget: b.key }))}
                                        style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderRadius:12, border:`1.5px solid ${active ? "#1E9DC8" : "rgba(14,133,178,0.16)"}`, background: active ? "linear-gradient(135deg,#EBF8FF,#D6F0FA)" : "white", cursor:"pointer", transition:"all 0.15s", textAlign:"left" }}>
                                    <span style={{ fontSize:"1.1rem" }}>{b.icon}</span>
                                    <div>
                                        <div style={{ fontSize:"0.8rem", fontWeight:700, color: active ? "#0A3D52" : "#1A6A8A" }}>{b.label}</div>
                                        <div style={{ fontSize:"0.65rem", color:"#1A6A8A" }}>{b.sub}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Travel style */}
                <div>
                    <label style={labelCls}>Travel style <span style={{ fontWeight:400, opacity:0.6 }}>(pick all that apply)</span></label>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem" }}>
                        {TRAVEL_STYLES.map(s => {
                            const active = form.style.includes(s.key);
                            return (
                                <button key={s.key} type="button" onClick={() => toggle(s.key)}
                                        style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:20, border:`1.5px solid ${active ? "#1E9DC8" : "rgba(14,133,178,0.16)"}`, background: active ? "linear-gradient(135deg,#28B8E8,#0A6A94)" : "white", color: active ? "white" : "#1A6A8A", fontSize:"0.8rem", fontWeight: active ? 700 : 400, cursor:"pointer", transition:"all 0.15s" }}>
                                    <span>{s.icon}</span> {s.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Specific destinations */}
                <div>
                    <label style={labelCls}>Destinations you must visit <span style={{ fontWeight:400, opacity:0.6 }}>(optional)</span></label>
                    <input
                        list="dest-list"
                        value={form.destinations}
                        onChange={e => setForm(f => ({ ...f, destinations: e.target.value }))}
                        placeholder="e.g. Lalibela, Simien Mountains…"
                        style={inputCls}
                        onFocus={e => (e.target.style.borderColor = "#1E9DC8")}
                        onBlur={e  => (e.target.style.borderColor = "rgba(14,133,178,0.18)")}
                    />
                    <datalist id="dest-list">
                        {destinations.map(d => <option key={d.id} value={d.name}/>)}
                    </datalist>
                </div>

                {/* Dietary / accessibility */}
                <div>
                    <label style={labelCls}>Dietary / accessibility needs <span style={{ fontWeight:400, opacity:0.6 }}>(optional)</span></label>
                    <input
                        value={form.dietary}
                        onChange={e => setForm(f => ({ ...f, dietary: e.target.value }))}
                        placeholder="e.g. vegetarian, wheelchair accessible…"
                        style={inputCls}
                        onFocus={e => (e.target.style.borderColor = "#1E9DC8")}
                        onBlur={e  => (e.target.style.borderColor = "rgba(14,133,178,0.18)")}
                    />
                </div>

                <button
                    type="button"
                    disabled={!canSubmit}
                    onClick={() => onSubmit(form)}
                    style={{ width:"100%", padding:"14px", borderRadius:14, border:"none", background: canSubmit ? "linear-gradient(135deg,#28B8E8,#0A6A94)" : "rgba(14,133,178,0.12)", color: canSubmit ? "white" : "#1A6A8A", fontSize:"0.95rem", fontWeight:700, cursor: canSubmit ? "pointer" : "not-allowed", boxShadow: canSubmit ? "0 4px 20px rgba(14,133,178,0.35)" : "none", transition:"all 0.2s" }}>
                    {canSubmit ? "✨ Build my itinerary →" : "Select at least one travel style"}
                </button>
            </div>
        </div>
    );
}

// ── CHAT INTERFACE ────────────────────────────────────────────────────────────
function ChatInterface({ messages, streaming, streamingContent, onSend, destinations, tours, onReset }: {
    messages: Message[];
    streaming: boolean;
    streamingContent: string;
    onSend: (text: string) => void;
    destinations: Destination[];
    tours: Tour[];
    onReset: () => void;
}) {
    const [input, setInput] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, streamingContent]);

    const send = () => {
        if (!input.trim() || streaming) return;
        onSend(input.trim());
        setInput("");
    };

    const suggestions = [
        "Can you add more adventure activities?",
        "What should I pack?",
        "Make it more budget-friendly",
        "What's the best time to go?",
        "Add a rest day in Addis",
    ];

    return (
        <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 64px - 56px)", maxWidth:760, margin:"0 auto", width:"100%" }}>

            {/* Header bar */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderBottom:"1px solid rgba(14,133,178,0.08)", background:"rgba(255,255,255,0.95)", backdropFilter:"blur(10px)", flexShrink:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#28B8E8,#0A6A94)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 10px rgba(14,133,178,0.30)" }}>
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                            <path d="M14 3a11 11 0 1 0 0 22A11 11 0 0 0 14 3z"/>
                            <path d="M10 13h8M10 17h5"/>
                        </svg>
                    </div>
                    <div>
                        <div style={{ fontSize:"0.87rem", fontWeight:700, color:"#0A3D52" }}>Tizitaw AI Planner</div>
                        <div style={{ fontSize:"0.65rem", color:"#10B981", display:"flex", alignItems:"center", gap:4 }}>
                            <span style={{ width:5, height:5, borderRadius:"50%", background:"#10B981", display:"inline-block" }}/>
                            Active
                        </div>
                    </div>
                </div>
                <button onClick={onReset}
                        style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:20, border:"1.5px solid rgba(14,133,178,0.18)", background:"white", color:"#1A6A8A", fontSize:"0.75rem", cursor:"pointer", transition:"all 0.15s" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#EBF8FF"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "white"; }}>
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M1 7a6 6 0 1 0 2-4.5L1 1"/>
                        <path d="M1 1v2.5H3.5"/>
                    </svg>
                    New plan
                </button>
            </div>

            {/* Messages */}
            <div style={{ flex:1, overflowY:"auto", padding:"20px 16px", display:"flex", flexDirection:"column", gap:20 }}>
                {messages.map((msg, i) => (
                    <MessageBubble key={i} msg={msg} destinations={destinations} tours={tours}/>
                ))}

                {/* Streaming */}
                {streaming && (
                    <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                        <Avatar role="assistant"/>
                        <div style={{ flex:1, maxWidth:"85%" }}>
                            {streamingContent ? (
                                <div style={{ background:"#F8FCFF", color:"#0A3D52", borderRadius:"4px 18px 18px 18px", padding:"12px 16px", fontSize:"0.875rem", lineHeight:1.65, border:"1px solid rgba(14,133,178,0.10)", whiteSpace:"pre-wrap" }}>
                                    {streamingContent}
                                    <span style={{ display:"inline-block", width:2, height:14, background:"#1E9DC8", marginLeft:2, animation:"blink 1s step-end infinite", verticalAlign:"text-bottom" }}/>
                                </div>
                            ) : (
                                <TypingIndicator/>
                            )}
                        </div>
                    </div>
                )}
                <div ref={bottomRef}/>
            </div>

            {/* Suggestions */}
            {!streaming && messages.length > 0 && (
                <div style={{ padding:"8px 16px", borderTop:"1px solid rgba(14,133,178,0.06)", display:"flex", gap:6, overflowX:"auto", flexShrink:0 }}>
                    {suggestions.map(s => (
                        <button key={s} onClick={() => onSend(s)}
                                style={{ whiteSpace:"nowrap", padding:"5px 12px", borderRadius:20, border:"1px solid rgba(14,133,178,0.18)", background:"white", color:"#1A6A8A", fontSize:"0.72rem", cursor:"pointer", transition:"all 0.15s", flexShrink:0 }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#EBF8FF"; (e.currentTarget as HTMLElement).style.borderColor = "#1E9DC8"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "white"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(14,133,178,0.18)"; }}>
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div style={{ padding:"12px 16px", borderTop:"1px solid rgba(14,133,178,0.08)", background:"rgba(255,255,255,0.95)", backdropFilter:"blur(10px)", flexShrink:0 }}>
                <div style={{ display:"flex", gap:8, alignItems:"flex-end", background:"#F8FCFF", borderRadius:16, border:"1.5px solid rgba(14,133,178,0.18)", padding:"8px 8px 8px 14px", transition:"border-color 0.15s" }}
                     onFocusCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = "#1E9DC8"; }}
                     onBlurCapture={e  => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(14,133,178,0.18)"; }}>
          <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask anything about your itinerary…"
              rows={1}
              disabled={streaming}
              style={{ flex:1, border:"none", background:"transparent", resize:"none", fontSize:"0.875rem", color:"#0A3D52", outline:"none", fontFamily:"inherit", lineHeight:1.5, maxHeight:120, overflowY:"auto" }}
          />
                    <button onClick={send} disabled={!input.trim() || streaming}
                            style={{ width:36, height:36, borderRadius:10, border:"none", background: input.trim() && !streaming ? "linear-gradient(135deg,#28B8E8,#0A6A94)" : "rgba(14,133,178,0.10)", display:"flex", alignItems:"center", justifyContent:"center", cursor: input.trim() && !streaming ? "pointer" : "default", transition:"all 0.15s", flexShrink:0 }}>
                        {streaming ? (
                            <div style={{ width:14, height:14, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTop:"2px solid #1E9DC8", animation:"spin 0.7s linear infinite" }}/>
                        ) : (
                            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={input.trim() ? "white" : "#1A6A8A"} strokeWidth="2" strokeLinecap="round">
                                <path d="M15 1L8 8M15 1L10 14l-2-6-6-2L15 1z"/>
                            </svg>
                        )}
                    </button>
                </div>
                <p style={{ fontSize:"0.62rem", color:"rgba(26,106,138,0.45)", textAlign:"center", marginTop:6 }}>
                    AI-generated plans — always verify details before booking.
                </p>
            </div>
        </div>
    );
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function AIPlannerClient({ destinations, tours }: {
    destinations: Destination[];
    tours: Tour[];
}) {
    const [phase,            setPhase]            = useState<"form" | "chat">("form");
    const [messages,         setMessages]         = useState<Message[]>([]);
    const [streaming,        setStreaming]        = useState(false);
    const [streamingContent, setStreamingContent] = useState("");
    const conversationRef = useRef<{ role: string; content: string }[]>([]);

    async function sendToAI(userText: string, isFirstMessage = false) {
        setStreaming(true);
        setStreamingContent("");

        const userMsg: Message = { role: "user", content: userText, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);

        conversationRef.current = [
            ...conversationRef.current,
            { role: "user", content: userText },
        ];

        try {
            const res = await fetch("/api/ai-planner", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                    messages:     conversationRef.current,
                    destinations: destinations.map(d => ({ id: d.id, name: d.name, region: d.region, categories: d.categories, description: d.description.slice(0, 200) })),
                    tours:        tours.map(t => ({ id: t.id, title: t.title, priceUSD: t.priceUSD, durationDays: t.durationDays, categories: t.categories, region: t.region, description: t.description.slice(0, 150) })),
                }),
            });

            if (!res.ok || !res.body) throw new Error("Failed");

            const reader  = res.body.getReader();
            const decoder = new TextDecoder();
            let full = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                // Parse SSE lines
                for (const line of chunk.split("\n")) {
                    if (!line.startsWith("data: ")) continue;
                    const data = line.slice(6).trim();
                    if (data === "[DONE]") break;
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.text) {
                            full += parsed.text;
                            setStreamingContent(full);
                        }
                    } catch {}
                }
            }

            // Extract IDs the model suggested — look for patterns like [dest:ID] [tour:ID]
            const destIds = [...full.matchAll(/\[dest:([a-zA-Z0-9]+)\]/g)].map(m => m[1]);
            const tourIds = [...full.matchAll(/\[tour:([a-zA-Z0-9]+)\]/g)].map(m => m[1]);

            // Clean the markers from displayed text
            const cleanText = full.replace(/\[dest:[a-zA-Z0-9]+\]/g, "").replace(/\[tour:[a-zA-Z0-9]+\]/g, "").trim();

            const assistantMsg: Message = {
                role: "assistant",
                content: cleanText,
                suggestedDestIds: destIds,
                suggestedTourIds: tourIds,
                timestamp: Date.now(),
            };

            conversationRef.current = [...conversationRef.current, { role: "assistant", content: cleanText }];
            setMessages(prev => [...prev, assistantMsg]);
        } catch (err) {
            const errMsg: Message = {
                role: "assistant",
                content: "Sorry, something went wrong. Please try again.",
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, errMsg]);
        } finally {
            setStreaming(false);
            setStreamingContent("");
        }
    }

    function handleFormSubmit(form: TripForm) {
        setPhase("chat");
        const styleList = form.style.join(", ");
        const prompt = `Please create a personalised ${form.duration}-day Ethiopia itinerary for ${form.travelers} traveler${Number(form.travelers) !== 1 ? "s" : ""}.

Travel details:
- Budget: ${BUDGETS.find(b => b.key === form.budget)?.label} (${BUDGETS.find(b => b.key === form.budget)?.sub} per person)
- Travel style: ${styleList}
- Arrival city: ${form.arrivalCity}
${form.destinations ? `- Must-visit destinations: ${form.destinations}` : ""}
${form.dietary ? `- Dietary / accessibility needs: ${form.dietary}` : ""}

Please include:
1. A day-by-day itinerary with specific destinations and activities
2. Suggested tours from the platform where relevant
3. Estimated budget breakdown
4. Best time to visit advice for these regions
5. Essential packing tips for this travel style

For each destination or tour you recommend that exists on our platform, include its ID tag like [dest:ID] or [tour:ID] so it can be shown as a card.`;

        sendToAI(prompt, true);
    }

    return (
        <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#F0F9FF 0%,#fff 50%,#F0F9FF 100%)", paddingTop:64 }}>
            <style>{`
        @keyframes bounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
        @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(14,133,178,0.2); border-radius:4px; }
      `}</style>

            {phase === "form" ? (
                <div style={{ padding:"3rem 1rem" }}>
                    {/* Page title */}
                    <div style={{ textAlign:"center", marginBottom:"1.5rem" }}>
                        <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#EBF8FF", border:"1px solid rgba(14,133,178,0.18)", borderRadius:20, padding:"0.3rem 0.8rem", fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.14em", color:"#1E9DC8", textTransform:"uppercase", marginBottom:"0.75rem" }}>
                            🤖 Powered by Claude AI
                        </div>
                    </div>
                    <IntakeForm onSubmit={handleFormSubmit} destinations={destinations}/>
                </div>
            ) : (
                <ChatInterface
                    messages={messages}
                    streaming={streaming}
                    streamingContent={streamingContent}
                    onSend={text => sendToAI(text)}
                    destinations={destinations}
                    tours={tours}
                    onReset={() => {
                        setPhase("form");
                        setMessages([]);
                        setStreamingContent("");
                        conversationRef.current = [];
                    }}
                />
            )}
        </div>
    );
}