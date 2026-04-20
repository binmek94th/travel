"use client";

import Link from "next/link";
import { useState, useEffect, useRef, CSSProperties } from "react";

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
      <div style={{ textAlign: "center", padding: "0 2rem", borderRight: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ fontFamily: "Georgia,serif", fontSize: "clamp(1.8rem,3vw,2.4rem)", fontWeight: 700, color: "#fff", lineHeight: 1 }}>
          {dec ? v.toFixed(dec) : Math.floor(v)}{suffix}
        </div>
        <div style={{ fontSize: "0.7rem", letterSpacing: "0.12em", color: "rgba(168,228,248,0.7)", textTransform: "uppercase", marginTop: "0.4rem" }}>{label}</div>
      </div>
  );
}

// ── BACKGROUND SCENES ─────────────────────────────────────────────────────────

// HERO: savanna + jeep (curvy bounce along ground)
function SavannaBackground({ mouse }: { mouse: { x: number; y: number } }) {
  const [jx, setJx] = useState(-140);
  const [jy, setJy] = useState(0);
  const [wheel, setWheel] = useState(0);
  const W = typeof window !== "undefined" ? window.innerWidth : 1600;
  const mx = mouse.x / W;
  const my = mouse.y / (typeof window !== "undefined" ? window.innerHeight : 900);

  useRAF((now) => {
    const dur = 16000;
    const p = (now % dur) / dur;
    setJx(-140 + p * (W + 280));
    // Bouncy terrain: combination of sine waves to simulate rough ground
    setJy(Math.sin(p * Math.PI * 8) * 5 + Math.sin(p * Math.PI * 14) * 2);
    setWheel((now / 55) % 360);
  });

  return (
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#EBF8FF 0%,#fffde7 55%,#fff8e1 80%,rgba(255,248,225,0) 100%)", opacity: 0.6 }} />
        {/* Parallax blobs */}
        <div style={{ position: "absolute", top: -180, right: -180, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(40,184,232,0.13) 0%,transparent 70%)", transform: `translate(${mx*-14}px,${my*-9}px)`, transition: "transform 0.12s" }} />
        <div style={{ position: "absolute", bottom: -240, left: -160, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(42,158,216,0.10) 0%,transparent 70%)", transform: `translate(${mx*9}px,${my*7}px)`, transition: "transform 0.12s" }} />
        {/* Dot grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(14,133,178,0.12) 1px,transparent 1px)", backgroundSize: "36px 36px", WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 75% 50%,black 20%,transparent 80%)", maskImage: "radial-gradient(ellipse 70% 60% at 75% 50%,black 20%,transparent 80%)" }} />
        {/* Ground */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "30%", background: "linear-gradient(180deg,transparent,rgba(253,230,138,0.3))" }} />
        {/* Acacia trees */}
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
        {/* JEEP — bouncy on terrain */}
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
          {/* Dust clouds */}
          <ellipse cx="-10" cy="56" rx="12" ry="7" fill="rgba(146,64,14,0.28)"/>
          <ellipse cx="-26" cy="54" rx="17" ry="10" fill="rgba(146,64,14,0.18)"/>
          <ellipse cx="-46" cy="51" rx="22" ry="12" fill="rgba(146,64,14,0.10)"/>
        </svg>
      </div>
  );
}

// STATS: deep teal ocean with boat following wave curve
function OceanBackground() {
  const [bx, setBx] = useState(-120);
  const [by, setBy] = useState(0);
  const [oar, setOar] = useState(0);
  const [tilt, setTilt] = useState(0);

  useRAF((now) => {
    const W = typeof window !== "undefined" ? window.innerWidth : 1600;
    const dur = 18000;
    const p = (now % dur) / dur;
    setBx(-120 + p * (W + 240));
    // Wave path: rises and falls like ocean swells
    const wave = Math.sin(p * Math.PI * 3) * 18 + Math.sin(p * Math.PI * 7) * 8;
    setBy(wave);
    setTilt(Math.sin(p * Math.PI * 3) * 6); // tilt with the wave
    setOar(Math.sin(now / 450) * 25);
  });

  return (
      <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
        {/* Animated glowing orb */}
        <div style={{ position:"absolute", top:"-20%", left:"60%", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle,rgba(40,184,232,0.12) 0%,transparent 70%)" }}/>
        {/* Wave lines */}
        {[0,1,2,3,4].map(i=>(
            <div key={i} style={{ position:"absolute", top:`${10+i*22}%`, left:0, right:0, height:1.5, background:`rgba(255,255,255,${0.07-i*0.01})`, borderRadius:2 }}/>
        ))}
        {/* BOAT — large, riding wave curve */}
        <svg style={{ position:"absolute", top:`calc(22% + ${by}px)`, left:bx, transform:`rotate(${tilt}deg)`, transformOrigin:"55px 65px", opacity:0.30 }} width="130" height="95" viewBox="0 0 130 95">
          {/* Hull */}
          <path d="M5 68 Q65 82 125 68 L117 78 Q65 92 13 78Z" fill="rgba(255,255,255,0.95)"/>
          <path d="M5 68 L125 68" stroke="rgba(40,184,232,0.6)" strokeWidth="2"/>
          {/* Mast */}
          <line x1="65" y1="68" x2="65" y2="8" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5"/>
          {/* Main sail */}
          <path d="M65 10 L108 60 L65 67Z" fill="rgba(255,255,255,0.90)"/>
          {/* Jib */}
          <path d="M65 14 L22 58 L65 65Z" fill="rgba(235,248,255,0.75)"/>
          {/* Flag */}
          <path d="M65 8 L80 14 L65 20Z" fill="rgba(40,184,232,0.9)"/>
          {/* Oars */}
          <line x1="22" y1="70" x2="2" y2="84" stroke="rgba(255,255,255,0.7)" strokeWidth="3" strokeLinecap="round" transform={`rotate(${oar} 22 70)`}/>
          <line x1="108" y1="70" x2="128" y2="84" stroke="rgba(255,255,255,0.7)" strokeWidth="3" strokeLinecap="round" transform={`rotate(${-oar} 108 70)`}/>
          {/* Wake */}
          <path d="M5 74 Q-18 77 -42 74" stroke="rgba(255,255,255,0.30)" strokeWidth="2" fill="none"/>
          <path d="M5 79 Q-22 82 -52 79" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" fill="none"/>
        </svg>
      </div>
  );
}

// DESTINATIONS: bright sky blue with BIG plane doing sweeping curve
function SkyBackground() {
  const [px, setPx] = useState(-100);
  const [py, setPy] = useState(0);
  const [ptilt, setPtilt] = useState(0);

  useRAF((now) => {
    const W = typeof window !== "undefined" ? window.innerWidth : 1600;
    const dur = 16000;
    const p = (now % dur) / dur;
    setPx(-100 + p * (W + 200));
    // Sweeping arc: dips down then climbs back up
    const arc = -Math.sin(p * Math.PI) * 80; // big arc top to bottom and back
    const wobble = Math.sin(p * Math.PI * 5) * 8;
    setPy(arc + wobble);
    // Tilt nose up when climbing, down when diving
    const dy = -Math.cos(p * Math.PI) * 80 * (Math.PI / 16000) + Math.cos(p * Math.PI * 5) * 8 * (Math.PI * 5 / 16000);
    setPtilt(Math.atan2(dy * 60, 1) * (180 / Math.PI) * 0.4);
  });

  return (
      <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
        {/* Sky gradient — distinct bright sky blue */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,#E0F7FF 0%,#B3EEFF 30%,rgba(179,238,255,0.15) 70%,transparent 100%)", opacity:0.75 }}/>
        {/* Clouds — large fluffy */}
        {[{x:"5%",y:"8%",s:1.3,o:0.28},{x:"22%",y:"22%",s:0.9,o:0.22},{x:"44%",y:"6%",s:1.6,o:0.25},{x:"66%",y:"18%",s:1.1,o:0.22},{x:"82%",y:"8%",s:1.4,o:0.26}].map((c,i)=>(
            <svg key={i} style={{ position:"absolute", left:c.x, top:c.y, opacity:c.o, transform:`scale(${c.s})` }} width="100" height="50" viewBox="0 0 100 50">
              <ellipse cx="50" cy="36" rx="48" ry="16" fill="#1E9DC8"/>
              <ellipse cx="30" cy="28" rx="24" ry="20" fill="#1E9DC8"/>
              <ellipse cx="68" cy="26" rx="28" ry="22" fill="#1E9DC8"/>
              <ellipse cx="50" cy="24" rx="22" ry="18" fill="#28B8E8"/>
            </svg>
        ))}
        {/* Contrail */}
        {px > 50 && (
            <div style={{ position:"absolute", top:`calc(35% + ${py}px)`, left:0, width:Math.max(0,px), height:2, background:"linear-gradient(90deg,transparent,rgba(14,133,178,0.20))", borderRadius:2, pointerEvents:"none" }}/>
        )}
        {/* BIG PLANE */}
        <svg style={{ position:"absolute", top:"30%", left:px, transform:`translateY(${py}px) rotate(${ptilt}deg)`, opacity:0.30, transformOrigin:"55px 25px" }} width="130" height="58" viewBox="0 0 130 58">
          {/* Body */}
          <path d="M2 29 Q30 18 80 24 L122 29 L80 34 Q30 40 2 29Z" fill="#0A6A94"/>
          {/* Main wing */}
          <path d="M34 24 L65 4 L72 10 L44 29Z" fill="#1E9DC8"/>
          <path d="M34 34 L65 54 L72 48 L44 29Z" fill="#28B8E8" opacity="0.85"/>
          {/* Tail wing */}
          <path d="M82 24 L106 12 L109 19 L90 27Z" fill="#1E9DC8"/>
          <path d="M82 34 L106 46 L109 39 L90 31Z" fill="#28B8E8" opacity="0.75"/>
          {/* Windows */}
          {[46,57,68,79].map(x=>(
              <ellipse key={x} cx={x} cy="27" rx="3.5" ry="2.8" fill="rgba(235,248,255,0.90)"/>
          ))}
          {/* Nose */}
          <ellipse cx="122" cy="29" rx="6" ry="4" fill="#0A3D52"/>
        </svg>
      </div>
  );
}

// HOW IT WORKS: deep ocean — BIG scuba diver doing figure-8 path
function UnderwaterBackground() {
  const [dx, setDx] = useState(-110);
  const [dy, setDy] = useState(0);
  const [flipper, setFlipper] = useState(0);
  const [dtilt, setDtilt] = useState(0);
  const [fx, setFx] = useState(-50);
  const [fy, setFy] = useState(0);
  const [f2x, setF2x] = useState(0);

  useRAF((now) => {
    const W = typeof window !== "undefined" ? window.innerWidth : 1600;
    const dur = 20000;
    const p = (now % dur) / dur;
    setDx(-110 + p * (W + 220));
    // Figure-8 style vertical path
    const path = Math.sin(p * Math.PI * 4) * 35 + Math.sin(p * Math.PI * 2) * 20;
    setDy(path);
    const dpath2 = -Math.cos(p * Math.PI * 4) * 35 * (Math.PI * 4 / dur);
    setDtilt(Math.atan2(dpath2 * 500, 1) * (180/Math.PI) * 0.35);
    setFlipper(Math.sin(now / 200) * 28);

    // Fish 1: wavy horizontal
    setFx(-50 + ((now * 0.062) % (W + 100)));
    setFy(Math.sin(now / 700) * 20);
    // Fish 2: opposite direction
    setF2x(W + 40 - ((now * 0.038) % (W + 100)));
  });

  return (
      <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
        {/* Deep ocean background — distinct dark teal */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,rgba(0,77,102,0.18) 0%,rgba(0,105,140,0.12) 50%,rgba(0,77,102,0.08) 100%)" }}/>
        {/* Light rays */}
        {[12,25,42,60,75,88].map((x,i)=>(
            <div key={i} style={{ position:"absolute", top:0, left:`${x}%`, width:1.5, height:"70%", background:`linear-gradient(180deg,rgba(40,184,232,${0.08-i*0.01}),transparent)`, transform:`rotate(${(i-2.5)*4}deg)`, transformOrigin:"top center" }}/>
        ))}
        {/* Bubbles */}
        {[6,14,24,35,46,57,68,78,88,95].map((l,i)=>(
            <div key={i} style={{ position:"absolute", left:`${l}%`, bottom:`${(i*19+8)%85}%`, width:5+i%3*3, height:5+i%3*3, borderRadius:"50%", border:"1.5px solid rgba(40,184,232,0.25)", background:"rgba(235,248,255,0.10)" }}/>
        ))}
        {/* Large coral */}
        {[4,16,30,46,60,74,88].map((l,i)=>(
            <svg key={i} style={{ position:"absolute", bottom:0, left:`${l}%`, opacity:0.18 }} width="44" height="60" viewBox="0 0 44 60">
              <path d="M22 60 Q22 36 14 20 Q8 6 16 2 Q22 0 28 2 Q36 6 30 20 Q22 36 22 60Z" fill={["#1E9DC8","#0E85B2","#28B8E8","#0A6A94","#1E9DC8"][i%5]}/>
              <path d="M22 48 Q12 36 6 22" stroke="rgba(40,184,232,0.5)" strokeWidth="2" fill="none"/>
              <path d="M22 48 Q32 36 38 22" stroke="rgba(40,184,232,0.5)" strokeWidth="2" fill="none"/>
            </svg>
        ))}
        {/* Fish 1 — wavy */}
        <svg style={{ position:"absolute", top:`calc(30% + ${fy}px)`, left:fx, opacity:0.30 }} width="55" height="34" viewBox="0 0 55 34">
          <path d="M6 17 Q27 6 46 17 Q27 28 6 17Z" fill="#28B8E8"/>
          <path d="M0 8 L9 17 L0 26Z" fill="#28B8E8"/>
          <circle cx="40" cy="15" r="4" fill="rgba(10,61,82,0.5)"/>
          <circle cx="41" cy="14" r="1.5" fill="rgba(235,248,255,0.8)"/>
        </svg>
        {/* Fish 2 — opposite */}
        <svg style={{ position:"absolute", top:"58%", left:f2x, transform:"scaleX(-1)", opacity:0.22 }} width="44" height="28" viewBox="0 0 44 28">
          <path d="M5 14 Q22 5 38 14 Q22 23 5 14Z" fill="#26C6DA"/>
          <path d="M0 6 L7 14 L0 22Z" fill="#26C6DA"/>
          <circle cx="32" cy="12" r="3" fill="rgba(10,61,82,0.5)"/>
        </svg>
        {/* BIG DIVER — figure-8 path */}
        <svg style={{ position:"absolute", top:"20%", left:dx, transform:`translateY(${dy}px) rotate(${dtilt}deg)`, opacity:0.32, transformOrigin:"55px 35px" }} width="110" height="70" viewBox="0 0 110 70">
          {/* Tank */}
          <rect x="36" y="18" width="16" height="28" rx="7" fill="#0A3D52"/>
          <rect x="38" y="14" width="12" height="8" rx="3" fill="#0E85B2"/>
          {/* Body suit */}
          <ellipse cx="46" cy="35" rx="18" ry="13" fill="#1E9DC8"/>
          {/* Legs */}
          <path d="M34 42 Q26 50 22 58" stroke="#1E9DC8" strokeWidth="8" strokeLinecap="round" fill="none"/>
          <path d="M46 46 Q40 54 36 62" stroke="#1E9DC8" strokeWidth="8" strokeLinecap="round" fill="none"/>
          {/* Flippers */}
          <path d="M22 58 Q10 62 6 68 Q16 64 28 60Z" fill="#0E85B2" transform={`rotate(${flipper * 0.7} 22 58)`}/>
          <path d="M36 62 Q24 66 20 72 Q30 68 42 64Z" fill="#0E85B2" transform={`rotate(${-flipper * 0.7} 36 62)`}/>
          {/* Head / mask */}
          <circle cx="68" cy="28" r="13" fill="#0A6A94"/>
          <rect x="60" y="20" width="18" height="14" rx="5" fill="rgba(235,248,255,0.88)"/>
          <rect x="62" y="22" width="14" height="10" rx="3" fill="rgba(14,133,178,0.35)"/>
          {/* Arm + regulator hose */}
          <path d="M52 26 Q70 18 84 22" stroke="#1E9DC8" strokeWidth="5" strokeLinecap="round" fill="none"/>
          {/* Regulator bubbles */}
          <circle cx="85" cy="20" r="4" fill="rgba(235,248,255,0.45)"/>
          <circle cx="90" cy="14" r="3" fill="rgba(235,248,255,0.35)"/>
          <circle cx="94" cy="8"  r="2.5" fill="rgba(235,248,255,0.25)"/>
          <circle cx="97" cy="3"  r="2" fill="rgba(235,248,255,0.15)"/>
        </svg>
      </div>
  );
}

// FEATURES: warm sunset ocean — yacht + cruiser on curvy swells
function FeatureOceanBackground() {
  const [yx, setYx] = useState(-130);
  const [yy, setYy] = useState(0);
  const [ytilt, setYtilt] = useState(0);
  const [cx, setCx] = useState(0);
  const [cy, setCy] = useState(0);
  const [ctilt, setCtilt] = useState(0);

  useRAF((now) => {
    const W = typeof window !== "undefined" ? window.innerWidth : 1600;

    // Yacht — gentle ocean swells
    const yDur = 20000;
    const yp = (now % yDur) / yDur;
    setYx(-130 + yp * (W + 260));
    const yswell = Math.sin(yp * Math.PI * 4) * 20 + Math.sin(yp * Math.PI * 7) * 8;
    setYy(yswell);
    setYtilt(Math.sin(yp * Math.PI * 4) * 5);

    // Cruiser — opposite direction, different swell
    const cDur = 25000;
    const cp = (now % cDur) / cDur;
    setCx(W + 160 - cp * (W + 320));
    const cswell = Math.sin(cp * Math.PI * 3) * 16 + Math.cos(cp * Math.PI * 6) * 6;
    setCy(cswell);
    setCtilt(-Math.sin(cp * Math.PI * 3) * 4);
  });

  return (
      <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
        {/* Warm golden-blue sunset sky */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,rgba(255,236,153,0.20) 0%,rgba(255,184,0,0.08) 25%,rgba(40,184,232,0.10) 55%,rgba(2,136,209,0.06) 100%)" }}/>
        {/* Sun glare */}
        <div style={{ position:"absolute", top:"5%", right:"15%", width:120, height:120, borderRadius:"50%", background:"radial-gradient(circle,rgba(255,236,153,0.35) 0%,rgba(255,184,0,0.12) 40%,transparent 70%)" }}/>
        {/* Sun rays */}
        {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg,i)=>(
            <div key={i} style={{ position:"absolute", top:"5%", right:"15%", width:1, height:60, background:"rgba(255,220,80,0.08)", transform:`rotate(${deg}deg)`, transformOrigin:"top center" }}/>
        ))}
        {/* Horizon */}
        <div style={{ position:"absolute", top:"45%", left:0, right:0, height:1.5, background:"rgba(14,133,178,0.12)" }}/>
        {/* Swell lines */}
        {[0,1,2,3,4].map(i=>(
            <div key={i} style={{ position:"absolute", top:`${48+i*11}%`, left:0, right:0, height:1.5, background:`rgba(14,133,178,${0.07-i*0.01})` }}/>
        ))}
        {/* YACHT — large, riding swells */}
        <svg style={{ position:"absolute", top:`calc(28% + ${yy}px)`, left:yx, transform:`rotate(${ytilt}deg)`, transformOrigin:"65px 75px", opacity:0.28 }} width="140" height="100" viewBox="0 0 140 100">
          <path d="M8 70 Q70 84 132 70 L124 80 Q70 94 16 80Z" fill="#0A3D52"/>
          <line x1="70" y1="70" x2="70" y2="8" stroke="#0A6A94" strokeWidth="3"/>
          <path d="M70 10 L115 62 L70 68Z" fill="white" opacity="0.95"/>
          <path d="M70 14 L25 60 L70 66Z" fill="#EBF8FF" opacity="0.88"/>
          <path d="M70 8 L88 16 L70 24Z" fill="#1E9DC8"/>
          <path d="M8 76 Q-18 80 -46 76" stroke="rgba(255,255,255,0.35)" strokeWidth="2" fill="none"/>
          <path d="M8 81 Q-24 85 -58 81" stroke="rgba(255,255,255,0.20)" strokeWidth="1.5" fill="none"/>
        </svg>
        {/* CRUISER — large, opposite direction */}
        <svg style={{ position:"absolute", top:`calc(48% + ${cy}px)`, left:cx, transform:`scaleX(-1) rotate(${ctilt}deg)`, transformOrigin:"85px 50px", opacity:0.22 }} width="180" height="78" viewBox="0 0 180 78">
          <path d="M5 52 Q90 66 175 52 L166 62 Q90 76 14 62Z" fill="#0E85B2"/>
          <rect x="32" y="28" width="112" height="26" rx="5" fill="#0A6A94"/>
          <rect x="54" y="14" width="68" height="18" rx="4" fill="#0A3D52"/>
          {[60,74,88,102].map(x=>(
              <rect key={x} x={x} y="17" width="10" height="10" rx="2.5" fill="rgba(235,248,255,0.65)"/>
          ))}
          {[42,58,74,90,106,122,138].map(x=>(
              <circle key={x} cx={x} cy="42" r="4.5" fill="rgba(235,248,255,0.38)"/>
          ))}
          <rect x="78" y="8" width="18" height="12" rx="3" fill="#0A3D52"/>
          {/* Smoke */}
          <circle cx="85" cy="5"  r="5" fill="rgba(200,220,240,0.22)"/>
          <circle cx="90" cy="0"  r="6" fill="rgba(200,220,240,0.15)"/>
          {/* Wake */}
          <path d="M175 57 Q198 60 220 57" stroke="rgba(255,255,255,0.28)" strokeWidth="2" fill="none"/>
        </svg>
      </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [statsGo, setStatsGo] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 20);
    const onMouse  = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouse, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("mousemove", onMouse); };
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

        {/* NAV */}
        <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, height:64, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 2.5rem", background: scrolled ? "rgba(255,255,255,0.96)" : "transparent", borderBottom: scrolled ? "1px solid rgba(14,133,178,0.10)" : "none", boxShadow: scrolled ? "0 2px 24px rgba(14,133,178,0.08)" : "none", backdropFilter: scrolled ? "blur(16px)" : "none", transition:"all 0.3s ease" }}>
          <a href="/" style={{ ...S, fontSize:"1.3rem", fontWeight:700, color:"#0A3D52", textDecoration:"none" }}>
            Tizitaw <em style={{ fontStyle:"italic", color:"#1E9DC8" }}>Ethiopia</em>
          </a>
          <div style={{ display:"flex", alignItems:"center", gap:"2rem" }}>
            {[["#destinations","Destinations"],["#how","How it works"],["#features","Why us"]].map(([h,l])=>(
                <a key={h} href={h} style={{ fontSize:"0.83rem", color:"#1A6A8A", textDecoration:"none" }}>{l}</a>
            ))}
          </div>
          <div style={{ display:"flex", gap:"0.75rem", alignItems:"center" }}>
            <Link href="/auth/login" style={{ fontSize:"0.83rem", color:"#1A6A8A", textDecoration:"none", padding:"0.45rem 0.85rem", borderRadius:8 }}>Sign in</Link>
            <Link href="/auth/signup" style={{ fontSize:"0.83rem", fontWeight:700, color:"#fff", background:"linear-gradient(135deg,#28B8E8,#0A6A94)", padding:"0.5rem 1.15rem", borderRadius:8, textDecoration:"none" }}>Start exploring</Link>
          </div>
        </nav>

        {/* ── HERO — savanna + jeep ── */}
        <section style={{ minHeight:"100vh", position:"relative", display:"flex", alignItems:"center", padding:"0 2.5rem", background:"linear-gradient(160deg,#EBF8FF 0%,#fff 45%,#EBF8FF 100%)", overflow:"hidden" }}>
          <SavannaBackground mouse={mouse}/>
          <div style={{ position:"relative", zIndex:2, maxWidth:1200, margin:"0 auto", width:"100%", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"5rem", alignItems:"center", paddingTop:64 }}>
            <div>
              <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#EBF8FF", border:"1px solid rgba(14,133,178,0.18)", borderRadius:40, padding:"0.35rem 0.9rem", fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.12em", color:"#1E9DC8", textTransform:"uppercase", marginBottom:"1.5rem", ...fade(100) }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"#1E9DC8", display:"inline-block" }}/>
                Discover the land of origins
              </div>
              <h1 style={{ ...S, fontSize:"clamp(2.8rem,4.5vw,4rem)", fontWeight:700, lineHeight:1.08, color:"#0A3D52", letterSpacing:"-0.025em", marginBottom:"1.4rem", ...fade(250) }}>
                Journey into<br/><em style={{ color:"#1E9DC8" }}>Ancient</em>{" "}Ethiopia
              </h1>
              <p style={{ fontSize:"1.05rem", fontWeight:300, lineHeight:1.75, color:"#1A6A8A", marginBottom:"2.2rem", maxWidth:440, ...fade(400) }}>
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
                  <div style={{ color:"#F59E0B", letterSpacing:"-1px" }}>★★★★★</div>
                  <div style={{ marginTop:2 }}>Trusted by 12,000+ travelers</div>
                </div>
              </div>
            </div>
            {/* Hero card */}
            <div style={{ position:"relative", display:"flex", justifyContent:"center", alignItems:"center", minHeight:480, ...fade(400) }}>
              <div style={{ position:"absolute", width:240, height:180, background:"#EBF8FF", border:"1px solid rgba(14,133,178,0.12)", borderRadius:20, top:"50%", left:"-8%", transform:"translateY(-50%) rotate(-5deg)", zIndex:1 }}/>
              <div style={{ position:"absolute", width:260, height:200, background:"linear-gradient(135deg,#1E9DC8,#0A6A94)", borderRadius:20, top:"50%", right:"-6%", transform:"translateY(-50%) rotate(6deg)", zIndex:1, opacity:0.15 }}/>
              <div style={{ position:"relative", zIndex:10, background:"#fff", border:"1px solid rgba(14,133,178,0.12)", borderRadius:20, padding:"1.75rem", width:300, boxShadow:"0 20px 60px rgba(14,133,178,0.12)" }}>
                <div style={{ position:"relative", width:"100%", height:160, borderRadius:12, background:"linear-gradient(135deg,#1E9DC8,#0A6A94)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"3.5rem", marginBottom:"1rem", overflow:"hidden" }}>
                  <span style={{ position:"relative", zIndex:2 }}>⛪</span>
                  <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,transparent 40%,rgba(6,62,90,0.4) 100%)" }}/>
                  <div style={{ position:"absolute", bottom:10, left:12, zIndex:10, fontSize:"0.72rem", fontWeight:700, color:"#fff", letterSpacing:"0.06em", textTransform:"uppercase" }}>Lalibela, Ethiopia</div>
                </div>
                <div style={{ ...S, fontSize:"1.15rem", fontWeight:600, color:"#0A3D52", marginBottom:"0.3rem" }}>Rock-Hewn Churches</div>
                <div style={{ fontSize:"0.78rem", color:"#1A6A8A", fontWeight:300, marginBottom:"1rem" }}>A UNESCO wonder carved from living rock in the 12th century</div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:"0.85rem", borderTop:"1px solid #EBF8FF" }}>
                  <span style={{ fontSize:"0.78rem", fontWeight:700, color:"#0A3D52" }}><span style={{ color:"#F59E0B" }}>★</span> 4.9 · 348 reviews</span>
                  <span style={{ fontSize:"0.78rem", fontWeight:700, color:"#1E9DC8" }}>From $299</span>
                </div>
              </div>
              {[
                { s:{ top:"8%", right:"-5%" }, bg:"#D1FAE5", icon:"✅", title:"Booking confirmed", sub:"Lalibela Heritage Tour" },
                { s:{ bottom:"22%", left:"-8%" }, bg:"#EBF8FF", icon:"🗺", title:"AI itinerary ready", sub:"8 days · 6 stops" },
                { s:{ bottom:"5%", right:"8%" }, bg:"#FEF3C7", icon:"⭐", title:"New review", sub:'"Life-changing trip"' },
              ].map((b,i)=>(
                  <div key={i} style={{ position:"absolute", ...b.s, background:"#fff", border:"1px solid rgba(14,133,178,0.12)", borderRadius:12, padding:"0.65rem 0.9rem", boxShadow:"0 8px 24px rgba(14,133,178,0.10)", display:"flex", alignItems:"center", gap:"0.6rem", fontSize:"0.75rem", fontWeight:700, color:"#0A3D52", whiteSpace:"nowrap", zIndex:20 }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:b.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem" }}>{b.icon}</div>
                    <div><div>{b.title}</div><div style={{ fontSize:"0.65rem", fontWeight:400, color:"#1A6A8A", marginTop:1 }}>{b.sub}</div></div>
                  </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS — deep teal ocean + boat ── */}
        <div id="stats-row" style={{ position:"relative", background:"linear-gradient(135deg,#062B3A 0%,#0A4D66 50%,#0D6E8A 100%)", padding:"2.5rem", overflow:"hidden" }}>
          <OceanBackground/>
          <div style={{ position:"relative", zIndex:2, maxWidth:1200, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(4,1fr)" }}>
            <Stat num={80}  suffix="+"  label="Destinations"   go={statsGo}/>
            <Stat num={200} suffix="+"  label="Curated tours"  go={statsGo}/>
            <Stat num={12}  suffix="K+" label="Happy travelers" go={statsGo}/>
            <Stat num={4.9} suffix="★"  label="Average rating" dec={1} go={statsGo}/>
          </div>
        </div>

        {/* ── DESTINATIONS — bright sky blue + big plane ── */}
        <section id="destinations" style={{ position:"relative", padding:"6rem 2.5rem", background:"#F0FAFE", overflow:"hidden" }}>
          <SkyBackground/>
          <div style={{ position:"relative", zIndex:2, maxWidth:1200, margin:"0 auto" }}>
            <Reveal style={{ marginBottom:"3rem" }}>
              <p style={{ fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.18em", color:"#1E9DC8", textTransform:"uppercase", marginBottom:"0.6rem" }}>Where to go</p>
              <h2 style={{ ...S, fontSize:"clamp(1.9rem,3vw,2.6rem)", fontWeight:600, color:"#0A3D52", marginBottom:"0.85rem" }}>
                Ethiopia's most <em style={{ color:"#1E9DC8" }}>extraordinary</em> places
              </h2>
              <p style={{ fontSize:"0.95rem", fontWeight:300, color:"#1A6A8A", lineHeight:1.7, maxWidth:500 }}>Eight regions, thousands of years of history, and landscapes found nowhere else on earth.</p>
            </Reveal>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1.25rem" }}>
              {DESTINATIONS.map((d,i)=>(
                  <Reveal key={d.name} delay={i*80}>
                    <Link href="/destinations" style={{ display:"block", textDecoration:"none", background:"rgba(255,255,255,0.88)", backdropFilter:"blur(10px)", border:"1px solid rgba(14,133,178,0.12)", borderRadius:16, padding:"1.5rem 1.4rem", position:"relative", overflow:"hidden", transition:"transform 0.3s, box-shadow 0.3s" }}
                          onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.transform="translateY(-6px)"; (e.currentTarget as HTMLElement).style.boxShadow="0 20px 48px rgba(14,133,178,0.14)"; }}
                          onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.transform="none"; (e.currentTarget as HTMLElement).style.boxShadow="none"; }}>
                      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"1rem" }}>
                        <div style={{ width:52, height:52, borderRadius:14, background:"linear-gradient(135deg,#EBF8FF,#D6F0FA)", border:"1px solid rgba(14,133,178,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.5rem" }}>{d.icon}</div>
                        <span style={{ fontSize:"0.65rem", fontWeight:700, letterSpacing:"0.08em", padding:"0.25rem 0.65rem", borderRadius:20, textTransform:"uppercase", background:d.tagBg, color:d.tagColor }}>{d.tag}</span>
                      </div>
                      <div style={{ ...S, fontSize:"1.2rem", fontWeight:600, color:"#0A3D52", marginBottom:"0.25rem" }}>{d.name}</div>
                      <div style={{ fontSize:"0.8rem", color:"#1A6A8A", fontWeight:300, marginBottom:"1.2rem" }}>{d.sub}</div>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", borderTop:"1px solid #EBF8FF", paddingTop:"0.85rem" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"0.35rem", fontSize:"0.75rem", fontWeight:700, color:"#1E9DC8" }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="6" cy="6" r="4.5"/><path d="M6 3.5V6l1.5 1.5"/></svg>
                          {d.days}
                        </div>
                        <div style={{ width:30, height:30, borderRadius:8, background:"#EBF8FF", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#1E9DC8" strokeWidth="2" strokeLinecap="round"><path d="M2 6.5h9M7 3l3.5 3.5L7 10"/></svg>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS — deep ocean + big scuba diver ── */}
        <div id="how" style={{ position:"relative", background:"#E8F6FA", borderTop:"1px solid rgba(14,133,178,0.10)", borderBottom:"1px solid rgba(14,133,178,0.10)", padding:"6rem 2.5rem", overflow:"hidden" }}>
          <UnderwaterBackground/>
          <div style={{ position:"relative", zIndex:2, maxWidth:1200, margin:"0 auto" }}>
            <Reveal style={{ marginBottom:"3rem" }}>
              <p style={{ fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.18em", color:"#1E9DC8", textTransform:"uppercase", marginBottom:"0.6rem" }}>How it works</p>
              <h2 style={{ ...S, fontSize:"clamp(1.9rem,3vw,2.6rem)", fontWeight:600, color:"#0A3D52", marginBottom:"0.85rem" }}>
                Plan your trip in <em style={{ color:"#1E9DC8" }}>four steps</em>
              </h2>
              <p style={{ fontSize:"0.95rem", fontWeight:300, color:"#1A6A8A", lineHeight:1.7, maxWidth:500 }}>From inspiration to confirmation in minutes, not hours.</p>
            </Reveal>
            <div ref={stepsRef} style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:0, position:"relative" }}>
              <div style={{ position:"absolute", top:27, left:"12.5%", right:"12.5%", height:1, background:"rgba(14,133,178,0.15)", overflow:"hidden" }}>
                <div style={{ height:"100%", background:"linear-gradient(90deg,#28B8E8,#0A6A94)", width:stepsVisible?"100%":"0%", transition:"width 1.5s ease" }}/>
              </div>
              {STEPS.map((s,i)=>(
                  <div key={s.n} style={{ textAlign:"center", padding:"0 1rem", position:"relative", zIndex:1, opacity:stepsVisible?1:0, transform:stepsVisible?"translateY(0)":"translateY(24px)", transition:`opacity 0.6s ease ${i*150}ms,transform 0.6s ease ${i*150}ms` }}>
                    <div style={{ width:56, height:56, borderRadius:"50%", margin:"0 auto 1.25rem", background:"linear-gradient(135deg,#28B8E8,#0A6A94)", display:"flex", alignItems:"center", justifyContent:"center", ...S, fontSize:"1.2rem", fontWeight:700, color:"#fff", boxShadow:"0 4px 16px rgba(14,133,178,0.30)" }}>{s.n}</div>
                    <div style={{ ...S, fontSize:"1rem", fontWeight:600, color:"#0A3D52", marginBottom:"0.5rem" }}>{s.title}</div>
                    <div style={{ fontSize:"0.8rem", fontWeight:300, color:"#1A6A8A", lineHeight:1.65 }}>{s.desc}</div>
                  </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FEATURES — warm sunset ocean + yacht + cruiser ── */}
        <section id="features" style={{ position:"relative", padding:"6rem 2.5rem", background:"#FFFBF0", overflow:"hidden" }}>
          <FeatureOceanBackground/>
          <div style={{ position:"relative", zIndex:2, maxWidth:1200, margin:"0 auto" }}>
            <Reveal style={{ marginBottom:"3rem" }}>
              <p style={{ fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.18em", color:"#1E9DC8", textTransform:"uppercase", marginBottom:"0.6rem" }}>Why Tizitaw</p>
              <h2 style={{ ...S, fontSize:"clamp(1.9rem,3vw,2.6rem)", fontWeight:600, color:"#0A3D52", marginBottom:"0.85rem" }}>
                Everything you need to <em style={{ color:"#1E9DC8" }}>travel well</em>
              </h2>
              <p style={{ fontSize:"0.95rem", fontWeight:300, color:"#1A6A8A", lineHeight:1.7, maxWidth:500 }}>Built for Ethiopia, by people who know it. Every feature serves one goal: a trip you'll remember.</p>
            </Reveal>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1.5rem" }}>
              {FEATURES.map((f,i)=>(
                  <Reveal key={f.title} delay={i*70}>
                    <div style={{ background:"rgba(255,255,255,0.88)", backdropFilter:"blur(8px)", border:"1px solid rgba(14,133,178,0.10)", borderRadius:16, padding:"1.75rem" }}>
                      <div style={{ width:52, height:52, borderRadius:14, background:"linear-gradient(135deg,#EBF8FF,#D6F0FA)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.4rem", marginBottom:"1rem" }}>{f.icon}</div>
                      <div style={{ ...S, fontSize:"1.05rem", fontWeight:600, color:"#0A3D52", marginBottom:"0.5rem" }}>{f.title}</div>
                      <div style={{ fontSize:"0.84rem", fontWeight:300, color:"#1A6A8A", lineHeight:1.7 }}>{f.desc}</div>
                    </div>
                  </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA — clean ── */}
        <section style={{ padding:"10rem 2.5rem", textAlign:"center", background:"linear-gradient(160deg,#EBF8FF,#fff,#EBF8FF)", position:"relative", overflow:"hidden" }}>
          {[400,650,900].map(size=>(
              <div key={size} style={{ position:"absolute", width:size, height:size, borderRadius:"50%", border:"1px solid rgba(14,133,178,0.08)", top:"50%", left:"50%", transform:"translate(-50%,-50%)", pointerEvents:"none" }}/>
          ))}
          <Reveal>
            <div style={{ position:"relative", zIndex:2 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(30,157,200,0.08)", border:"1px solid rgba(14,133,178,0.18)", borderRadius:40, padding:"0.35rem 0.9rem", fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.1em", color:"#1E9DC8", textTransform:"uppercase", marginBottom:"1.5rem" }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"#1E9DC8", display:"inline-block" }}/>
                Free to join
              </div>
              <h2 style={{ ...S, fontSize:"clamp(2.2rem,4vw,3.2rem)", fontWeight:700, color:"#0A3D52", letterSpacing:"-0.025em", lineHeight:1.12, marginBottom:"1rem" }}>
                Ready to experience<br/><em style={{ color:"#1E9DC8" }}>Ethiopia</em>?
              </h2>
              <p style={{ fontSize:"1rem", fontWeight:300, color:"#1A6A8A", maxWidth:440, margin:"0 auto 2.5rem", lineHeight:1.7 }}>
                Create a free account and start building your journey today. No fees until you book.
              </p>
              <div style={{ display:"flex", gap:"0.85rem", justifyContent:"center", flexWrap:"wrap" }}>
                <Link href="/auth/signup" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"linear-gradient(135deg,#28B8E8,#0A6A94)", color:"#fff", fontSize:"0.9rem", fontWeight:700, padding:"0.85rem 1.75rem", borderRadius:10, textDecoration:"none", boxShadow:"0 4px 20px rgba(14,133,178,0.38)" }}>
                  Create free account
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 7h10M8 3l4 4-4 4"/></svg>
                </Link>
                <Link href="/tours" style={{ display:"inline-flex", alignItems:"center", color:"#1A6A8A", fontSize:"0.9rem", padding:"0.85rem 1.75rem", borderRadius:10, textDecoration:"none", border:"1.5px solid rgba(14,133,178,0.28)" }}>Browse tours first</Link>
              </div>
            </div>
          </Reveal>
        </section>

        {/* FOOTER */}
        <footer style={{ background:"#0A3D52", padding:"2rem 2.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <a href="/" style={{ ...S, textDecoration:"none", color:"rgba(200,242,255,0.65)", fontSize:"1.1rem", fontWeight:700 }}>Tizitaw <em>Ethiopia</em></a>
          <p style={{ fontSize:"0.72rem", color:"rgba(200,242,255,0.30)", fontWeight:300 }}>© {new Date().getFullYear()} Tizitaw Ethiopia. All rights reserved.</p>
          <div style={{ display:"flex", gap:"1.5rem" }}>
            {["Terms","Privacy","Contact"].map(l=>(
                <a key={l} href={`/${l.toLowerCase()}`} style={{ fontSize:"0.72rem", color:"rgba(200,242,255,0.38)", textDecoration:"none" }}>{l}</a>
            ))}
          </div>
        </footer>
      </div>
  );
}