"use client";

import Link from "next/link";
import { useState, useEffect, useRef, CSSProperties } from "react";
import { auth } from "@/src/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import {NotificationBell} from "@/src/components/notifications/NotificationBell";
import {useNotifications} from "@/src/hooks/useNotifications";

// ── Data ──────────────────────────────────────────────────────────────────────
const DESTINATIONS = [
  { name: "Lalibela",           sub: "Rock-hewn churches",      days: "3–5 days", tag: "Religious", icon: "⛪", tagBg: "#EDE9FE", tagColor: "#6D28D9" },
  { name: "Simien Mountains",   sub: "UNESCO wilderness",        days: "4–7 days", tag: "Nature",    icon: "🏔", tagBg: "#D1FAE5", tagColor: "#065F46" },
  { name: "Danakil Depression", sub: "Earth's hottest place",    days: "2–3 days", tag: "Adventure", icon: "🌋", tagBg: "#FEF3C7", tagColor: "#92400E" },
  { name: "Axum",               sub: "Ancient obelisks & ruins", days: "2–3 days", tag: "Culture",   icon: "🗿", tagBg: "#DBEAFE", tagColor: "#1E40AF" },
  { name: "Omo Valley",         sub: "Living tribal cultures",   days: "5–8 days", tag: "Culture",   icon: "🌍", tagBg: "#DBEAFE", tagColor: "#1E40AF" },
  { name: "Bale Mountains",     sub: "Ethiopian wolf habitat",   days: "3–4 days", tag: "Nature",    icon: "🐺", tagBg: "#D1FAE5", tagColor: "#065F46" },
];

const FEATURES = [
  { icon: "📍", title: "Curated destinations",  desc: "Every listing hand-verified by our local team — only places with real depth and responsible operators." },
  { icon: "🧭", title: "Local expert guides",   desc: "Connect with licensed Ethiopian guides who know the hidden paths, the stories, and the best injera in town." },
  { icon: "🤖", title: "AI journey planner",    desc: "Tell us your budget and interests. Our AI builds a day-by-day itinerary with real tours and seasonal tips." },
  { icon: "💳", title: "Secure payments",       desc: "Pay internationally with Stripe or locally with Chapa. All transactions protected, payouts guaranteed." },
  { icon: "💬", title: "Live community Q&A",    desc: 'Ask "Is this road passable?" or "Where is Timkat this year?" — get answers from real travelers within hours.' },
  { icon: "⭐", title: "Verified reviews",      desc: "Every review comes from a traveler who completed their booking. No fake stars, no incentivised reviews." },
];

const STEPS = [
  { n: "1", title: "Explore",  desc: "Browse destinations, guides, and curated tours across all of Ethiopia." },
  { n: "2", title: "Plan",     desc: "Use our AI journey builder or pick an existing itinerary that fits your dates." },
  { n: "3", title: "Book",     desc: "Confirm with a local operator and pay securely via Stripe or Chapa." },
  { n: "4", title: "Discover", desc: "Travel with a verified guide and share your experience with the community." },
];

// ── Hooks ─────────────────────────────────────────────────────────────────────
function useVisible(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el); return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function useCount(target: number, dec: number, go: boolean) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!go) return;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / 1800, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setV(parseFloat((e * target).toFixed(dec)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [go, target, dec]);
  return v;
}

function useRAF(cb: (t: number) => void) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    let id: number;
    const tick = (t: number) => { cbRef.current(t); id = requestAnimationFrame(tick); };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);
}

function Reveal({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: CSSProperties }) {
  const { ref, visible } = useVisible();
  return (
      <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(28px)", transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`, ...style }}>
        {children}
      </div>
  );
}

function Stat({ num, suffix, label, dec = 0, go }: { num: number; suffix: string; label: string; dec?: number; go: boolean }) {
  const v = useCount(num, dec, go);
  return (
      <div style={{ textAlign: "center", padding: "0 1.5rem", borderRight: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ fontFamily: "Georgia,serif", fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 700, color: "#fff", lineHeight: 1 }}>
          {dec ? v.toFixed(dec) : Math.floor(v)}{suffix}
        </div>
        <div style={{ fontSize: "0.7rem", letterSpacing: "0.12em", color: "rgba(168,228,248,0.7)", textTransform: "uppercase", marginTop: "0.4rem" }}>{label}</div>
      </div>
  );
}

// ── Backgrounds (unchanged, kept from original) ───────────────────────────────
function SavannaBackground({ mouse }: { mouse: { x: number; y: number } }) {
  const [jx, setJx] = useState(-140), [jy, setJy] = useState(0), [wheel, setWheel] = useState(0);
  const W = typeof window !== "undefined" ? window.innerWidth : 1600;
  const mx = mouse.x / W, my = mouse.y / (typeof window !== "undefined" ? window.innerHeight : 900);
  useRAF((now) => {
    const dur = 16000, p = (now % dur) / dur;
    setJx(-140 + p * (W + 280));
    setJy(Math.sin(p * Math.PI * 8) * 5 + Math.sin(p * Math.PI * 14) * 2);
    setWheel((now / 55) % 360);
  });
  return (
      <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,#EBF8FF 0%,#fffde7 55%,#fff8e1 80%,rgba(255,248,225,0) 100%)", opacity:0.6 }}/>
        <div style={{ position:"absolute", top:-180, right:-180, width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(40,184,232,0.13) 0%,transparent 70%)", transform:`translate(${mx*-14}px,${my*-9}px)`, transition:"transform 0.12s" }}/>
        <div style={{ position:"absolute", bottom:-240, left:-160, width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(42,158,216,0.10) 0%,transparent 70%)", transform:`translate(${mx*9}px,${my*7}px)`, transition:"transform 0.12s" }}/>
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle,rgba(14,133,178,0.12) 1px,transparent 1px)", backgroundSize:"36px 36px", WebkitMaskImage:"radial-gradient(ellipse 70% 60% at 75% 50%,black 20%,transparent 80%)", maskImage:"radial-gradient(ellipse 70% 60% at 75% 50%,black 20%,transparent 80%)" }}/>
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"30%", background:"linear-gradient(180deg,transparent,rgba(253,230,138,0.3))" }}/>
        {[{x:"4%",s:0.55,o:0.11},{x:"16%",s:0.85,o:0.09},{x:"38%",s:0.60,o:0.08},{x:"58%",s:0.90,o:0.10},{x:"75%",s:0.65,o:0.09},{x:"88%",s:0.78,o:0.10}].map((t,i)=>(
            <svg key={i} style={{ position:"absolute", bottom:"18%", left:t.x, opacity:t.o, transform:`scale(${t.s})`, transformOrigin:"bottom center" }} width="65" height="70" viewBox="0 0 65 70">
              <line x1="32" y1="70" x2="32" y2="30" stroke="#92400E" strokeWidth="4"/>
              <line x1="32" y1="48" x2="14" y2="36" stroke="#92400E" strokeWidth="2.5"/>
              <line x1="32" y1="42" x2="50" y2="30" stroke="#92400E" strokeWidth="2.5"/>
              <ellipse cx="32" cy="24" rx="28" ry="20" fill="#065F46"/>
              <ellipse cx="16" cy="33" rx="15" ry="11" fill="#065F46"/>
              <ellipse cx="48" cy="32" rx="16" ry="12" fill="#065F46"/>
            </svg>
        ))}
        <svg style={{ position:"absolute", bottom:"18%", left:jx, transform:`translateY(${jy}px)`, opacity:0.28 }} width="120" height="68" viewBox="0 0 120 68">
          <rect x="8" y="20" width="104" height="34" rx="5" fill="#0A3D52"/>
          <rect x="20" y="10" width="68" height="24" rx="4" fill="#0E85B2"/>
          <rect x="26" y="13" width="22" height="16" rx="2.5" fill="rgba(235,248,255,0.85)"/>
          <rect x="54" y="13" width="28" height="16" rx="2.5" fill="rgba(235,248,255,0.85)"/>
          <rect x="22" y="8" width="66" height="5" rx="2" fill="#28B8E8" opacity="0.55"/>
          <rect x="106" y="28" width="10" height="10" rx="2" fill="#FEF3C7"/>
          <circle cx="30" cy="58" r="12" fill="#1A1A2E"/>
          <circle cx="30" cy="58" r="5.5" fill="#0A3D52" transform={`rotate(${wheel} 30 58)`}/>
          <circle cx="90" cy="58" r="12" fill="#1A1A2E"/>
          <circle cx="90" cy="58" r="5.5" fill="#0A3D52" transform={`rotate(${wheel} 90 58)`}/>
          <ellipse cx="-10" cy="56" rx="12" ry="7" fill="rgba(146,64,14,0.28)"/>
          <ellipse cx="-26" cy="54" rx="17" ry="10" fill="rgba(146,64,14,0.18)"/>
          <ellipse cx="-46" cy="51" rx="22" ry="12" fill="rgba(146,64,14,0.10)"/>
        </svg>
      </div>
  );
}

function OceanBackground() {
  const [bx, setBx] = useState(-120), [by, setBy] = useState(0), [oar, setOar] = useState(0), [tilt, setTilt] = useState(0);
  useRAF((now) => {
    const W = typeof window !== "undefined" ? window.innerWidth : 1600;
    const p = (now % 18000) / 18000;
    setBx(-120 + p * (W + 240));
    const wave = Math.sin(p * Math.PI * 3) * 18 + Math.sin(p * Math.PI * 7) * 8;
    setBy(wave); setTilt(Math.sin(p * Math.PI * 3) * 6); setOar(Math.sin(now / 450) * 25);
  });
  return (
      <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
        <div style={{ position:"absolute", top:"-20%", left:"60%", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle,rgba(40,184,232,0.12) 0%,transparent 70%)" }}/>
        {[0,1,2,3,4].map(i=>(<div key={i} style={{ position:"absolute", top:`${10+i*22}%`, left:0, right:0, height:1.5, background:`rgba(255,255,255,${0.07-i*0.01})`, borderRadius:2 }}/>))}
        <svg style={{ position:"absolute", top:`calc(22% + ${by}px)`, left:bx, transform:`rotate(${tilt}deg)`, transformOrigin:"55px 65px", opacity:0.30 }} width="130" height="95" viewBox="0 0 130 95">
          <path d="M5 68 Q65 82 125 68 L117 78 Q65 92 13 78Z" fill="rgba(255,255,255,0.95)"/>
          <path d="M5 68 L125 68" stroke="rgba(40,184,232,0.6)" strokeWidth="2"/>
          <line x1="65" y1="68" x2="65" y2="8" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5"/>
          <path d="M65 10 L108 60 L65 67Z" fill="rgba(255,255,255,0.90)"/>
          <path d="M65 14 L22 58 L65 65Z" fill="rgba(235,248,255,0.75)"/>
          <path d="M65 8 L80 14 L65 20Z" fill="rgba(40,184,232,0.9)"/>
          <line x1="22" y1="70" x2="2" y2="84" stroke="rgba(255,255,255,0.7)" strokeWidth="3" strokeLinecap="round" transform={`rotate(${oar} 22 70)`}/>
          <line x1="108" y1="70" x2="128" y2="84" stroke="rgba(255,255,255,0.7)" strokeWidth="3" strokeLinecap="round" transform={`rotate(${-oar} 108 70)`}/>
        </svg>
      </div>
  );
}

function SkyBackground() {
  const [px, setPx] = useState(-100), [py, setPy] = useState(0), [ptilt, setPtilt] = useState(0);
  useRAF((now) => {
    const W = typeof window !== "undefined" ? window.innerWidth : 1600;
    const p = (now % 16000) / 16000;
    setPx(-100 + p * (W + 200));
    setPy(-Math.sin(p * Math.PI) * 80 + Math.sin(p * Math.PI * 5) * 8);
    setPtilt(Math.atan2(-Math.cos(p * Math.PI) * 80 * (Math.PI / 16000), 1) * (180/Math.PI) * 0.4);
  });
  return (
      <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,#E0F7FF 0%,#B3EEFF 30%,rgba(179,238,255,0.15) 70%,transparent 100%)", opacity:0.75 }}/>
        {[{x:"5%",y:"8%",s:1.3,o:0.28},{x:"22%",y:"22%",s:0.9,o:0.22},{x:"44%",y:"6%",s:1.6,o:0.25},{x:"66%",y:"18%",s:1.1,o:0.22},{x:"82%",y:"8%",s:1.4,o:0.26}].map((c,i)=>(
            <svg key={i} style={{ position:"absolute", left:c.x, top:c.y, opacity:c.o, transform:`scale(${c.s})` }} width="100" height="50" viewBox="0 0 100 50">
              <ellipse cx="50" cy="36" rx="48" ry="16" fill="#1E9DC8"/><ellipse cx="30" cy="28" rx="24" ry="20" fill="#1E9DC8"/>
              <ellipse cx="68" cy="26" rx="28" ry="22" fill="#1E9DC8"/><ellipse cx="50" cy="24" rx="22" ry="18" fill="#28B8E8"/>
            </svg>
        ))}
        {px > 50 && <div style={{ position:"absolute", top:`calc(35% + ${py}px)`, left:0, width:Math.max(0,px), height:2, background:"linear-gradient(90deg,transparent,rgba(14,133,178,0.20))", borderRadius:2 }}/>}
        <svg style={{ position:"absolute", top:"30%", left:px, transform:`translateY(${py}px) rotate(${ptilt}deg)`, opacity:0.30, transformOrigin:"55px 25px" }} width="130" height="58" viewBox="0 0 130 58">
          <path d="M2 29 Q30 18 80 24 L122 29 L80 34 Q30 40 2 29Z" fill="#0A6A94"/>
          <path d="M34 24 L65 4 L72 10 L44 29Z" fill="#1E9DC8"/>
          <path d="M34 34 L65 54 L72 48 L44 29Z" fill="#28B8E8" opacity="0.85"/>
          <path d="M82 24 L106 12 L109 19 L90 27Z" fill="#1E9DC8"/>
          <path d="M82 34 L106 46 L109 39 L90 31Z" fill="#28B8E8" opacity="0.75"/>
          {[46,57,68,79].map(x=>(<ellipse key={x} cx={x} cy="27" rx="3.5" ry="2.8" fill="rgba(235,248,255,0.90)"/>))}
          <ellipse cx="122" cy="29" rx="6" ry="4" fill="#0A3D52"/>
        </svg>
      </div>
  );
}

function UnderwaterBackground() {
  const [dx, setDx] = useState(-110), [dy, setDy] = useState(0), [flipper, setFlipper] = useState(0), [dtilt, setDtilt] = useState(0), [fx, setFx] = useState(-50), [fy, setFy] = useState(0), [f2x, setF2x] = useState(0);
  useRAF((now) => {
    const W = typeof window !== "undefined" ? window.innerWidth : 1600;
    const p = (now % 20000) / 20000;
    setDx(-110 + p * (W + 220));
    const path = Math.sin(p * Math.PI * 4) * 35 + Math.sin(p * Math.PI * 2) * 20;
    setDy(path); setDtilt(Math.atan2(-Math.cos(p * Math.PI * 4) * 35 * (Math.PI * 4 / 20000) * 500, 1) * (180/Math.PI) * 0.35); setFlipper(Math.sin(now / 200) * 28);
    setFx(-50 + ((now * 0.062) % (W + 100))); setFy(Math.sin(now / 700) * 20);
    setF2x(W + 40 - ((now * 0.038) % (W + 100)));
  });
  return (
      <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,rgba(0,77,102,0.18) 0%,rgba(0,105,140,0.12) 50%,rgba(0,77,102,0.08) 100%)" }}/>
        {[12,25,42,60,75,88].map((x,i)=>(<div key={i} style={{ position:"absolute", top:0, left:`${x}%`, width:1.5, height:"70%", background:`linear-gradient(180deg,rgba(40,184,232,${0.08-i*0.01}),transparent)`, transform:`rotate(${(i-2.5)*4}deg)`, transformOrigin:"top center" }}/>))}
        {[6,14,24,35,46,57,68,78,88,95].map((l,i)=>(<div key={i} style={{ position:"absolute", left:`${l}%`, bottom:`${(i*19+8)%85}%`, width:5+i%3*3, height:5+i%3*3, borderRadius:"50%", border:"1.5px solid rgba(40,184,232,0.25)", background:"rgba(235,248,255,0.10)" }}/>))}
        <svg style={{ position:"absolute", top:`calc(30% + ${fy}px)`, left:fx, opacity:0.30 }} width="55" height="34" viewBox="0 0 55 34"><path d="M6 17 Q27 6 46 17 Q27 28 6 17Z" fill="#28B8E8"/><path d="M0 8 L9 17 L0 26Z" fill="#28B8E8"/><circle cx="40" cy="15" r="4" fill="rgba(10,61,82,0.5)"/></svg>
        <svg style={{ position:"absolute", top:"58%", left:f2x, transform:"scaleX(-1)", opacity:0.22 }} width="44" height="28" viewBox="0 0 44 28"><path d="M5 14 Q22 5 38 14 Q22 23 5 14Z" fill="#26C6DA"/><path d="M0 6 L7 14 L0 22Z" fill="#26C6DA"/><circle cx="32" cy="12" r="3" fill="rgba(10,61,82,0.5)"/></svg>
        <svg style={{ position:"absolute", top:"20%", left:dx, transform:`translateY(${dy}px) rotate(${dtilt}deg)`, opacity:0.32, transformOrigin:"55px 35px" }} width="110" height="70" viewBox="0 0 110 70">
          <rect x="36" y="18" width="16" height="28" rx="7" fill="#0A3D52"/><rect x="38" y="14" width="12" height="8" rx="3" fill="#0E85B2"/>
          <ellipse cx="46" cy="35" rx="18" ry="13" fill="#1E9DC8"/>
          <path d="M34 42 Q26 50 22 58" stroke="#1E9DC8" strokeWidth="8" strokeLinecap="round" fill="none"/>
          <path d="M46 46 Q40 54 36 62" stroke="#1E9DC8" strokeWidth="8" strokeLinecap="round" fill="none"/>
          <path d="M22 58 Q10 62 6 68 Q16 64 28 60Z" fill="#0E85B2" transform={`rotate(${flipper * 0.7} 22 58)`}/>
          <path d="M36 62 Q24 66 20 72 Q30 68 42 64Z" fill="#0E85B2" transform={`rotate(${-flipper * 0.7} 36 62)`}/>
          <circle cx="68" cy="28" r="13" fill="#0A6A94"/>
          <rect x="60" y="20" width="18" height="14" rx="5" fill="rgba(235,248,255,0.88)"/>
          <path d="M52 26 Q70 18 84 22" stroke="#1E9DC8" strokeWidth="5" strokeLinecap="round" fill="none"/>
          <circle cx="85" cy="20" r="4" fill="rgba(235,248,255,0.45)"/>
          <circle cx="90" cy="14" r="3" fill="rgba(235,248,255,0.35)"/>
          <circle cx="94" cy="8"  r="2.5" fill="rgba(235,248,255,0.25)"/>
        </svg>
      </div>
  );
}

function FeatureOceanBackground() {
  const [yx, setYx] = useState(-130), [yy, setYy] = useState(0), [ytilt, setYtilt] = useState(0), [cx2, setCx2] = useState(0), [cy2, setCy2] = useState(0), [ctilt, setCtilt] = useState(0);
  useRAF((now) => {
    const W = typeof window !== "undefined" ? window.innerWidth : 1600;
    const yp = (now % 20000) / 20000;
    setYx(-130 + yp * (W + 260)); setYy(Math.sin(yp * Math.PI * 4) * 20 + Math.sin(yp * Math.PI * 7) * 8); setYtilt(Math.sin(yp * Math.PI * 4) * 5);
    const cp = (now % 25000) / 25000;
    setCx2(W + 160 - cp * (W + 320)); setCy2(Math.sin(cp * Math.PI * 3) * 16 + Math.cos(cp * Math.PI * 6) * 6); setCtilt(-Math.sin(cp * Math.PI * 3) * 4);
  });
  return (
      <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,rgba(255,236,153,0.20) 0%,rgba(255,184,0,0.08) 25%,rgba(40,184,232,0.10) 55%,rgba(2,136,209,0.06) 100%)" }}/>
        <div style={{ position:"absolute", top:"5%", right:"15%", width:120, height:120, borderRadius:"50%", background:"radial-gradient(circle,rgba(255,236,153,0.35) 0%,rgba(255,184,0,0.12) 40%,transparent 70%)" }}/>
        {[0,1,2,3,4].map(i=>(<div key={i} style={{ position:"absolute", top:`${48+i*11}%`, left:0, right:0, height:1.5, background:`rgba(14,133,178,${0.07-i*0.01})` }}/>))}
        <svg style={{ position:"absolute", top:`calc(28% + ${yy}px)`, left:yx, transform:`rotate(${ytilt}deg)`, transformOrigin:"65px 75px", opacity:0.28 }} width="140" height="100" viewBox="0 0 140 100">
          <path d="M8 70 Q70 84 132 70 L124 80 Q70 94 16 80Z" fill="#0A3D52"/>
          <line x1="70" y1="70" x2="70" y2="8" stroke="#0A6A94" strokeWidth="3"/>
          <path d="M70 10 L115 62 L70 68Z" fill="white" opacity="0.95"/>
          <path d="M70 14 L25 60 L70 66Z" fill="#EBF8FF" opacity="0.88"/>
          <path d="M70 8 L88 16 L70 24Z" fill="#1E9DC8"/>
        </svg>
        <svg style={{ position:"absolute", top:`calc(48% + ${cy2}px)`, left:cx2, transform:`scaleX(-1) rotate(${ctilt}deg)`, transformOrigin:"85px 50px", opacity:0.22 }} width="180" height="78" viewBox="0 0 180 78">
          <path d="M5 52 Q90 66 175 52 L166 62 Q90 76 14 62Z" fill="#0E85B2"/>
          <rect x="32" y="28" width="112" height="26" rx="5" fill="#0A6A94"/>
          <rect x="54" y="14" width="68" height="18" rx="4" fill="#0A3D52"/>
          {[60,74,88,102].map(x=>(<rect key={x} x={x} y="17" width="10" height="10" rx="2.5" fill="rgba(235,248,255,0.65)"/>))}
        </svg>
      </div>
  );
}

// ── Homepage Nav ──────────────────────────────────────────────────────────────
function HomeNav({ user, loading }: { user: User | null; loading: boolean }) {
  const router = useRouter();
  const [scrolled,   setScrolled]   = useState(false);
  const [dropOpen,   setDropOpen]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const { notifications, markRead, markAllRead } = useNotifications(user?.uid ?? null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  async function handleSignOut() {
    await signOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" });
    router.refresh();
    setDropOpen(false);
    setMobileOpen(false);
  }

  const name = user?.displayName ?? user?.email ?? "Traveler";

  return (
      <>
        <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, height:64, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 1.5rem", background: scrolled ? "rgba(255,255,255,0.96)" : "transparent", borderBottom: scrolled ? "1px solid rgba(14,133,178,0.10)" : "none", boxShadow: scrolled ? "0 2px 24px rgba(14,133,178,0.08)" : "none", backdropFilter: scrolled ? "blur(16px)" : "none", transition:"all 0.3s ease" }}>

          {/* Logo */}
          <a href="/" style={{ fontFamily:"Georgia,serif", fontSize:"1.3rem", fontWeight:700, color:"#0A3D52", textDecoration:"none" }}>
            Tizitaw <em style={{ fontStyle:"italic", color:"#1E9DC8" }}>Ethiopia</em>
          </a>

          {/* Desktop nav links */}
          <div className="home-nav-links" style={{ display:"flex", alignItems:"center", gap:"2rem" }}>
            {[["#destinations","Destinations"],["#how","How it works"],["#features","Why us"]].map(([h,l])=>(
                <a key={h} href={h} style={{ fontSize:"0.83rem", color: scrolled ? "#1A6A8A" : "#0A3D52", textDecoration:"none", transition:"color 0.2s" }}>{l}</a>
            ))}
          </div>

          {/* Right side */}
          <div style={{ display:"flex", gap:"0.75rem", alignItems:"center" }}>
            {loading ? (
                <div style={{ width:34, height:34, borderRadius:"50%", background:"rgba(14,133,178,0.08)" }}/>
            ) : user ? (
                /* LOGGED IN: show avatar with dropdown */
                <div ref={dropRef} style={{ position:"relative", display: "flex", gap: 4 }}>
                  <NotificationBell
                      notifications={notifications}
                      onMarkRead={markRead}
                      onMarkAllRead={markAllRead}
                      transparent={true}
                  />
                  <button onClick={() => setDropOpen(v=>!v)}
                          style={{ display:"flex", alignItems:"center", gap:"0.5rem", background:"none", border:"1px solid rgba(14,133,178,0.20)", borderRadius:40, padding:"0.25rem 0.65rem 0.25rem 0.3rem", cursor:"pointer" }}>
                    <div style={{ width:32, height:32, borderRadius:"50%", overflow:"hidden", flexShrink:0 }}>
                      {user.photoURL
                          ? <img src={user.photoURL} alt={name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                          : <div style={{ width:"100%", height:"100%", background:"linear-gradient(135deg,#28B8E8,#0A6A94)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.7rem", fontWeight:700, color:"#fff" }}>{name.charAt(0).toUpperCase()}</div>
                      }
                    </div>
                    <span className="home-nav-username" style={{ fontSize:"0.83rem", fontWeight:500, color:"#0A3D52", maxWidth:80, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name.split(" ")[0]}</span>
                    <svg style={{ transform:dropOpen?"rotate(180deg)":"none", transition:"transform 0.2s", flexShrink:0 }} width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#1A6A8A" strokeWidth="1.8" strokeLinecap="round"><path d="M2 4l4 4 4-4"/></svg>
                  </button>

                  {dropOpen && (
                      <div style={{ position:"absolute", top:"calc(100% + 10px)", right:0, width:220, background:"#fff", border:"1px solid rgba(14,133,178,0.12)", borderRadius:14, boxShadow:"0 16px 48px rgba(14,133,178,0.16)", overflow:"hidden", animation:"dropdown-pop 0.18s cubic-bezier(0.22,1,0.36,1) both" }}>
                        <style>{`@keyframes dropdown-pop{from{opacity:0;transform:translateY(-8px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
                        <div style={{ padding:"0.85rem 1rem", borderBottom:"1px solid rgba(14,133,178,0.08)" }}>
                          <div style={{ fontSize:"0.83rem", fontWeight:700, color:"#0A3D52" }}>{name}</div>
                          <div style={{ fontSize:"0.7rem", color:"#1A6A8A" }}>{user.email}</div>
                        </div>
                        {[
                          { label:"Destinations", href:"/destinations" },
                          { label:"Tours",        href:"/tours"        },
                          { label:"Saved",        href:"/saved"        },
                          { label:"My bookings",  href:"/bookings"     },
                          { label:"Community",    href:"/community"    },
                          { label:"Profile",    href:"/profile"    },
                          { label:"Settings",    href:"/settings"    },
                        ].map(item=>(
                            <a key={item.label} href={item.href}
                               style={{ display:"block", padding:"0.6rem 1rem", fontSize:"0.83rem", color:"#1A6A8A", textDecoration:"none", transition:"background 0.12s" }}
                               onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="#F0F9FF";}}
                               onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="transparent";}}>
                              {item.label}
                            </a>
                        ))}
                        <div style={{ borderTop:"1px solid rgba(14,133,178,0.08)" }}>
                          <button onClick={handleSignOut}
                                  style={{ display:"block", width:"100%", textAlign:"left", padding:"0.6rem 1rem", fontSize:"0.83rem", color:"#E05252", background:"none", border:"none", cursor:"pointer", transition:"background 0.12s" }}
                                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="#FEF2F2";}}
                                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="transparent";}}>
                            Sign out
                          </button>
                        </div>
                      </div>
                  )}
                </div>
            ) : (
                /* LOGGED OUT: sign in + get started */
                <>
                  <Link href="/auth/login" className="home-nav-auth-link" style={{ fontSize:"0.83rem", color:"#1A6A8A", textDecoration:"none", padding:"0.45rem 0.85rem", borderRadius:8 }}>Sign in</Link>
                  <Link href="/auth/signup" style={{ fontSize:"0.83rem", fontWeight:700, color:"#fff", background:"linear-gradient(135deg,#28B8E8,#0A6A94)", padding:"0.5rem 1.15rem", borderRadius:8, textDecoration:"none" }}>Start exploring</Link>
                </>
            )}

            {/* Hamburger */}
            <button className="home-hamburger" onClick={() => setMobileOpen(v=>!v)}
                    style={{ display:"none", alignItems:"center", justifyContent:"center", width:36, height:36, borderRadius:8, border:"1px solid rgba(14,133,178,0.20)", background:"none", cursor:"pointer" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#1A6A8A" strokeWidth="2" strokeLinecap="round">
                {mobileOpen ? <path d="M2 2l12 12M14 2L2 14"/> : <path d="M2 4h12M2 8h12M2 12h12"/>}
              </svg>
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
            <div style={{ position:"fixed", inset:0, zIndex:90, paddingTop:64 }}>
              <div style={{ position:"absolute", inset:0, background:"rgba(10,61,82,0.4)", backdropFilter:"blur(4px)" }} onClick={()=>setMobileOpen(false)}/>
              <div style={{ position:"relative", background:"#fff", padding:"1rem 0 1.5rem", borderTop:"1px solid rgba(14,133,178,0.10)", boxShadow:"0 8px 32px rgba(14,133,178,0.12)" }}>
                {[["#destinations","Destinations"],["#how","How it works"],["#features","Why us"]].map(([h,l])=>(
                    <a key={h} href={h} onClick={()=>setMobileOpen(false)} style={{ display:"block", padding:"0.75rem 1.5rem", fontSize:"0.9rem", color:"#1A6A8A", textDecoration:"none" }}>{l}</a>
                ))}
                <div style={{ borderTop:"1px solid rgba(14,133,178,0.08)", marginTop:"0.5rem", padding:"0.75rem 1.5rem 0", display:"flex", gap:"0.75rem" }}>
                  {user ? (
                      <>
                        <a href="/destinations" style={{ flex:1, textAlign:"center", padding:"0.65rem", borderRadius:10, border:"1.5px solid rgba(14,133,178,0.22)", fontSize:"0.87rem", color:"#1A6A8A", textDecoration:"none" }}>Explore</a>
                        <button onClick={handleSignOut} style={{ flex:1, padding:"0.65rem", borderRadius:10, background:"linear-gradient(135deg,#28B8E8,#0A6A94)", fontSize:"0.87rem", fontWeight:700, color:"#fff", border:"none", cursor:"pointer" }}>Sign out</button>
                      </>
                  ) : (
                      <>
                        <Link href="/auth/login" onClick={()=>setMobileOpen(false)} style={{ flex:1, textAlign:"center", padding:"0.65rem", borderRadius:10, border:"1.5px solid rgba(14,133,178,0.22)", fontSize:"0.87rem", color:"#1A6A8A", textDecoration:"none" }}>Sign in</Link>
                        <Link href="/auth/signup" onClick={()=>setMobileOpen(false)} style={{ flex:1, textAlign:"center", padding:"0.65rem", borderRadius:10, background:"linear-gradient(135deg,#28B8E8,#0A6A94)", fontSize:"0.87rem", fontWeight:700, color:"#fff", textDecoration:"none" }}>Start exploring</Link>
                      </>
                  )}
                </div>
              </div>
            </div>
        )}

        <style>{`
        @media (max-width: 768px) {
          .home-nav-links     { display: none !important; }
          .home-nav-auth-link { display: none !important; }
          .home-nav-username  { display: none !important; }
          .home-hamburger     { display: flex !important; }
        }
      `}</style>
      </>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsGo, setStatsGo] = useState(false);
  const [mouse,   setMouse]   = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onMouse = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMouse, { passive: true });
    return () => window.removeEventListener("mousemove", onMouse);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setLoading(false); });
    return () => unsub();
  }, []);

  useEffect(() => {
    const el = document.getElementById("stats-row");
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStatsGo(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el); return () => obs.disconnect();
  }, []);

  const { ref: stepsRef, visible: stepsVisible } = useVisible(0.3);
  const S: CSSProperties = { fontFamily: "Georgia,'Playfair Display',serif" };

  const fade = (delay: number): CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(20px)",
    transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
  });

  return (
      <div style={{ fontFamily:"'Lato',system-ui,sans-serif", color:"#0A3D52", background:"#fff", minHeight:"100vh" }}>
        <HomeNav user={user} loading={loading}/>

        {/* ── HERO ── */}
        <section style={{ minHeight:"100vh", position:"relative", display:"flex", alignItems:"center", padding:"0 1.5rem", background:"linear-gradient(160deg,#EBF8FF 0%,#fff 45%,#EBF8FF 100%)", overflow:"hidden" }}>
          <SavannaBackground mouse={mouse}/>
          <div style={{ position:"relative", zIndex:2, maxWidth:1200, margin:"0 auto", width:"100%", paddingTop:64 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:"3rem" }} className="hero-grid">
              <div>
                <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#EBF8FF", border:"1px solid rgba(14,133,178,0.18)", borderRadius:40, padding:"0.35rem 0.9rem", fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.12em", color:"#1E9DC8", textTransform:"uppercase", marginBottom:"1.5rem", ...fade(100) }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:"#1E9DC8", display:"inline-block" }}/>
                  Discover the land of origins
                </div>
                <h1 style={{ ...S, fontSize:"clamp(2.4rem,5vw,4rem)", fontWeight:700, lineHeight:1.08, color:"#0A3D52", letterSpacing:"-0.025em", marginBottom:"1.4rem", ...fade(250) }}>
                  Journey into<br/><em style={{ color:"#1E9DC8" }}>Ancient</em>{" "}Ethiopia
                </h1>
                <p style={{ fontSize:"clamp(0.9rem,1.5vw,1.05rem)", fontWeight:300, lineHeight:1.75, color:"#1A6A8A", marginBottom:"2.2rem", maxWidth:440, ...fade(400) }}>
                  From rock-hewn churches rising from cliffsides to the alien landscapes of the Danakil — curated tours, local guides, and stories that last a lifetime.
                </p>
                <div style={{ display:"flex", gap:"0.85rem", flexWrap:"wrap", marginBottom:"2.5rem", ...fade(550) }}>
                  <Link href="/destinations" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"linear-gradient(135deg,#28B8E8,#0A6A94)", color:"#fff", fontSize:"0.9rem", fontWeight:700, padding:"0.85rem 1.75rem", borderRadius:10, textDecoration:"none", boxShadow:"0 4px 20px rgba(14,133,178,0.38)" }}>
                    Explore destinations
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 7h10M8 3l4 4-4 4"/></svg>
                  </Link>
                  <Link href="/tours" style={{ display:"inline-flex", alignItems:"center", color:"#1A6A8A", fontSize:"0.9rem", padding:"0.85rem 1.75rem", borderRadius:10, textDecoration:"none", border:"1.5px solid rgba(14,133,178,0.28)" }}>Browse tours</Link>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:"1rem", fontSize:"0.78rem", color:"#1A6A8A", fontWeight:300, ...fade(700) }}>
                  <div style={{ display:"flex" }}>
                    {["#28B8E8","#0E85B2","#1E9DC8","#0A6A94"].map((c,i)=>(
                        <div key={i} style={{ width:30, height:30, borderRadius:"50%", border:"2px solid #fff", background:c, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.7rem", fontWeight:700, color:"#fff", marginLeft:i===0?0:-8 }}>{["A","B","C","D"][i]}</div>
                    ))}
                  </div>
                  <div style={{ width:1, height:20, background:"rgba(14,133,178,0.2)" }}/>
                  <div>
                    <div style={{ color:"#F59E0B" }}>★★★★★</div>
                    <div style={{ marginTop:2 }}>Trusted by 12,000+ travelers</div>
                  </div>
                </div>
              </div>

              {/* Hero card — hidden on small mobile */}
              <div className="hero-card-col" style={{ position:"relative", display:"flex", justifyContent:"center", alignItems:"center", minHeight:360, ...fade(400) }}>
                <div style={{ position:"absolute", width:240, height:180, background:"#EBF8FF", border:"1px solid rgba(14,133,178,0.12)", borderRadius:20, top:"50%", left:"-5%", transform:"translateY(-50%) rotate(-5deg)", zIndex:1 }}/>
                <div style={{ position:"absolute", width:260, height:200, background:"linear-gradient(135deg,#1E9DC8,#0A6A94)", borderRadius:20, top:"50%", right:"-4%", transform:"translateY(-50%) rotate(6deg)", zIndex:1, opacity:0.15 }}/>
                <div style={{ position:"relative", zIndex:10, background:"#fff", border:"1px solid rgba(14,133,178,0.12)", borderRadius:20, padding:"1.75rem", width:280, boxShadow:"0 20px 60px rgba(14,133,178,0.12)" }}>
                  <div style={{ position:"relative", width:"100%", height:150, borderRadius:12, background:"linear-gradient(135deg,#1E9DC8,#0A6A94)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"3rem", marginBottom:"1rem", overflow:"hidden" }}>
                    <span style={{ position:"relative", zIndex:2 }}>⛪</span>
                    <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,transparent 40%,rgba(6,62,90,0.4) 100%)" }}/>
                    <div style={{ position:"absolute", bottom:10, left:12, zIndex:10, fontSize:"0.72rem", fontWeight:700, color:"#fff" }}>Lalibela, Ethiopia</div>
                  </div>
                  <div style={{ ...S, fontSize:"1.1rem", fontWeight:600, color:"#0A3D52", marginBottom:"0.3rem" }}>Rock-Hewn Churches</div>
                  <div style={{ fontSize:"0.78rem", color:"#1A6A8A", fontWeight:300, marginBottom:"1rem" }}>A UNESCO wonder carved from living rock in the 12th century</div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:"0.85rem", borderTop:"1px solid #EBF8FF" }}>
                    <span style={{ fontSize:"0.78rem", fontWeight:700, color:"#0A3D52" }}><span style={{ color:"#F59E0B" }}>★</span> 4.9 · 348 reviews</span>
                    <span style={{ fontSize:"0.78rem", fontWeight:700, color:"#1E9DC8" }}>From $299</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <style>{`
          @media (min-width: 900px) {
            .hero-grid { grid-template-columns: 1fr 1fr !important; gap: 5rem !important; align-items: center; }
          }
          @media (max-width: 640px) {
            .hero-card-col { display: none !important; }
          }
        `}</style>
        </section>

        {/* ── STATS ── */}
        <div id="stats-row" style={{ position:"relative", background:"linear-gradient(135deg,#062B3A 0%,#0A4D66 50%,#0D6E8A 100%)", padding:"2.5rem 1.5rem", overflow:"hidden" }}>
          <OceanBackground/>
          <div style={{ position:"relative", zIndex:2, maxWidth:1200, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"1rem" }} className="stats-grid">
            <Stat num={40}  suffix="+"  label="Destinations"   go={statsGo}/>
            <Stat num={80} suffix="+"  label="Curated tours"  go={statsGo}/>
            <Stat num={12}  suffix="K+" label="Happy travelers" go={statsGo}/>
            <Stat num={4.9} suffix="★"  label="Average rating" dec={1} go={statsGo}/>
          </div>
          <style>{`@media(min-width:640px){.stats-grid{grid-template-columns:repeat(4,1fr)!important}}`}</style>
        </div>

        {/* ── DESTINATIONS ── */}
        <section id="destinations" style={{ position:"relative", padding:"5rem 1.5rem", background:"#F0FAFE", overflow:"hidden" }}>
          <SkyBackground/>
          <div style={{ position:"relative", zIndex:2, maxWidth:1200, margin:"0 auto" }}>
            <Reveal style={{ marginBottom:"2.5rem" }}>
              <p style={{ fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.18em", color:"#1E9DC8", textTransform:"uppercase", marginBottom:"0.6rem" }}>Where to go</p>
              <h2 style={{ ...S, fontSize:"clamp(1.7rem,3vw,2.6rem)", fontWeight:600, color:"#0A3D52", marginBottom:"0.85rem" }}>
                Ethiopia's most <em style={{ color:"#1E9DC8" }}>extraordinary</em> places
              </h2>
            </Reveal>
            {/* ── RESPONSIVE GRID ── */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:"1.1rem" }} className="dest-grid">
              {DESTINATIONS.map((d,i)=>(
                  <Reveal key={d.name} delay={i*70}>
                    <Link href="/destinations" style={{ display:"flex", alignItems:"center", gap:"1rem", textDecoration:"none", background:"rgba(255,255,255,0.88)", backdropFilter:"blur(10px)", border:"1px solid rgba(14,133,178,0.12)", borderRadius:16, padding:"1.1rem 1.25rem", transition:"transform 0.3s, box-shadow 0.3s" }}
                          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(-4px)";(e.currentTarget as HTMLElement).style.boxShadow="0 16px 40px rgba(14,133,178,0.12)";}}
                          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform="none";(e.currentTarget as HTMLElement).style.boxShadow="none";}}>
                      <div style={{ width:52, height:52, borderRadius:14, background:"linear-gradient(135deg,#EBF8FF,#D6F0FA)", border:"1px solid rgba(14,133,178,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.5rem", flexShrink:0 }}>{d.icon}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", flexWrap:"wrap", marginBottom:"0.2rem" }}>
                          <div style={{ ...S, fontSize:"1rem", fontWeight:600, color:"#0A3D52" }}>{d.name}</div>
                          <span style={{ fontSize:"0.62rem", fontWeight:700, letterSpacing:"0.08em", padding:"0.2rem 0.55rem", borderRadius:20, textTransform:"uppercase", background:d.tagBg, color:d.tagColor }}>{d.tag}</span>
                        </div>
                        <div style={{ fontSize:"0.8rem", color:"#1A6A8A", fontWeight:300 }}>{d.sub}</div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:"0.35rem", fontSize:"0.75rem", fontWeight:700, color:"#1E9DC8", flexShrink:0 }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="6" cy="6" r="4.5"/><path d="M6 3.5V6l1.5 1.5"/></svg>
                        {d.days}
                      </div>
                    </Link>
                  </Reveal>
              ))}
            </div>
            <style>{`@media(min-width:640px){.dest-grid{grid-template-columns:repeat(2,1fr)!important}}@media(min-width:1024px){.dest-grid{grid-template-columns:repeat(3,1fr)!important}}`}</style>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <div id="how" style={{ position:"relative", background:"#E8F6FA", borderTop:"1px solid rgba(14,133,178,0.10)", borderBottom:"1px solid rgba(14,133,178,0.10)", padding:"5rem 1.5rem", overflow:"hidden" }}>
          <UnderwaterBackground/>
          <div style={{ position:"relative", zIndex:2, maxWidth:1200, margin:"0 auto" }}>
            <Reveal style={{ marginBottom:"2.5rem" }}>
              <p style={{ fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.18em", color:"#1E9DC8", textTransform:"uppercase", marginBottom:"0.6rem" }}>How it works</p>
              <h2 style={{ ...S, fontSize:"clamp(1.7rem,3vw,2.6rem)", fontWeight:600, color:"#0A3D52" }}>
                Plan your trip in <em style={{ color:"#1E9DC8" }}>four steps</em>
              </h2>
            </Reveal>
            <div ref={stepsRef} style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2rem 1rem" }} className="steps-grid">
              {STEPS.map((s,i)=>(
                  <div key={s.n} style={{ textAlign:"center", padding:"0 0.5rem", opacity:stepsVisible?1:0, transform:stepsVisible?"translateY(0)":"translateY(24px)", transition:`opacity 0.6s ease ${i*150}ms,transform 0.6s ease ${i*150}ms` }}>
                    <div style={{ width:52, height:52, borderRadius:"50%", margin:"0 auto 1rem", background:"linear-gradient(135deg,#28B8E8,#0A6A94)", display:"flex", alignItems:"center", justifyContent:"center", ...S, fontSize:"1.2rem", fontWeight:700, color:"#fff", boxShadow:"0 4px 16px rgba(14,133,178,0.30)" }}>{s.n}</div>
                    <div style={{ ...S, fontSize:"1rem", fontWeight:600, color:"#0A3D52", marginBottom:"0.5rem" }}>{s.title}</div>
                    <div style={{ fontSize:"0.8rem", fontWeight:300, color:"#1A6A8A", lineHeight:1.65 }}>{s.desc}</div>
                  </div>
              ))}
            </div>
            <style>{`@media(min-width:768px){.steps-grid{grid-template-columns:repeat(4,1fr)!important}}`}</style>
          </div>
        </div>

        {/* ── FEATURES ── */}
        <section id="features" style={{ position:"relative", padding:"5rem 1.5rem", background:"#FFFBF0", overflow:"hidden" }}>
          <FeatureOceanBackground/>
          <div style={{ position:"relative", zIndex:2, maxWidth:1200, margin:"0 auto" }}>
            <Reveal style={{ marginBottom:"2.5rem" }}>
              <p style={{ fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.18em", color:"#1E9DC8", textTransform:"uppercase", marginBottom:"0.6rem" }}>Why Tizitaw</p>
              <h2 style={{ ...S, fontSize:"clamp(1.7rem,3vw,2.6rem)", fontWeight:600, color:"#0A3D52" }}>
                Everything you need to <em style={{ color:"#1E9DC8" }}>travel well</em>
              </h2>
            </Reveal>
            <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:"1.25rem" }} className="features-grid">
              {FEATURES.map((f,i)=>(
                  <Reveal key={f.title} delay={i*60}>
                    <div style={{ background:"rgba(255,255,255,0.88)", backdropFilter:"blur(8px)", border:"1px solid rgba(14,133,178,0.10)", borderRadius:16, padding:"1.5rem" }}>
                      <div style={{ width:48, height:48, borderRadius:14, background:"linear-gradient(135deg,#EBF8FF,#D6F0FA)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.3rem", marginBottom:"0.9rem" }}>{f.icon}</div>
                      <div style={{ ...S, fontSize:"1rem", fontWeight:600, color:"#0A3D52", marginBottom:"0.5rem" }}>{f.title}</div>
                      <div style={{ fontSize:"0.84rem", fontWeight:300, color:"#1A6A8A", lineHeight:1.7 }}>{f.desc}</div>
                    </div>
                  </Reveal>
              ))}
            </div>
            <style>{`@media(min-width:640px){.features-grid{grid-template-columns:repeat(2,1fr)!important}}@media(min-width:1024px){.features-grid{grid-template-columns:repeat(3,1fr)!important}}`}</style>
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ padding:"8rem 1.5rem", textAlign:"center", background:"linear-gradient(160deg,#EBF8FF,#fff,#EBF8FF)", position:"relative", overflow:"hidden" }}>
          {[400,650,900].map(size=>(<div key={size} style={{ position:"absolute", width:size, height:size, borderRadius:"50%", border:"1px solid rgba(14,133,178,0.08)", top:"50%", left:"50%", transform:"translate(-50%,-50%)", pointerEvents:"none" }}/>))}
          <Reveal>
            <div style={{ position:"relative", zIndex:2 }}>
              <h2 style={{ ...S, fontSize:"clamp(2rem,4vw,3.2rem)", fontWeight:700, color:"#0A3D52", letterSpacing:"-0.025em", lineHeight:1.12, marginBottom:"1rem" }}>
                Ready to experience<br/><em style={{ color:"#1E9DC8" }}>Ethiopia</em>?
              </h2>
              <p style={{ fontSize:"clamp(0.9rem,1.5vw,1rem)", fontWeight:300, color:"#1A6A8A", maxWidth:440, margin:"0 auto 2.5rem", lineHeight:1.7 }}>
                Create a free account and start building your journey today.
              </p>
              <div style={{ display:"flex", gap:"0.85rem", justifyContent:"center", flexWrap:"wrap" }}>
                {user ? (
                    <Link href="/destinations" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"linear-gradient(135deg,#28B8E8,#0A6A94)", color:"#fff", fontSize:"0.9rem", fontWeight:700, padding:"0.85rem 1.75rem", borderRadius:10, textDecoration:"none", boxShadow:"0 4px 20px rgba(14,133,178,0.38)" }}>
                      Explore destinations
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 7h10M8 3l4 4-4 4"/></svg>
                    </Link>
                ) : (
                    <>
                      <Link href="/auth/signup" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"linear-gradient(135deg,#28B8E8,#0A6A94)", color:"#fff", fontSize:"0.9rem", fontWeight:700, padding:"0.85rem 1.75rem", borderRadius:10, textDecoration:"none", boxShadow:"0 4px 20px rgba(14,133,178,0.38)" }}>
                        Create free account
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 7h10M8 3l4 4-4 4"/></svg>
                      </Link>
                      <Link href="/tours" style={{ display:"inline-flex", alignItems:"center", color:"#1A6A8A", fontSize:"0.9rem", padding:"0.85rem 1.75rem", borderRadius:10, textDecoration:"none", border:"1.5px solid rgba(14,133,178,0.28)" }}>Browse tours first</Link>
                    </>
                )}
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ background:"#0A3D52", padding:"2rem 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <a href="/" style={{ fontFamily:"Georgia,serif", textDecoration:"none", color:"rgba(200,242,255,0.65)", fontSize:"1.1rem", fontWeight:700 }}>Tizitaw <em>Ethiopia</em></a>
          <p style={{ fontSize:"0.72rem", color:"rgba(200,242,255,0.30)", fontWeight:300 }}>© {new Date().getFullYear()} Tizitaw Ethiopia. All rights reserved.</p>
          <div style={{ display:"flex", gap:"1.5rem" }}>
            {["Terms","Privacy","Contact"].map(l=>(<a key={l} href={`/${l.toLowerCase()}`} style={{ fontSize:"0.72rem", color:"rgba(200,242,255,0.38)", textDecoration:"none" }}>{l}</a>))}
          </div>
        </footer>
      </div>
  );
}