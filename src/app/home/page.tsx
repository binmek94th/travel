"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

// ── Data ──────────────────────────────────────────────────────────────────────
const DESTINATIONS = [
    { name: "Lalibela",           sub: "Rock-hewn churches",      days: "3–5 days", tag: "Religious", icon: "⛪" },
    { name: "Simien Mountains",   sub: "UNESCO wilderness",        days: "4–7 days", tag: "Nature",    icon: "🏔" },
    { name: "Danakil Depression", sub: "Earth's hottest place",    days: "2–3 days", tag: "Adventure", icon: "🌋" },
    { name: "Axum",               sub: "Ancient obelisks & ruins", days: "2–3 days", tag: "Culture",   icon: "🗿" },
    { name: "Omo Valley",         sub: "Living tribal cultures",   days: "5–8 days", tag: "Culture",   icon: "🌍" },
    { name: "Bale Mountains",     sub: "Ethiopian wolf habitat",   days: "3–4 days", tag: "Nature",    icon: "🐺" },
];

const FEATURES = [
    { icon: "📍", title: "Curated destinations",  desc: "Every listing hand-verified by our local team — only places with real depth and responsible operators." },
    { icon: "🧭", title: "Local expert guides",   desc: "Connect with licensed Ethiopian guides who know the hidden paths, the stories, and the best injera in town." },
    { icon: "🤖", title: "AI journey planner",    desc: "Tell us your budget and interests. Our AI builds a day-by-day itinerary with real tours and seasonal tips." },
    { icon: "💳", title: "Secure payments",       desc: "Pay internationally with Stripe or locally with Chapa. All transactions protected, payouts guaranteed." },
    { icon: "💬", title: "Live community Q&A",    desc: "Ask \"Is this road passable?\" or \"Where is Timkat this year?\" — get answers from real travelers within hours." },
    { icon: "⭐", title: "Verified reviews",      desc: "Every review comes from a traveler who completed their booking. No fake stars, no incentivised reviews." },
];

const STATS = [
    { num: 80,  suffix: "+",  label: "Destinations"    },
    { num: 200, suffix: "+",  label: "Curated tours"   },
    { num: 12,  suffix: "K+", label: "Happy travelers" },
    { num: 4.9, suffix: "★",  label: "Average rating", decimals: 1 },
];

const TAG_STYLES: Record<string, { bg: string; color: string }> = {
    Religious: { bg: "#EDE9FE", color: "#6D28D9" },
    Nature:    { bg: "#D1FAE5", color: "#065F46" },
    Adventure: { bg: "#FEF3C7", color: "#92400E" },
    Culture:   { bg: "#DBEAFE", color: "#1E40AF" },
};

// ── Hooks ─────────────────────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
    const ref = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
            { threshold }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);
    return { ref, inView };
}

function useCountUp(target: number, decimals = 0, active: boolean) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        if (!active) return;
        const duration = 1800;
        const start = performance.now();
        const tick = (now: number) => {
            const p    = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            setVal(parseFloat((ease * target).toFixed(decimals)));
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [active, target, decimals]);
    return val;
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const { ref, inView } = useInView();
    return (
        <div
            ref={ref}
            style={{
                opacity:    inView ? 1 : 0,
                transform:  inView ? "translateY(0)" : "translateY(32px)",
                transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
            }}
        >
            {children}
        </div>
    );
}

function StatCounter({ num, suffix, label, decimals = 0, active }: {
    num: number; suffix: string; label: string; decimals?: number; active: boolean;
}) {
    const val = useCountUp(num, decimals, active);
    return (
        <div className="text-center px-8 border-r border-white/10 last:border-r-0 hover:scale-105 transition-transform">
            <div
                className="text-4xl font-bold text-white leading-none tracking-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
            >
                {decimals ? val.toFixed(decimals) : Math.floor(val)}{suffix}
            </div>
            <div className="text-[0.72rem] font-light tracking-widest text-[rgba(168,228,248,0.7)] uppercase mt-1.5">
                {label}
            </div>
        </div>
    );
}

// ── DIVIDERS ──────────────────────────────────────────────────────────────────

function PlaneDivider() {
    return (
        <div className="relative h-24 overflow-hidden bg-gradient-to-b from-[#EBF8FF] to-[#D6F0FA] border-y border-[rgba(14,133,178,0.08)]">
            <style>{`
        @keyframes plane-fly {
          from { left: -80px; transform: translateY(0); }
          40%  { transform: translateY(-6px); }
          70%  { transform: translateY(4px); }
          to   { left: 110%; transform: translateY(0); }
        }
        @keyframes cloud-a { from{transform:translateX(0)} to{transform:translateX(14px)} }
        @keyframes cloud-b { from{transform:translateX(0)} to{transform:translateX(10px)} }
      `}</style>
            {/* Clouds */}
            {[{l:"6%",a:"cloud-a",d:"0s",s:0.7},{l:"28%",a:"cloud-b",d:"2s",s:0.5},{l:"54%",a:"cloud-a",d:"1s",s:0.9},{l:"76%",a:"cloud-b",d:"3s",s:0.65}].map((c,i)=>(
                <svg key={i} style={{ position:"absolute", top:"18%", left:c.l, opacity:0.55, transform:`scale(${c.s})`, animation:`${c.a} ${6+i}s ${c.d} ease-in-out infinite alternate` }} width="70" height="30" viewBox="0 0 70 30" fill="none">
                    <ellipse cx="35" cy="22" rx="32" ry="10" fill="white"/>
                    <ellipse cx="22" cy="18" rx="16" ry="12" fill="white"/>
                    <ellipse cx="48" cy="17" rx="18" ry="13" fill="white"/>
                </svg>
            ))}
            {/* Plane */}
            <svg style={{ position:"absolute", top:"28%", animation:"plane-fly 9s linear infinite" }} width="72" height="32" viewBox="0 0 72 32" fill="none">
                <path d="M2 16 Q20 10 50 14 L68 16 L50 18 Q20 22 2 16Z" fill="#0A6A94"/>
                <path d="M20 14 L36 4 L40 8 L24 16Z" fill="#1E9DC8"/>
                <path d="M20 18 L36 28 L40 24 L24 16Z" fill="#28B8E8" opacity="0.7"/>
                <path d="M48 14 L60 8 L62 12 L52 15Z" fill="#1E9DC8"/>
                <path d="M48 18 L60 24 L62 20 L52 17Z" fill="#28B8E8" opacity="0.7"/>
                {[28,34,40].map(x=>(
                    <ellipse key={x} cx={x} cy="14.5" rx="2.5" ry="2" fill="rgba(235,248,255,0.9)"/>
                ))}
                <path d="M2 16 Q-20 16 -60 14" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeDasharray="4 3"/>
            </svg>
        </div>
    );
}

function LakeDivider() {
    return (
        <div className="relative h-28 overflow-hidden bg-gradient-to-b from-[#EBF8FF] via-[#B3E5FC] to-[#81D4FA]">
            <style>{`
        @keyframes boat-row   { from{left:-100px} to{left:110%} }
        @keyframes oar-l      { from{transform:rotate(-15deg)} to{transform:rotate(20deg)} }
        @keyframes oar-r      { from{transform:rotate(15deg)}  to{transform:rotate(-20deg)} }
        @keyframes ripple-x   { 0%{r:8px;opacity:0.8} 100%{r:40px;opacity:0} }
        @keyframes wshimmer   { from{opacity:0.3} to{opacity:0.8} }
      `}</style>
            {/* Mountain silhouette */}
            <svg className="absolute bottom-0 left-0 right-0 w-full opacity-15" height="70" viewBox="0 0 1200 70" preserveAspectRatio="none" fill="none">
                <path d="M0 70 L150 20 L280 55 L420 10 L560 45 L700 5 L850 40 L1000 15 L1200 50 L1200 70Z" fill="#0A3D52"/>
            </svg>
            {/* Water shimmer lines */}
            {[0,1,2,3].map(i=>(
                <div key={i} style={{ position:"absolute", bottom:14+i*10, left:0, right:0, height:1, background:`rgba(255,255,255,${0.4-i*0.08})`, animation:`wshimmer ${2+i*0.5}s ${i*0.4}s ease-in-out infinite alternate` }}/>
            ))}
            {/* Boat */}
            <svg style={{ position:"absolute", bottom:14, animation:"boat-row 13s linear infinite" }} width="90" height="44" viewBox="0 0 90 44" fill="none">
                <path d="M5 28 Q45 36 85 28 L80 34 Q45 44 10 34Z" fill="#0A3D52"/>
                <path d="M5 28 L85 28" stroke="#1E9DC8" strokeWidth="1.5"/>
                <line x1="45" y1="28" x2="45" y2="6" stroke="#0A6A94" strokeWidth="2"/>
                <path d="M45 8 L68 22 L45 26Z" fill="white" opacity="0.9"/>
                <path d="M45 8 L22 22 L45 26Z" fill="#EBF8FF" opacity="0.7"/>
                <line x1="20" y1="30" x2="2"  y2="38" stroke="#0A3D52" strokeWidth="2" strokeLinecap="round" style={{ animation:"oar-l 1.2s ease-in-out infinite alternate" }}/>
                <line x1="70" y1="30" x2="88" y2="38" stroke="#0A3D52" strokeWidth="2" strokeLinecap="round" style={{ animation:"oar-r 1.2s ease-in-out infinite alternate" }}/>
                <circle cx="45" cy="38" r="8" stroke="rgba(255,255,255,0.35)" strokeWidth="1" fill="none" style={{ animation:"ripple-x 2s ease-out infinite" }}/>
            </svg>
        </div>
    );
}

function JeepDivider() {
    return (
        <div className="relative h-28 overflow-hidden bg-gradient-to-b from-[#FEF3C7] via-[#FDE68A] to-[#D97706]">
            <style>{`
        @keyframes jeep-drive  { from{left:-110px;transform:translateY(0)} 30%{transform:translateY(-2px)} 60%{transform:translateY(1px)} to{left:110%} }
        @keyframes wspin       { to{transform:rotate(360deg)} }
        @keyframes dust1       { 0%{opacity:0.6;transform:scale(1)} 100%{opacity:0;transform:scale(2.5) translateX(-10px)} }
        @keyframes dust2       { 0%{opacity:0.4;transform:scale(1)} 100%{opacity:0;transform:scale(2)   translateX(-14px)} }
        @keyframes dust3       { 0%{opacity:0.3;transform:scale(1)} 100%{opacity:0;transform:scale(1.8) translateX(-18px)} }
      `}</style>
            {/* Acacia trees */}
            {[{x:"10%"},{x:"35%"},{x:"65%"},{x:"86%"}].map((t,i)=>(
                <svg key={i} style={{ position:"absolute", bottom:18, left:t.x, opacity:0.25 }} width="50" height="55" viewBox="0 0 50 55" fill="none">
                    <line x1="25" y1="55" x2="25" y2="25" stroke="#92400E" strokeWidth="3"/>
                    <ellipse cx="25" cy="20" rx="22" ry="16" fill="#065F46"/>
                    <ellipse cx="14" cy="26" rx="12" ry="9"  fill="#065F46"/>
                    <ellipse cx="36" cy="26" rx="13" ry="9"  fill="#065F46"/>
                </svg>
            ))}
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-[rgba(146,64,14,0.4)]"/>
            {/* Jeep */}
            <svg style={{ position:"absolute", bottom:16, animation:"jeep-drive 10s linear infinite" }} width="96" height="52" viewBox="0 0 96 52" fill="none">
                <rect x="8"  y="18" width="80" height="26" rx="4" fill="#0A3D52"/>
                <rect x="20" y="10" width="52" height="18" rx="3" fill="#0E85B2"/>
                <rect x="24" y="13" width="16" height="12" rx="2" fill="rgba(235,248,255,0.85)"/>
                <rect x="44" y="13" width="22" height="12" rx="2" fill="rgba(235,248,255,0.85)"/>
                <circle cx="24" cy="44" r="9" fill="#1A1A2E" stroke="#1E9DC8" strokeWidth="2"/>
                <circle cx="24" cy="44" r="4" fill="#0A3D52" style={{ animation:"wspin 0.4s linear infinite" }}/>
                <circle cx="72" cy="44" r="9" fill="#1A1A2E" stroke="#1E9DC8" strokeWidth="2"/>
                <circle cx="72" cy="44" r="4" fill="#0A3D52" style={{ animation:"wspin 0.4s linear infinite" }}/>
                <rect x="22" y="8"  width="48" height="4" rx="1" fill="#28B8E8" opacity="0.6"/>
                <rect x="84" y="24" width="8"  height="6" rx="2" fill="#FEF3C7"/>
                <ellipse cx="-5"  cy="42" rx="8"  ry="5" fill="rgba(217,119,6,0.25)" style={{ animation:"dust1 0.6s ease-out infinite" }}/>
                <ellipse cx="-18" cy="40" rx="11" ry="7" fill="rgba(217,119,6,0.15)" style={{ animation:"dust2 0.8s 0.1s ease-out infinite" }}/>
                <ellipse cx="-32" cy="38" rx="14" ry="8" fill="rgba(217,119,6,0.10)" style={{ animation:"dust3 1s 0.2s ease-out infinite" }}/>
            </svg>
        </div>
    );
}

function ScubaDivider() {
    return (
        <div className="relative h-28 overflow-hidden bg-gradient-to-b from-[#0A3D52] via-[#0E85B2] to-[#28B8E8]">
            <style>{`
        @keyframes brise    { 0%{transform:translateY(0);opacity:0.6} 100%{transform:translateY(-130px);opacity:0} }
        @keyframes dswim    { from{left:-80px;transform:translateY(0)} 35%{transform:translateY(-8px)} 70%{transform:translateY(6px)} to{left:110%} }
        @keyframes fswim    { from{left:-36px} to{left:110%} }
        @keyframes fswim2   { from{right:-30px} to{right:110%} }
        @keyframes flipl    { from{transform:rotate(-10deg)} to{transform:rotate(20deg)} }
        @keyframes flipr    { from{transform:rotate(10deg)}  to{transform:rotate(-20deg)} }
        @keyframes regbub   { 0%{transform:translateY(0) scale(1);opacity:0.8} 100%{transform:translateY(-18px) scale(1.5);opacity:0} }
      `}</style>
            {/* Bubbles */}
            {[4,10,16,22,30,38,46,54,62,70,78,86,92].map((l,i)=>(
                <div key={i} style={{ position:"absolute", left:`${l}%`, bottom:0, width:6+i%4*2, height:6+i%4*2, borderRadius:"50%", background:"rgba(235,248,255,0.22)", animation:`brise ${2.5+i*0.35}s ${i*0.28}s ease-in infinite` }}/>
            ))}
            {/* Coral */}
            {[8,22,40,58,72,88].map((l,i)=>(
                <svg key={i} style={{ position:"absolute", bottom:0, left:`${l}%`, opacity:0.65 }} width="28" height="35" viewBox="0 0 28 35" fill="none">
                    <path d="M14 35 Q14 20 8 12 Q5 5 10 2 Q14 0 18 2 Q23 5 20 12 Q14 20 14 35Z" fill={["#F06292","#AB47BC","#EF5350","#FF7043","#26C6DA"][i%5]}/>
                    <path d="M14 28 Q8 22 4 16 Q2 10 7 8"  stroke={["#F48FB1","#CE93D8","#EF9A9A","#FFAB91","#80DEEA"][i%5]} strokeWidth="2" fill="none"/>
                    <path d="M14 28 Q20 22 24 16 Q26 10 21 8" stroke={["#F48FB1","#CE93D8","#EF9A9A","#FFAB91","#80DEEA"][i%5]} strokeWidth="2" fill="none"/>
                </svg>
            ))}
            {/* Fish 1 */}
            <svg style={{ position:"absolute", top:"20%", animation:"fswim 8s 2s linear infinite" }} width="32" height="20" viewBox="0 0 32 20" fill="none">
                <path d="M4 10 Q16 4 28 10 Q16 16 4 10Z" fill="#F59E0B"/>
                <path d="M0 6 L6 10 L0 14Z" fill="#F59E0B"/>
                <circle cx="24" cy="9" r="2" fill="rgba(0,0,0,0.4)"/>
            </svg>
            {/* Fish 2 (reversed) */}
            <svg style={{ position:"absolute", top:"58%", right:"-30px", animation:"fswim2 11s 1s linear infinite" }} width="24" height="15" viewBox="0 0 24 15" fill="none">
                <path d="M20 7.5 Q8 2 2 7.5 Q8 13 20 7.5Z" fill="#26C6DA"/>
                <path d="M24 4 L18 7.5 L24 11Z" fill="#26C6DA"/>
                <circle cx="4" cy="7" r="1.5" fill="rgba(0,0,0,0.4)"/>
            </svg>
            {/* Diver */}
            <svg style={{ position:"absolute", top:"12%", animation:"dswim 14s linear infinite" }} width="70" height="45" viewBox="0 0 70 45" fill="none">
                <rect x="28" y="14" width="10" height="16" rx="4" fill="#0A3D52"/>
                <ellipse cx="33" cy="22" rx="12" ry="8" fill="#1E9DC8"/>
                <circle cx="46" cy="18" r="7" fill="#0A6A94"/>
                <rect x="41" y="14" width="12" height="9" rx="3" fill="rgba(235,248,255,0.8)"/>
                <rect x="43" y="15.5" width="8" height="6" rx="2" fill="rgba(14,133,178,0.3)"/>
                <path d="M14 26 Q4 28 2 32 Q8 30 18 28Z" fill="#0E85B2" style={{ animation:"flipl 0.6s ease-in-out infinite alternate" }}/>
                <path d="M14 20 Q4 16 2 12 Q8 16 18 18Z" fill="#0E85B2" style={{ animation:"flipr 0.6s ease-in-out infinite alternate" }}/>
                <path d="M36 18 Q50 12 58 14" stroke="#1E9DC8" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="53" cy="13" r="2"   fill="rgba(235,248,255,0.5)" style={{ animation:"regbub 1s ease-out infinite" }}/>
                <circle cx="56" cy="9"  r="1.5" fill="rgba(235,248,255,0.4)" style={{ animation:"regbub 1s 0.3s ease-out infinite" }}/>
            </svg>
        </div>
    );
}

function OceanDivider() {
    return (
        <div className="relative h-36 overflow-hidden bg-gradient-to-b from-[#EBF8FF] via-[#81D4FA] to-[#0288D1]">
            <div>hello</div>
            <style>{`
        @keyframes ysail  { from{left:-110px;transform:translateY(0)} 40%{transform:translateY(-4px)} to{left:110%} }
        @keyframes csail  { from{right:-140px;transform:scaleX(-1) translateY(0)} 50%{transform:scaleX(-1) translateY(-3px)} to{right:110%} }
        @keyframes wmove  { from{transform:translateX(0)} to{transform:translateX(30px)} }
        @keyframes smoke  { 0%{transform:translateY(0) scale(1);opacity:0.7} 100%{transform:translateY(-20px) scale(2);opacity:0} }
      `}</style>
            {/* Sun glow */}
            <div className="absolute top-2 right-[15%] w-16 h-16 rounded-full bg-[radial-gradient(circle,rgba(255,236,153,0.5)_0%,transparent_70%)] blur-lg pointer-events-none"/>
            {/* Wave lines */}
            {[0,1,2,3].map(i=>(
                <svg key={i} style={{ position:"absolute", bottom:8+i*18, left:0, width:"100%", opacity:0.28-i*0.05 }} height="12" viewBox="0 0 1200 12" preserveAspectRatio="none">
                    <path d={`M0 6 Q${150+i*30} 0,300 6 Q${450+i*20} 12,600 6 Q${750+i*30} 0,900 6 Q${1050+i*20} 12,1200 6`} stroke="white" strokeWidth="1.5" fill="none" style={{ animation:`wmove ${3+i}s ${i*0.5}s ease-in-out infinite alternate` }}/>
                </svg>
            ))}
            {/* Yacht */}
            <svg style={{ position:"absolute", bottom:30, animation:"ysail 16s linear infinite" }} width="100" height="70" viewBox="0 0 100 70" fill="none">
                <path d="M8 48 Q50 58 92 48 L86 56 Q50 68 14 56Z" fill="#0A3D52"/>
                <path d="M8 48 L92 48" stroke="#1E9DC8" strokeWidth="1.5"/>
                <line x1="50" y1="48" x2="50" y2="8" stroke="#0A6A94" strokeWidth="2.5"/>
                <path d="M50 10 L82 42 L50 46Z" fill="white" opacity="0.95"/>
                <path d="M50 14 L22 40 L50 44Z" fill="#EBF8FF" opacity="0.8"/>
                <path d="M50 8 L62 12 L50 16Z" fill="#1E9DC8"/>
                <path d="M8 52 Q-10 54 -30 52" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none"/>
                <path d="M8 56 Q-14 58 -38 56" stroke="rgba(255,255,255,0.25)" strokeWidth="1" fill="none"/>
            </svg>
            {/* Cruiser (mirrored right→left) */}
            <svg style={{ position:"absolute", bottom:26, right:"-140px", animation:"csail 20s 4s linear infinite" }} width="130" height="55" viewBox="0 0 130 55" fill="none">
                <path d="M5 36 Q65 46 125 36 L118 44 Q65 54 12 44Z" fill="#0E85B2"/>
                <path d="M5 36 L125 36" stroke="#28B8E8" strokeWidth="1.5"/>
                <rect x="30" y="20" width="70" height="18" rx="3" fill="#0A6A94"/>
                <rect x="45" y="12" width="42" height="12" rx="2" fill="#0A3D52"/>
                {[50,60,70,80].map(x=>(
                    <rect key={x} x={x} y="15" width="7" height="6" rx="1.5" fill="rgba(235,248,255,0.7)"/>
                ))}
                {[40,55,70,85,100].map(x=>(
                    <circle key={x} cx={x} cy="30" r="3" fill="rgba(235,248,255,0.5)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
                ))}
                <rect x="54" y="6" width="12" height="10" rx="2" fill="#0A3D52"/>
                <circle cx="58" cy="4" r="4" fill="rgba(200,220,240,0.4)" style={{ animation:"smoke 2s ease-out infinite" }}/>
                <circle cx="62" cy="0" r="5" fill="rgba(200,220,240,0.3)" style={{ animation:"smoke 2s 0.5s ease-out infinite" }}/>
                <path d="M125 40 Q145 42 165 40" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none"/>
            </svg>
        </div>
    );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
    const [scrolled,    setScrolled]    = useState(false);
    const [statsActive, setStatsActive] = useState(false);
    const [mousePos,    setMousePos]    = useState({ x: 0, y: 0 });

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", fn, { passive: true });
        return () => window.removeEventListener("scroll", fn);
    }, []);

    useEffect(() => {
        const fn = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
        window.addEventListener("mousemove", fn, { passive: true });
        return () => window.removeEventListener("mousemove", fn);
    }, []);

    useEffect(() => {
        const el = document.getElementById("tz-stats");
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setStatsActive(true); obs.disconnect(); } },
            { threshold: 0.3 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    const mx = mousePos.x / (typeof window !== "undefined" ? window.innerWidth  : 1);
    const my = mousePos.y / (typeof window !== "undefined" ? window.innerHeight : 1);

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Lato:wght@300;400;700&display=swap');
        body { font-family:'Lato',system-ui,sans-serif; }
        @keyframes hero-breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        @keyframes dots-drift   { from{background-position:0 0} to{background-position:36px 36px} }
        @keyframes slide-up     { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-dot    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
        @keyframes badge-float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes back-sway    { 0%,100%{transform:translateY(-50%) rotate(6deg)} 50%{transform:translateY(calc(-50% - 8px)) rotate(4deg)} }
        @keyframes back-sway2   { 0%,100%{transform:translateY(-50%) rotate(-5deg)} 50%{transform:translateY(calc(-50% + 8px)) rotate(-3deg)} }
        @keyframes shimmer      { 0%{left:-100%} 60%,100%{left:160%} }
        @keyframes steps-fill   { from{width:0%} to{width:100%} }
        @keyframes ring-pulse   { 0%,100%{opacity:0.5} 50%{opacity:1} }
        .hero-eyebrow  { animation: slide-up 0.7s 0.10s ease both; }
        .hero-title    { animation: slide-up 0.7s 0.25s ease both; }
        .hero-sub      { animation: slide-up 0.7s 0.40s ease both; }
        .hero-actions  { animation: slide-up 0.7s 0.55s ease both; }
        .hero-trust    { animation: slide-up 0.7s 0.70s ease both; }
        .hero-right    { animation: slide-up 0.9s 0.40s ease both; }
        .hero-circle-1 { animation: hero-breathe 8s ease-in-out infinite; }
        .hero-circle-2 { animation: hero-breathe 10s ease-in-out infinite reverse; }
        .hero-dots     { animation: dots-drift 20s linear infinite; background-image:radial-gradient(circle,rgba(14,133,178,0.13) 1px,transparent 1px); background-size:36px 36px; -webkit-mask-image:radial-gradient(ellipse 70% 60% at 75% 50%,black 20%,transparent 80%); mask-image:radial-gradient(ellipse 70% 60% at 75% 50%,black 20%,transparent 80%); }
        .pulse-dot     { animation: pulse-dot 2s ease-in-out infinite; }
        .badge-1       { animation: badge-float 4.0s 0.0s ease-in-out infinite; }
        .badge-2       { animation: badge-float 5.0s 1.0s ease-in-out infinite; }
        .badge-3       { animation: badge-float 4.5s 2.0s ease-in-out infinite; }
        .card-back-1   { animation: back-sway  6s ease-in-out infinite; }
        .card-back-2   { animation: back-sway2 8s ease-in-out infinite; }
        .card-shimmer::before { content:''; position:absolute; top:0; left:-100%; width:60%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent); animation:shimmer 3s 1.5s ease-in-out infinite; }
        .dest-card:hover .dest-icon { transform: scale(1.12) rotate(-4deg); }
        .dest-card:hover .dest-before { transform: scaleX(1); }
        .dest-card:hover .dest-arrow-box { background: linear-gradient(135deg,#28B8E8,#0A6A94); transform: translateX(3px); }
        .dest-card:hover .dest-arrow-box svg { stroke: white; }
        .dest-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:linear-gradient(90deg,#28B8E8,#0A6A94); transform:scaleX(0); transform-origin:left; transition:transform 0.3s ease; }
        .dest-card:hover::before { transform:scaleX(1); }
        .feature-card:hover .feature-icon { transform: scale(1.1) rotate(-6deg); }
      `}</style>

            {/* ── NAV ── */}
            <nav className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-10 transition-all duration-300 ${
                scrolled ? "bg-white/96 border-b border-[rgba(14,133,178,0.10)] shadow-[0_2px_24px_rgba(14,133,178,0.08)] backdrop-blur-md" : ""
            }`}>
                <a href="/" className="font-bold text-[1.3rem] text-[#0A3D52] no-underline tracking-tight" style={{ fontFamily:"'Playfair Display',serif" }}>
                    Tizitaw <em className="italic text-[#1E9DC8]">Ethiopia</em>
                </a>
                <div className="hidden md:flex items-center gap-8">
                    {[["#destinations","Destinations"],["#how","How it works"],["#features","Why us"]].map(([h,l])=>(
                        <a key={h} href={h} className="text-[0.83rem] text-[#1A6A8A] no-underline font-normal relative pb-0.5 group transition-colors hover:text-[#0A3D52]">
                            {l}
                            <span className="absolute bottom-[-2px] left-0 w-0 h-[1.5px] bg-[#1E9DC8] transition-all duration-300 group-hover:w-full"/>
                        </a>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/auth/login"  className="text-[0.83rem] text-[#1A6A8A] no-underline px-3 py-2 rounded-lg hover:bg-[#EBF8FF] transition-colors">Sign in</Link>
                    <Link href="/auth/signup" className="text-[0.83rem] font-bold text-white bg-gradient-to-r from-[#28B8E8] to-[#0A6A94] px-4 py-2 rounded-lg no-underline shadow-[0_2px_12px_rgba(14,133,178,0.30)] hover:shadow-[0_4px_20px_rgba(14,133,178,0.45)] hover:-translate-y-px transition-all">
                        Start exploring
                    </Link>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section className="relative min-h-screen bg-gradient-to-br from-[#EBF8FF] via-white to-[#EBF8FF] flex items-center px-10 overflow-hidden">
                <div className="hero-circle-1 pointer-events-none absolute -top-44 -right-44 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(40,184,232,0.13)_0%,rgba(10,106,148,0.05)_60%,transparent_100%)]"
                     style={{ transform:`translate(${mx*-12}px,${my*-8}px)` }}/>
                <div className="hero-circle-2 pointer-events-none absolute -bottom-60 -left-40 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(42,158,216,0.10)_0%,transparent_70%)]"
                     style={{ transform:`translate(${mx*8}px,${my*6}px)` }}/>
                <div className="hero-dots pointer-events-none absolute inset-0"/>

                <div className="relative max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center pt-16">

                    {/* Left */}
                    <div className="relative z-10">
                        <div className="hero-eyebrow opacity-0 inline-flex items-center gap-2 bg-[#EBF8FF] border border-[rgba(14,133,178,0.18)] rounded-full px-3.5 py-1.5 text-[0.72rem] font-bold tracking-[0.12em] text-[#1E9DC8] uppercase mb-6">
                            <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-[#1E9DC8]"/>
                            Discover the land of origins
                        </div>
                        <h1 className="hero-title opacity-0 mb-5 leading-[1.08] tracking-tight text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(2.8rem,4.5vw,4rem)", fontWeight:700, letterSpacing:"-0.025em" }}>
                            Journey into<br/>
                            <em className="italic text-[#1E9DC8]">Ancient</em>{" "}
                            <span className="relative inline-block after:content-[''] after:absolute after:bottom-1 after:left-0 after:right-0 after:h-[3px] after:bg-gradient-to-r after:from-[#28B8E8] after:to-[#0A6A94] after:rounded-full after:opacity-40">
                Ethiopia
              </span>
                        </h1>
                        <p className="hero-sub opacity-0 text-[1.05rem] font-light leading-[1.75] text-[#1A6A8A] mb-9 max-w-[440px]">
                            From rock-hewn churches rising from cliffsides to the alien landscapes of the Danakil — curated tours, local guides, and stories that last a lifetime.
                        </p>
                        <div className="hero-actions opacity-0 flex gap-3 flex-wrap mb-10">
                            <Link href="/destinations" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#28B8E8] via-[#0E85B2] to-[#0A6A94] text-white text-[0.9rem] font-bold px-7 py-3.5 rounded-xl no-underline shadow-[0_4px_20px_rgba(14,133,178,0.38)] hover:shadow-[0_8px_28px_rgba(14,133,178,0.5)] hover:-translate-y-0.5 transition-all group">
                                Explore destinations
                                <svg className="group-hover:translate-x-1 transition-transform" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 7h10M8 3l4 4-4 4"/></svg>
                            </Link>
                            <Link href="/tours" className="inline-flex items-center gap-2 text-[#1A6A8A] text-[0.9rem] font-normal px-7 py-3.5 rounded-xl no-underline border border-[rgba(14,133,178,0.28)] hover:border-[#1E9DC8] hover:bg-[#EBF8FF] hover:text-[#0A3D52] hover:-translate-y-0.5 transition-all">
                                Browse tours
                            </Link>
                        </div>
                        <div className="hero-trust opacity-0 flex items-center gap-4 text-[0.78rem] text-[#1A6A8A] font-light">
                            <div className="flex">
                                {(["#28B8E8","#0E85B2","#1E9DC8","#0A6A94"] as const).map((c,i)=>(
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[0.7rem] font-bold text-white -ml-2 first:ml-0" style={{ background:c }}>
                                        {["A","B","C","D"][i]}
                                    </div>
                                ))}
                            </div>
                            <div className="w-px h-5 bg-[rgba(14,133,178,0.2)]"/>
                            <div>
                                <div className="text-amber-400 tracking-[-1px] text-[0.9rem]">★★★★★</div>
                                <div className="mt-0.5">Trusted by 12,000+ travelers</div>
                            </div>
                        </div>
                    </div>

                    {/* Right — card stack */}
                    <div className="hero-right opacity-0 hidden lg:flex relative justify-center items-center min-h-[480px]">
                        <div className="card-back-2 absolute w-[240px] h-[180px] bg-[#EBF8FF] border border-[rgba(14,133,178,0.12)] rounded-[20px] top-1/2 left-[-8%] -translate-y-1/2 z-[1]"/>
                        <div className="card-back-1 absolute w-[260px] h-[200px] bg-gradient-to-br from-[#1E9DC8] to-[#0A6A94] rounded-[20px] top-1/2 right-[-6%] -translate-y-1/2 z-[1] opacity-15"/>

                        <div className="relative z-10 bg-white border border-[rgba(14,133,178,0.12)] rounded-[20px] p-7 w-[300px] shadow-[0_20px_60px_rgba(14,133,178,0.12),0_4px_16px_rgba(14,133,178,0.06)] hover:-translate-y-2 hover:rotate-[-1deg] transition-all duration-300">
                            <div className="card-shimmer relative w-full h-40 rounded-xl bg-gradient-to-br from-[#1E9DC8] to-[#0A6A94] flex items-center justify-center text-[3.5rem] mb-4 overflow-hidden">
                                <span className="relative z-10">⛪</span>
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(6,62,90,0.4)]"/>
                                <div className="absolute bottom-2.5 left-3 z-10 text-[0.72rem] font-bold text-white tracking-[0.06em] uppercase">Lalibela, Ethiopia</div>
                            </div>
                            <div className="text-[1.15rem] font-semibold text-[#0A3D52] mb-1" style={{ fontFamily:"'Playfair Display',serif" }}>Rock-Hewn Churches</div>
                            <div className="text-[0.78rem] text-[#1A6A8A] font-light mb-4">A UNESCO wonder carved from living rock in the 12th century</div>
                            <div className="flex items-center justify-between pt-3 border-t border-[#EBF8FF]">
                                <span className="flex items-center gap-1 text-[0.78rem] font-bold text-[#0A3D52]"><span className="text-amber-400">★</span> 4.9 · 348 reviews</span>
                                <span className="text-[0.78rem] font-bold text-[#1E9DC8]">From $299</span>
                            </div>
                        </div>

                        {[
                            { cls:"badge-1 top-[8%] right-[-5%]", iconBg:"#D1FAE5", icon:"✅", title:"Booking confirmed", sub:"Lalibela Heritage Tour" },
                            { cls:"badge-2 bottom-[22%] left-[-8%]", iconBg:"#EBF8FF", icon:"🗺", title:"AI itinerary ready", sub:"8 days · 6 stops" },
                            { cls:"badge-3 bottom-[5%] right-[8%]",  iconBg:"#FEF3C7", icon:"⭐", title:"New review", sub:"\"Life-changing trip\"" },
                        ].map(b=>(
                            <div key={b.title} className={`${b.cls} absolute bg-white border border-[rgba(14,133,178,0.12)] rounded-xl px-3.5 py-2.5 shadow-[0_8px_24px_rgba(14,133,178,0.10)] flex items-center gap-2.5 text-[0.75rem] font-bold text-[#0A3D52] whitespace-nowrap z-20`}>
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background:b.iconBg }}>{b.icon}</div>
                                <div>
                                    <div>{b.title}</div>
                                    <div className="text-[0.65rem] font-normal text-[#1A6A8A] mt-0.5">{b.sub}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ✈ PLANE */}
            <PlaneDivider/>

            {/* ── STATS ── */}
            <div id="tz-stats" className="bg-gradient-to-r from-[#0A3D52] to-[#0E85B2] py-10 px-10">
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4">
                    {STATS.map(s=>(
                        <StatCounter key={s.label} {...s} active={statsActive}/>
                    ))}
                </div>
            </div>

            {/* 🚣 LAKE + BOAT */}
            <LakeDivider/>

            {/* ── DESTINATIONS ── */}
            <section className="py-24 px-10" id="destinations">
                <div className="max-w-6xl mx-auto">
                    <Reveal>
                        <div className="mb-12">
                            <p className="text-[0.72rem] font-bold tracking-[0.18em] text-[#1E9DC8] uppercase mb-2">Where to go</p>
                            <h2 className="mb-3 font-semibold text-[#0A3D52] tracking-tight" style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.9rem,3vw,2.6rem)", letterSpacing:"-0.02em" }}>
                                Ethiopia's most <em className="italic text-[#1E9DC8]">extraordinary</em> places
                            </h2>
                            <p className="text-[0.95rem] font-light text-[#1A6A8A] leading-[1.7] max-w-lg">Eight regions, thousands of years of history, and landscapes found nowhere else on earth.</p>
                        </div>
                    </Reveal>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {DESTINATIONS.map((d,i)=>(
                            <Reveal key={d.name} delay={i*80}>
                                <Link href="/destinations" className="dest-card block no-underline bg-white border border-[rgba(14,133,178,0.10)] rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_48px_rgba(14,133,178,0.13)] hover:border-[rgba(14,133,178,0.22)]">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="dest-icon w-13 h-13 rounded-[14px] bg-gradient-to-br from-[#EBF8FF] to-[#D6F0FA] border border-[rgba(14,133,178,0.12)] flex items-center justify-center text-2xl transition-transform duration-300" style={{ width:52,height:52 }}>
                                            {d.icon}
                                        </div>
                                        <span className="text-[0.65rem] font-bold tracking-[0.08em] px-2.5 py-1 rounded-full uppercase" style={{ background:TAG_STYLES[d.tag].bg, color:TAG_STYLES[d.tag].color }}>
                      {d.tag}
                    </span>
                                    </div>
                                    <div className="text-[1.2rem] font-semibold text-[#0A3D52] mb-1" style={{ fontFamily:"'Playfair Display',serif" }}>{d.name}</div>
                                    <div className="text-[0.8rem] text-[#1A6A8A] font-light mb-5">{d.sub}</div>
                                    <div className="flex items-center justify-between border-t border-[#EBF8FF] pt-3">
                                        <div className="flex items-center gap-1.5 text-[0.75rem] font-bold text-[#1E9DC8]">
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="6" cy="6" r="4.5"/><path d="M6 3.5V6l1.5 1.5"/></svg>
                                            {d.days}
                                        </div>
                                        <div className="dest-arrow-box w-[30px] h-[30px] rounded-lg bg-[#EBF8FF] flex items-center justify-center transition-all duration-200">
                                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#1E9DC8" strokeWidth="2" strokeLinecap="round"><path d="M2 6.5h9M7 3l3.5 3.5L7 10"/></svg>
                                        </div>
                                    </div>
                                </Link>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* 🚙 JEEP */}
            <JeepDivider/>

            {/* ── HOW IT WORKS ── */}
            <HowItWorks/>

            {/* 🤿 SCUBA */}
            <ScubaDivider/>

            {/* ── FEATURES ── */}
            <section className="py-24 px-10" id="features">
                <div className="max-w-6xl mx-auto">
                    <Reveal>
                        <div className="mb-12">
                            <p className="text-[0.72rem] font-bold tracking-[0.18em] text-[#1E9DC8] uppercase mb-2">Why Tizitaw</p>
                            <h2 className="mb-3 font-semibold text-[#0A3D52] tracking-tight" style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.9rem,3vw,2.6rem)", letterSpacing:"-0.02em" }}>
                                Everything you need to <em className="italic text-[#1E9DC8]">travel well</em>
                            </h2>
                            <p className="text-[0.95rem] font-light text-[#1A6A8A] leading-[1.7] max-w-lg">Built for Ethiopia, by people who know it. Every feature serves one goal: a trip you'll remember.</p>
                        </div>
                    </Reveal>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {FEATURES.map((f,i)=>(
                            <Reveal key={f.title} delay={i*70}>
                                <div className="feature-card bg-white border border-[rgba(14,133,178,0.10)] rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(14,133,178,0.10)] hover:border-[rgba(14,133,178,0.20)]">
                                    <div className="feature-icon w-[52px] h-[52px] rounded-[14px] bg-gradient-to-br from-[#EBF8FF] to-[#D6F0FA] border border-[rgba(14,133,178,0.12)] flex items-center justify-center text-[1.4rem] mb-4 transition-transform duration-300">
                                        {f.icon}
                                    </div>
                                    <div className="text-[1.05rem] font-semibold text-[#0A3D52] mb-2" style={{ fontFamily:"'Playfair Display',serif" }}>{f.title}</div>
                                    <div className="text-[0.84rem] font-light text-[#1A6A8A] leading-[1.7]">{f.desc}</div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* 🛥 OCEAN + YACHT + CRUISER */}
            <OceanDivider/>

            {/* ── CTA ── */}
            <section className="relative py-40 px-10 text-center bg-gradient-to-br from-[#EBF8FF] via-white to-[#EBF8FF] overflow-hidden">
                {[400,650,900].map((s,i)=>(
                    <div key={s} className="absolute rounded-full border border-[rgba(14,133,178,0.08)] pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width:s, height:s, animation:`ring-pulse 4s ${i*0.8}s ease-in-out infinite` }}/>
                ))}
                <Reveal>
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 bg-[rgba(30,157,200,0.08)] border border-[rgba(14,133,178,0.18)] rounded-full px-3.5 py-1.5 text-[0.72rem] font-bold tracking-[0.1em] text-[#1E9DC8] uppercase mb-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1E9DC8] inline-block"/>
                            Free to join
                        </div>
                        <h2 className="mb-4 font-bold text-[#0A3D52] tracking-tight leading-[1.12]" style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(2.2rem,4vw,3.2rem)", letterSpacing:"-0.025em" }}>
                            Ready to experience<br/><em className="italic text-[#1E9DC8]">Ethiopia</em>?
                        </h2>
                        <p className="text-[1rem] font-light text-[#1A6A8A] mb-10 max-w-md mx-auto leading-[1.7]">
                            Create a free account and start building your journey today. No fees until you book.
                        </p>
                        <div className="flex gap-3 justify-center flex-wrap">
                            <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#28B8E8] via-[#0E85B2] to-[#0A6A94] text-white text-[0.9rem] font-bold px-7 py-3.5 rounded-xl no-underline shadow-[0_4px_20px_rgba(14,133,178,0.38)] hover:shadow-[0_8px_28px_rgba(14,133,178,0.5)] hover:-translate-y-0.5 transition-all group">
                                Create free account
                                <svg className="group-hover:translate-x-1 transition-transform" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 7h10M8 3l4 4-4 4"/></svg>
                            </Link>
                            <Link href="/tours" className="inline-flex items-center text-[#1A6A8A] text-[0.9rem] px-7 py-3.5 rounded-xl no-underline border border-[rgba(14,133,178,0.28)] hover:border-[#1E9DC8] hover:bg-[#EBF8FF] hover:text-[#0A3D52] hover:-translate-y-0.5 transition-all">
                                Browse tours first
                            </Link>
                        </div>
                    </div>
                </Reveal>
            </section>

            {/* ── FOOTER ── */}
            <footer className="bg-[#0A3D52] px-10 py-8 flex items-center justify-between flex-wrap gap-4 border-t border-white/[0.06]">
                <a href="/" className="no-underline text-[rgba(200,242,255,0.65)] text-[1.1rem] font-bold" style={{ fontFamily:"'Playfair Display',serif" }}>
                    Tizitaw <em className="italic">Ethiopia</em>
                </a>
                <p className="text-[0.72rem] text-[rgba(200,242,255,0.30)] font-light">© {new Date().getFullYear()} Tizitaw Ethiopia. All rights reserved.</p>
                <div className="flex gap-6">
                    {["Terms","Privacy","Contact"].map(l=>(
                        <a key={l} href={`/${l.toLowerCase()}`} className="text-[0.72rem] text-[rgba(200,242,255,0.38)] no-underline hover:text-[rgba(200,242,255,0.75)] transition-colors">{l}</a>
                    ))}
                </div>
            </footer>
        </>
    );
}

// ── HOW IT WORKS ──────────────────────────────────────────────────────────────
function HowItWorks() {
    const { ref, inView } = useInView(0.3);
    const STEPS = [
        { n:"1", title:"Explore",  desc:"Browse destinations, guides, and curated tours across all of Ethiopia." },
        { n:"2", title:"Plan",     desc:"Use our AI journey builder or pick an existing itinerary that fits your dates." },
        { n:"3", title:"Book",     desc:"Confirm with a local operator and pay securely via Stripe or Chapa." },
        { n:"4", title:"Discover", desc:"Travel with a verified guide and share your experience with the community." },
    ];
    return (
        <div className="bg-[#F8FCFF] border-y border-[rgba(14,133,178,0.07)] py-24 px-10" id="how">
            <div className="max-w-6xl mx-auto">
                <Reveal>
                    <div className="mb-12">
                        <p className="text-[0.72rem] font-bold tracking-[0.18em] text-[#1E9DC8] uppercase mb-2">How it works</p>
                        <h2 className="mb-3 font-semibold text-[#0A3D52]" style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.9rem,3vw,2.6rem)", letterSpacing:"-0.02em" }}>
                            Plan your trip in <em className="italic text-[#1E9DC8]">four steps</em>
                        </h2>
                        <p className="text-[0.95rem] font-light text-[#1A6A8A] leading-[1.7] max-w-lg">From inspiration to confirmation in minutes, not hours.</p>
                    </div>
                </Reveal>
                <div ref={ref} className="relative grid grid-cols-2 md:grid-cols-4 gap-0 mt-12">
                    {/* Connector line */}
                    <div className="hidden md:block absolute top-7 left-[12.5%] right-[12.5%] h-px bg-[rgba(14,133,178,0.15)] overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#28B8E8] to-[#0A6A94] transition-all duration-[1500ms]" style={{ width: inView ? "100%" : "0%" }}/>
                    </div>
                    {STEPS.map((s,i)=>(
                        <div
                            key={s.n}
                            className="text-center px-4 relative z-10 group"
                            style={{ opacity: inView?1:0, transform: inView?"translateY(0)":"translateY(24px)", transition:`opacity 0.6s ease ${i*150}ms,transform 0.6s ease ${i*150}ms` }}
                        >
                            <div className="w-14 h-14 rounded-full mx-auto mb-5 bg-gradient-to-br from-[#28B8E8] to-[#0A6A94] flex items-center justify-center text-white font-bold text-[1.2rem] shadow-[0_4px_16px_rgba(14,133,178,0.30)] group-hover:scale-110 group-hover:shadow-[0_8px_28px_rgba(14,133,178,0.40)] transition-all duration-300" style={{ fontFamily:"'Playfair Display',serif" }}>
                                {s.n}
                            </div>
                            <div className="text-[1rem] font-semibold text-[#0A3D52] mb-2" style={{ fontFamily:"'Playfair Display',serif" }}>{s.title}</div>
                            <div className="text-[0.8rem] font-light text-[#1A6A8A] leading-[1.65]">{s.desc}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}