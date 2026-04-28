// src/app/contact/ContactClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Dropdown from "@/src/components/ui/Dropdown";

const TOPICS = [
    { value: "booking",   label: "Booking help"           },
    { value: "itinerary", label: "Itinerary planning"     },
    { value: "operator",  label: "Become an operator"     },
    { value: "technical", label: "Technical issue"        },
    { value: "payment",   label: "Payment or refund"      },
    { value: "feedback",  label: "Feedback & suggestions" },
    { value: "other",     label: "Something else"         },
];

const CONTACT_METHODS = [
    {
        icon: <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M2 6l9 6 9-6"/></svg>,
        label: "Email us",   value: "hello@tizitawethiopia.com", href: "mailto:hello@tizitawethiopia.com",
        sub: "We reply within 24 hours", color:"#1E9DC8", bg:"#EBF8FF",
    },
    {
        icon: <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M21 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6A16 16 0 0 0 14 14.09l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 15.4v.52z"/></svg>,
        label: "Call us",    value: "+251 11 234 5678",           href: "tel:+251112345678",
        sub: "Mon–Fri, 8am–6pm EAT", color:"#065F46", bg:"#D1FAE5",
    },
    {
        icon: <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
        label: "Live chat",  value: "Chat with AI planner",       href: "#",
        sub: "Available 24/7", color:"#6D28D9", bg:"#EDE9FE",
    },
    {
        icon: <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>,
        label: "GitHub",     value: "Report a bug",               href: "https://github.com",
        sub: "Open source & issues", color:"#0A3D52", bg:"#F0F9FF",
    },
];

const FAQ = [
    { q:"How do I modify or cancel a booking?", a:"Log in to your account and go to My Bookings. From there you can view your booking details, request modifications, or initiate a cancellation. Cancellation terms depend on how far in advance you cancel — see our Terms for details." },
    { q:"What payment methods do you accept?", a:"We accept all major credit and debit cards via Stripe for international payments. Ethiopian users can also pay locally via Chapa (Telebirr, CBE, and other local methods). All transactions are encrypted and PCI-compliant." },
    { q:"Are your tour operators licensed?", a:"Yes. Every operator on the platform is verified by our team before listing. We check their Ethiopian Tourism Organization license, guide credentials, insurance, and past traveler reviews." },
    { q:"Can the AI planner book tours for me?", a:"The AI planner helps you discover and plan your itinerary, but doesn't complete bookings automatically. Once you have a plan you love, you can click through to book any tour directly through the platform." },
    { q:"Do you offer group discounts?", a:"Many operators offer group rates for parties of 6 or more. Contact us with your group size and travel dates and we'll help you negotiate the best rate." },
];

function FAQItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div style={{ borderBottom:"1px solid rgba(14,133,178,0.08)" }}>
            <button onClick={() => setOpen(v => !v)}
                    style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, padding:"1rem 0", background:"none", border:"none", cursor:"pointer", textAlign:"left" }}>
                <span style={{ fontSize:"0.875rem", fontWeight:600, color:"#0A3D52", lineHeight:1.45 }}>{q}</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#1A6A8A" strokeWidth="2" strokeLinecap="round"
                     style={{ flexShrink:0, transform:open?"rotate(180deg)":"none", transition:"transform 0.2s" }}>
                    <path d="M2 5l5 5 5-5"/>
                </svg>
            </button>
            {open && <p style={{ fontSize:"0.83rem", color:"#1A6A8A", lineHeight:1.75, paddingBottom:"1rem", margin:0 }}>{a}</p>}
        </div>
    );
}

export default function ContactClient() {
    const [form,    setForm]    = useState({ name:"", email:"", topic:"", message:"" });
    const [sending, setSending] = useState(false);
    const [sent,    setSent]    = useState(false);
    const [errors,  setErrors]  = useState<Record<string, string>>({});

    function validate() {
        const e: Record<string, string> = {};
        if (!form.name.trim()) e.name = "Name is required";
        if (!form.email.trim()) e.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
        if (!form.topic) e.topic = "Please select a topic";
        if (form.message.trim().length < 10) e.message = "Message must be at least 10 characters";
        return e;
    }

    async function handleSubmit() {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        setErrors({});
        setSending(true);
        await new Promise(r => setTimeout(r, 1200));
        setSending(false);
        setSent(true);
    }

    function fieldStyle(field: string): React.CSSProperties {
        const hasError = !!errors[field];
        return {
            width:"100%", borderRadius:12, border:`1.5px solid ${hasError ? "#F87171" : "rgba(14,133,178,0.18)"}`,
            background: hasError ? "#FFF5F5" : "white",
            padding:"12px 16px", fontSize:"0.875rem", color:"#0A3D52",
            outline:"none", fontFamily:"inherit", boxSizing:"border-box" as const,
            transition:"border-color 0.15s",
        };
    }

    const label: React.CSSProperties = { display:"block", fontSize:"0.8rem", fontWeight:700, color:"#0A3D52", marginBottom:6 };

    return (
        <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#F0F9FF 0%,#fff 45%,#F0F9FF 100%)", paddingTop:64 }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fade-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}} input:focus,select:focus,textarea:focus{border-color:#1E9DC8!important;box-shadow:0 0 0 3px rgba(30,157,200,0.10)}`}</style>

            {/* ── HERO ── */}
            <div style={{ position:"relative", overflow:"hidden", borderBottom:"1px solid rgba(14,133,178,0.08)", padding:"4rem 1.5rem 3.5rem", background:"linear-gradient(160deg,#EBF8FF 0%,#fff 55%,#EBF8FF 100%)" }}>
                {[{l:"6%",t:"20%",s:360,c:"rgba(40,184,232,0.10)"},{l:"88%",t:"15%",s:420,c:"rgba(14,133,178,0.08)"},{l:"50%",t:"80%",s:260,c:"rgba(40,184,232,0.07)"}].map((o,i)=>(
                    <div key={i} style={{ position:"absolute", left:o.l, top:o.t, width:o.s, height:o.s, borderRadius:"50%", background:`radial-gradient(circle,${o.c} 0%,transparent 70%)`, transform:"translate(-50%,-50%)", pointerEvents:"none" }}/>
                ))}
                <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle,rgba(14,133,178,0.09) 1px,transparent 1px)", backgroundSize:"30px 30px", WebkitMaskImage:"radial-gradient(ellipse 80% 100% at 50% 0%,black 20%,transparent 100%)", maskImage:"radial-gradient(ellipse 80% 100% at 50% 0%,black 20%,transparent 100%)", pointerEvents:"none" }}/>
                <div style={{ position:"relative", maxWidth:960, margin:"0 auto", textAlign:"center" }}>
                    <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#EBF8FF", border:"1px solid rgba(14,133,178,0.18)", borderRadius:20, padding:"0.3rem 0.8rem", fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.14em", color:"#1E9DC8", textTransform:"uppercase", marginBottom:"1rem" }}>
                        💬 Contact us
                    </div>
                    <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(2rem,4vw,3.2rem)", fontWeight:700, color:"#0A3D52", letterSpacing:"-0.025em", marginBottom:"0.75rem", lineHeight:1.15 }}>
                        We're here to help
                    </h1>
                    <p style={{ fontSize:"1rem", fontWeight:300, color:"#1A6A8A", lineHeight:1.7, maxWidth:480, margin:"0 auto" }}>
                        Whether you're planning your first Ethiopia trip or need help with an existing booking — our team is ready.
                    </p>
                </div>
            </div>

            <div style={{ maxWidth:1060, margin:"0 auto", padding:"3rem 1.5rem" }}>

                {/* ── CONTACT METHOD CARDS ── */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"1rem", marginBottom:"3rem" }} className="ct-methods">
                    {CONTACT_METHODS.map(m => (
                        <a key={m.label} href={m.href} target={m.href.startsWith("http")?"_blank":undefined} rel="noopener noreferrer"
                           style={{ display:"flex", alignItems:"flex-start", gap:14, padding:"1.25rem", borderRadius:16, border:"1px solid rgba(14,133,178,0.10)", background:"white", textDecoration:"none", transition:"all 0.22s cubic-bezier(0.22,1,0.36,1)", boxShadow:"0 2px 10px rgba(14,133,178,0.05)" }}
                           onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(-4px)";(e.currentTarget as HTMLElement).style.boxShadow="0 14px 36px rgba(14,133,178,0.14)";(e.currentTarget as HTMLElement).style.borderColor="rgba(14,133,178,0.25)";}}
                           onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform="none";(e.currentTarget as HTMLElement).style.boxShadow="0 2px 10px rgba(14,133,178,0.05)";(e.currentTarget as HTMLElement).style.borderColor="rgba(14,133,178,0.10)";}}>
                            <div style={{ width:44, height:44, borderRadius:12, background:m.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:m.color }}>
                                {m.icon}
                            </div>
                            <div>
                                <p style={{ fontSize:"0.8rem", fontWeight:700, color:"#0A3D52", margin:"0 0 2px" }}>{m.label}</p>
                                <p style={{ fontSize:"0.83rem", fontWeight:600, color:m.color, margin:"0 0 2px" }}>{m.value}</p>
                                <p style={{ fontSize:"0.7rem", color:"#1A6A8A", fontWeight:300, margin:0 }}>{m.sub}</p>
                            </div>
                        </a>
                    ))}
                </div>

                {/* ── MAIN GRID ── */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:"2.5rem", alignItems:"start" }} className="ct-main">

                    {/* ── FORM ── */}
                    <div style={{ borderRadius:20, border:"1px solid rgba(14,133,178,0.10)", background:"white", boxShadow:"0 4px 24px rgba(14,133,178,0.07)", overflow:"hidden" }}>
                        <div style={{ background:"linear-gradient(135deg,#0A3D52,#0E85B2)", padding:"1.5rem 2rem" }}>
                            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.2rem", fontWeight:700, color:"white", marginBottom:4 }}>Send us a message</h2>
                            <p style={{ fontSize:"0.78rem", color:"rgba(235,248,255,0.70)", fontWeight:300, margin:0 }}>We read every message and reply within 24 hours.</p>
                        </div>

                        {sent ? (
                            <div style={{ padding:"3rem 2rem", display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", gap:16, animation:"fade-up 0.4s ease both" }}>
                                <div style={{ width:64, height:64, borderRadius:"50%", background:"linear-gradient(135deg,#28B8E8,#0A6A94)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 8px 24px rgba(14,133,178,0.30)" }}>
                                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M5 14l7 7 11-12"/></svg>
                                </div>
                                <div>
                                    <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.2rem", fontWeight:700, color:"#0A3D52", marginBottom:8 }}>Message sent!</h3>
                                    <p style={{ fontSize:"0.87rem", color:"#1A6A8A", lineHeight:1.7, maxWidth:300, margin:"0 auto" }}>
                                        Thank you for reaching out. We'll reply within 24 hours to <strong style={{ color:"#0A3D52" }}>{form.email}</strong>.
                                    </p>
                                </div>
                                <button onClick={() => { setSent(false); setForm({ name:"", email:"", topic:"", message:"" }); }}
                                        style={{ marginTop:4, fontSize:"0.83rem", fontWeight:600, color:"#1E9DC8", background:"none", border:"none", cursor:"pointer", textDecoration:"underline" }}>
                                    Send another message
                                </button>
                            </div>
                        ) : (
                            <div style={{ padding:"2rem", display:"flex", flexDirection:"column", gap:18 }}>

                                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }} className="ct-name-email">
                                    <div>
                                        <label style={label}>Your name</label>
                                        <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Abebe Bekele" style={fieldStyle("name")}/>
                                        {errors.name && <p style={{ fontSize:"0.7rem", color:"#EF4444", marginTop:4 }}>{errors.name}</p>}
                                    </div>
                                    <div>
                                        <label style={label}>Email address</label>
                                        <input type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="you@example.com" style={fieldStyle("email")}/>
                                        {errors.email && <p style={{ fontSize:"0.7rem", color:"#EF4444", marginTop:4 }}>{errors.email}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label style={label}>Topic</label>

                                    <Dropdown
                                        options={TOPICS}
                                        value={form.topic}
                                        onChange={(value) =>
                                            setForm((f) => ({ ...f, topic: value }))
                                        }
                                        placeholder="Select a topic…"
                                        className="w-full"
                                        width="w-full"
                                    />

                                    {errors.topic && (
                                        <p style={{ fontSize: "0.7rem", color: "#EF4444", marginTop: 4 }}>
                                            {errors.topic}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label style={label}>Message</label>
                                    <textarea value={form.message} onChange={e => setForm(f=>({...f,message:e.target.value}))}
                                              placeholder="Tell us how we can help…" rows={5}
                                              style={{ ...fieldStyle("message"), resize:"vertical", minHeight:120 }}/>
                                    {errors.message && <p style={{ fontSize:"0.7rem", color:"#EF4444", marginTop:4 }}>{errors.message}</p>}
                                </div>

                                <button onClick={handleSubmit} disabled={sending}
                                        style={{ width:"100%", padding:"0.9rem", borderRadius:12, border:"none", background: sending?"rgba(14,133,178,0.20)":"linear-gradient(135deg,#28B8E8,#0A6A94)", color: sending?"#1A6A8A":"white", fontSize:"0.9rem", fontWeight:700, cursor:sending?"default":"pointer", boxShadow:sending?"none":"0 4px 20px rgba(14,133,178,0.30)", transition:"all 0.2s" }}>
                                    {sending ? (
                                        <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                      <span style={{ width:14, height:14, borderRadius:"50%", border:"2px solid rgba(26,106,138,0.25)", borderTop:"2px solid #1A6A8A", display:"inline-block", animation:"spin 0.7s linear infinite" }}/>
                      Sending…
                    </span>
                                    ) : "Send message →"}
                                </button>

                                <p style={{ fontSize:"0.7rem", color:"rgba(26,106,138,0.50)", textAlign:"center", margin:0 }}>
                                    By submitting you agree to our{" "}
                                    <Link href="/privacy" style={{ color:"#1E9DC8", textDecoration:"none" }}>Privacy Policy</Link>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ── SIDEBAR ── */}
                    <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>

                        {/* FAQ */}
                        <div style={{ borderRadius:20, border:"1px solid rgba(14,133,178,0.10)", background:"white", boxShadow:"0 4px 24px rgba(14,133,178,0.07)", padding:"1.5rem" }}>
                            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1rem", fontWeight:700, color:"#0A3D52", marginBottom:"1rem" }}>Common questions</h2>
                            {FAQ.map((item, i) => <FAQItem key={i} q={item.q} a={item.a}/>)}
                        </div>

                        {/* Office */}
                        <div style={{ borderRadius:20, background:"linear-gradient(135deg,#0A3D52,#0D6080)", padding:"1.5rem", color:"white" }}>
                            <p style={{ fontSize:"0.65rem", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"rgba(235,248,255,0.50)", marginBottom:"0.75rem" }}>Our office</p>
                            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1rem", fontWeight:700, marginBottom:4 }}>Tizitaw Ethiopia</h3>
                            <p style={{ fontSize:"0.8rem", color:"rgba(235,248,255,0.72)", lineHeight:1.7, marginBottom:"1.1rem" }}>
                                Bole Sub-City, Woreda 03<br/>Addis Ababa, Ethiopia
                            </p>
                            {[{ icon:"📞", text:"+251 11 234 5678" },{ icon:"📧", text:"hello@tizitawethiopia.com" },{ icon:"🕐", text:"Mon–Fri · 8am–6pm EAT" }].map(({ icon, text }) => (
                                <div key={text} style={{ display:"flex", alignItems:"center", gap:8, fontSize:"0.78rem", color:"rgba(235,248,255,0.78)", marginBottom:6 }}>
                                    <span>{icon}</span>{text}
                                </div>
                            ))}
                        </div>

                        {/* Help link */}
                        <Link href="/help"
                              style={{ display:"flex", alignItems:"center", justifyContent:"space-between", borderRadius:16, border:"1px solid rgba(14,133,178,0.12)", background:"white", padding:"1rem 1.25rem", textDecoration:"none", transition:"all 0.18s", boxShadow:"0 2px 8px rgba(14,133,178,0.05)" }}
                              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="#EBF8FF";(e.currentTarget as HTMLElement).style.borderColor="#1E9DC8";}}
                              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="white";(e.currentTarget as HTMLElement).style.borderColor="rgba(14,133,178,0.12)";}}>
                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                <span style={{ fontSize:"1.2rem" }}>📖</span>
                                <div>
                                    <p style={{ fontSize:"0.83rem", fontWeight:700, color:"#0A3D52", margin:0 }}>Help center</p>
                                    <p style={{ fontSize:"0.7rem", color:"#1A6A8A", margin:0 }}>Browse guides and tutorials</p>
                                </div>
                            </div>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#1E9DC8" strokeWidth="2" strokeLinecap="round">
                                <path d="M2 7h10M8 3l4 4-4 4"/>
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>

            <style>{`
        .ct-methods { grid-template-columns: repeat(2,1fr) !important; }
        .ct-main    { grid-template-columns: 1fr 360px !important; }
        .ct-name-email { grid-template-columns: 1fr 1fr !important; }
        @media (max-width: 900px) { .ct-main { grid-template-columns: 1fr !important; } }
        @media (max-width: 560px) { .ct-methods { grid-template-columns: 1fr !important; } .ct-name-email { grid-template-columns: 1fr !important; } }
      `}</style>
        </div>
    );
}