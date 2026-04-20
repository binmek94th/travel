"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const DESTINATIONS = [
    "Lalibela",
    "Simien Mountains",
    "Danakil Depression",
    "Axum",
    "Omo Valley",
    "Bale Mountains",
    "Blue Nile Falls",
    "Gondar",
];

const TRAVEL_QUOTES = [
    "Not all those who wander are lost — but this page is.",
    "Every wrong turn leads to an unexpected adventure.",
    "The journey matters more than the destination... unless the destination 404s.",
    "Even the best explorers lose their way sometimes.",
];

export default function NotFound() {
    const [quote]   = useState(() => TRAVEL_QUOTES[Math.floor(Math.random() * TRAVEL_QUOTES.length)]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Lato:wght@300;400;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body {
          font-family: 'Lato', system-ui, sans-serif;
          background: #fff;
          color: #0A3D52;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        .sky {
          position: fixed; inset: 0; z-index: 0;
          background: linear-gradient(180deg, #EBF8FF 0%, #ffffff 55%, #F8FCFF 100%);
        }
        .dot-grid {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image: radial-gradient(circle, rgba(14,133,178,0.10) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: grid-drift 25s linear infinite;
        }
        @keyframes grid-drift {
          from { background-position: 0 0; }
          to   { background-position: 40px 40px; }
        }
        .glow-1 {
          position: fixed; top: -200px; right: -200px; z-index: 0;
          width: 700px; height: 700px; border-radius: 50%; pointer-events: none;
          background: radial-gradient(circle, rgba(40,184,232,0.10) 0%, transparent 65%);
          animation: breathe 8s ease-in-out infinite;
        }
        .glow-2 {
          position: fixed; bottom: -200px; left: -200px; z-index: 0;
          width: 600px; height: 600px; border-radius: 50%; pointer-events: none;
          background: radial-gradient(circle, rgba(42,158,216,0.08) 0%, transparent 65%);
          animation: breathe 10s ease-in-out infinite reverse;
        }
        @keyframes breathe {
          0%,100% { transform: scale(1); opacity: 0.7; }
          50%      { transform: scale(1.12); opacity: 1; }
        }

        .compass-wrap { animation: compass-float 5s ease-in-out infinite; }
        @keyframes compass-float {
          0%,100% { transform: translateY(0) rotate(0deg); }
          25%      { transform: translateY(-12px) rotate(3deg); }
          75%      { transform: translateY(-6px) rotate(-2deg); }
        }
        .compass-needle {
          animation: needle-spin 4s ease-in-out infinite;
          transform-origin: 50px 50px;
        }
        @keyframes needle-spin {
          0%,100% { transform: rotate(0deg); }
          30%      { transform: rotate(14deg); }
          60%      { transform: rotate(-10deg); }
          80%      { transform: rotate(6deg); }
        }

        .num-404 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(6rem, 18vw, 12rem);
          font-weight: 700;
          line-height: 1;
          letter-spacing: -0.04em;
          color: transparent;
          background: linear-gradient(135deg, #28B8E8 0%, #0E85B2 50%, #0A6A94 100%);
          -webkit-background-clip: text;
          background-clip: text;
          position: relative;
          display: inline-block;
          opacity: 0;
          animation: rise-in 0.8s 0.1s ease both;
        }

        .reveal { opacity: 0; animation: rise-in 0.7s ease both; }
        .reveal-1 { animation-delay: 0.2s; }
        .reveal-2 { animation-delay: 0.35s; }
        .reveal-3 { animation-delay: 0.5s; }
        .reveal-4 { animation-delay: 0.65s; }
        .reveal-5 { animation-delay: 0.8s; }
        .reveal-6 { animation-delay: 0.95s; }
        @keyframes rise-in {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .path-line {
          stroke-dasharray: 600;
          stroke-dashoffset: 600;
          animation: draw-path 2s 0.6s ease forwards;
        }
        @keyframes draw-path { to { stroke-dashoffset: 0; } }
        .path-dot { opacity: 0; animation: dot-pop 0.4s ease forwards; }
        .path-dot-1 { animation-delay: 1.1s; }
        .path-dot-2 { animation-delay: 1.4s; }
        .path-dot-3 { animation-delay: 1.7s; }
        @keyframes dot-pop {
          from { opacity: 0; transform: scale(0); }
          to   { opacity: 1; transform: scale(1); }
        }

        .chips-track-wrap {
          display: flex; overflow: hidden;
          mask-image: linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%);
        }
        .chips-track {
          display: flex; gap: 0.6rem; width: max-content;
          animation: chips-scroll 24s linear infinite;
        }
        @keyframes chips-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .chip {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: #EBF8FF; border: 1px solid rgba(14,133,178,0.18);
          border-radius: 40px; padding: 0.35rem 0.9rem;
          font-size: 0.75rem; font-weight: 600; color: #1E9DC8;
          white-space: nowrap; flex-shrink: 0; text-decoration: none;
          transition: background 0.15s, border-color 0.15s;
        }
        .chip:hover { background: #D6F0FA; border-color: #1E9DC8; }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: linear-gradient(135deg, #28B8E8, #0A6A94);
          color: #fff; font-size: 0.88rem; font-weight: 700;
          padding: 0.85rem 1.75rem; border-radius: 10px; text-decoration: none;
          box-shadow: 0 4px 20px rgba(14,133,178,0.38);
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .btn-primary:hover { box-shadow: 0 8px 28px rgba(14,133,178,0.5); transform: translateY(-2px); }
        .btn-primary .arr { transition: transform 0.2s; }
        .btn-primary:hover .arr { transform: translateX(4px); }

        .btn-outline {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: transparent; color: #1A6A8A; font-size: 0.88rem; font-weight: 400;
          padding: 0.85rem 1.75rem; border-radius: 10px; text-decoration: none;
          border: 1.5px solid rgba(14,133,178,0.25);
          transition: border-color 0.2s, background 0.2s, transform 0.2s;
        }
        .btn-outline:hover { border-color: #1E9DC8; background: #EBF8FF; transform: translateY(-2px); }

        .divider {
          width: 48px; height: 2px; border-radius: 2px;
          background: linear-gradient(90deg, #28B8E8, #0A6A94);
          margin: 0 auto 1.5rem;
        }

        /* Stamp badge */
        .stamp {
          display: inline-flex; align-items: center; gap: 0.5rem;
          border: 1.5px dashed rgba(14,133,178,0.25);
          border-radius: 40px; padding: 0.45rem 1.1rem;
          font-size: 0.72rem; font-weight: 600; letter-spacing: 0.08em;
          color: rgba(26,106,138,0.6); text-transform: uppercase;
        }
      `}</style>

            <div className="sky" />
            <div className="dot-grid" />
            <div className="glow-1" />
            <div className="glow-2" />

            <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center">

                {/* Floating compass */}
                <div className="compass-wrap mb-6 reveal reveal-1">
                    <svg width="96" height="96" viewBox="0 0 100 100" fill="none">
                        <circle cx="50" cy="50" r="46" stroke="rgba(14,133,178,0.12)" strokeWidth="1.5"/>
                        <circle cx="50" cy="50" r="46" stroke="url(#cGrad)" strokeWidth="1.5"
                                strokeDasharray="6 5" opacity="0.45"/>
                        <circle cx="50" cy="50" r="36" fill="#EBF8FF" stroke="rgba(14,133,178,0.15)" strokeWidth="1"/>
                        <circle cx="50" cy="50" r="26" fill="white" stroke="rgba(14,133,178,0.12)" strokeWidth="0.8"/>
                        {/* Cardinal marks */}
                        {[0,90,180,270].map((deg,i) => (
                            <line key={i}
                                  x1={50 + 29 * Math.sin(deg * Math.PI/180)}
                                  y1={50 - 29 * Math.cos(deg * Math.PI/180)}
                                  x2={50 + 36 * Math.sin(deg * Math.PI/180)}
                                  y2={50 - 36 * Math.cos(deg * Math.PI/180)}
                                  stroke={i===0?"#1E9DC8":"rgba(14,133,178,0.35)"} strokeWidth={i===0?"2":"1.2"}
                                  strokeLinecap="round"/>
                        ))}
                        <text x="50" y="17" textAnchor="middle" fontSize="8.5" fontWeight="700"
                              fill="#1E9DC8" fontFamily="Lato,sans-serif">N</text>
                        <text x="50" y="90" textAnchor="middle" fontSize="7.5" fontWeight="400"
                              fill="rgba(26,106,138,0.5)" fontFamily="Lato,sans-serif">S</text>
                        <text x="89" y="53" textAnchor="middle" fontSize="7.5" fontWeight="400"
                              fill="rgba(26,106,138,0.5)" fontFamily="Lato,sans-serif">E</text>
                        <text x="11" y="53" textAnchor="middle" fontSize="7.5" fontWeight="400"
                              fill="rgba(26,106,138,0.5)" fontFamily="Lato,sans-serif">W</text>
                        {/* Needle */}
                        <g className="compass-needle">
                            <polygon points="50,26 53.5,50 50,57 46.5,50" fill="url(#nGrad)"/>
                            <polygon points="50,74 53.5,50 50,43 46.5,50" fill="#D6F0FA"/>
                        </g>
                        <circle cx="50" cy="50" r="3.5" fill="#1E9DC8"/>
                        <circle cx="50" cy="50" r="1.5" fill="white"/>
                        <defs>
                            <linearGradient id="cGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="#28B8E8"/>
                                <stop offset="100%" stopColor="#0A6A94"/>
                            </linearGradient>
                            <linearGradient id="nGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#28B8E8"/>
                                <stop offset="100%" stopColor="#0A6A94"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                {/* 404 */}
                <div className="num-404">404</div>

                {/* Animated path */}
                <div className="reveal reveal-2 my-1">
                    <svg width="260" height="36" viewBox="0 0 260 36" style={{ overflow: "visible" }}>
                        <path
                            className="path-line"
                            d="M 20 18 C 65 4, 85 32, 130 18 C 175 4, 195 32, 240 18"
                            stroke="rgba(14,133,178,0.22)" strokeWidth="1.5"
                            strokeDasharray="5 5" fill="none"
                        />
                        <circle className="path-dot path-dot-1" cx="20"  cy="18" r="4.5" fill="#28B8E8"/>
                        <circle className="path-dot path-dot-2" cx="130" cy="18" r="4.5" fill="#1E9DC8"/>
                        <circle className="path-dot path-dot-3" cx="240" cy="18" r="4.5" fill="#0A6A94"/>
                    </svg>
                </div>

                {/* Heading */}
                <div className="reveal reveal-3 mb-4">
                    <div className="divider" />
                    <h1
                        className="text-3xl font-semibold text-[#0A3D52] md:text-4xl"
                        style={{ fontFamily: "'Playfair Display', serif", letterSpacing: "-0.02em" }}
                    >
                        This trail leads{" "}
                        <em className="italic text-[#1E9DC8]">nowhere</em>
                    </h1>
                </div>

                {/* Quote */}
                <p className="reveal reveal-4 mb-2 max-w-sm text-base font-light leading-relaxed text-[#1A6A8A]">
                    {quote}
                </p>
                <p className="reveal reveal-4 mb-10 text-sm font-light text-[rgba(26,106,138,0.45)]">
                    The page you're looking for doesn't exist or has been moved.
                </p>

                {/* Actions */}
                <div className="reveal reveal-5 mb-14 flex flex-wrap items-center justify-center gap-3">
                    <Link href="/" className="btn-primary">
                        <svg className="arr" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M1 7h12M7 1l6 6-6 6"/>
                        </svg>
                        Back to home
                    </Link>
                    <Link href="/destinations" className="btn-outline">
                        Explore destinations
                    </Link>
                    <Link href="/tours" className="btn-outline">
                        Browse tours
                    </Link>
                </div>

                {/* Scrolling chips */}
                <div className="reveal reveal-6 w-full max-w-2xl">
                    <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[rgba(14,133,178,0.40)]">
                        Or discover these places
                    </p>
                    <div className="chips-track-wrap">
                        <div className="chips-track">
                            {[...DESTINATIONS, ...DESTINATIONS].map((dest, i) => (
                                <Link key={i} href="/destinations" className="chip">
                                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                        <path d="M6 1C4.34 1 3 2.34 3 4c0 2.54 3 7 3 7s3-4.46 3-7c0-1.66-1.34-3-3-3z"/>
                                        <circle cx="6" cy="4" r="1"/>
                                    </svg>
                                    {dest}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Stamp */}
                <div className="reveal reveal-6 mt-14">
                    <div className="stamp">
            <span
                style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: "#1E9DC8", display: "inline-block", flexShrink: 0,
                }}
            />
                        Tizitaw Ethiopia · The land of origins
                    </div>
                </div>

            </div>
        </>
    );
}