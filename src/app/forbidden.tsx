// src/app/forbidden.tsx  — Next.js renders this for 403 responses
"use client";

import Link from "next/link";
import { useState } from "react";

const MESSAGES = [
    "This territory requires special clearance.",
    "Your visa doesn't cover this region.",
    "Some paths are only for those with the right permissions.",
    "This camp is restricted to authorized travelers only.",
];

export default function Forbidden() {
    const [message] = useState(
        () => MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
    );

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Lato:wght@300;400;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body {
          font-family: 'Lato', system-ui, sans-serif;
          background: #fff; color: #0A3D52;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        /* ── Background ── */
        .sky {
          position: fixed; inset: 0; z-index: 0;
          background: linear-gradient(160deg, #FEF3C7 0%, #ffffff 45%, #EBF8FF 100%);
        }
        .dot-grid {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image: radial-gradient(circle, rgba(14,133,178,0.08) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: grid-drift 30s linear infinite;
        }
        @keyframes grid-drift {
          from { background-position: 0 0; }
          to   { background-position: 40px 40px; }
        }
        .glow-amber {
          position: fixed; top: -150px; right: -150px; z-index: 0;
          width: 600px; height: 600px; border-radius: 50%; pointer-events: none;
          background: radial-gradient(circle, rgba(245,158,11,0.10) 0%, transparent 65%);
          animation: breathe 9s ease-in-out infinite;
        }
        .glow-blue {
          position: fixed; bottom: -150px; left: -150px; z-index: 0;
          width: 500px; height: 500px; border-radius: 50%; pointer-events: none;
          background: radial-gradient(circle, rgba(40,184,232,0.08) 0%, transparent 65%);
          animation: breathe 11s ease-in-out infinite reverse;
        }
        @keyframes breathe {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.10); }
        }

        /* ── Gate icon ── */
        .gate-wrap { animation: gate-sway 6s ease-in-out infinite; }
        @keyframes gate-sway {
          0%,100% { transform: translateY(0) rotate(0deg); }
          40%      { transform: translateY(-8px) rotate(1.5deg); }
          70%      { transform: translateY(-4px) rotate(-1deg); }
        }
        .gate-lock {
          animation: lock-pulse 3s ease-in-out infinite;
          transform-origin: 50% 50%;
        }
        @keyframes lock-pulse {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.08); }
        }
        .gate-bar-l { animation: bar-shake 0.5s 1.2s ease both; }
        .gate-bar-r { animation: bar-shake 0.5s 1.4s ease both; }
        @keyframes bar-shake {
          0%   { transform: translateX(0); }
          20%  { transform: translateX(-3px); }
          40%  { transform: translateX(3px); }
          60%  { transform: translateX(-2px); }
          80%  { transform: translateX(2px); }
          100% { transform: translateX(0); }
        }

        /* ── 403 number ── */
        .num-403 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(6rem, 18vw, 12rem);
          font-weight: 700; line-height: 1; letter-spacing: -0.04em;
          color: transparent;
          background: linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #92400E 100%);
          -webkit-background-clip: text; background-clip: text;
          opacity: 0; animation: rise-in 0.8s 0.1s ease both;
        }

        /* ── Warning stripe ── */
        .stripe {
          height: 6px; width: 100%; max-width: 320px;
          background: repeating-linear-gradient(
            -45deg,
            #F59E0B 0px, #F59E0B 10px,
            rgba(245,158,11,0.15) 10px, rgba(245,158,11,0.15) 20px
          );
          border-radius: 4px;
          animation: stripe-slide 2s linear infinite;
          background-size: 28px 28px;
        }
        @keyframes stripe-slide {
          from { background-position: 0 0; }
          to   { background-position: 28px 0; }
        }

        /* ── Staggered reveals ── */
        .reveal { opacity: 0; animation: rise-in 0.7s ease both; }
        .r1 { animation-delay: 0.2s; }
        .r2 { animation-delay: 0.35s; }
        .r3 { animation-delay: 0.5s; }
        .r4 { animation-delay: 0.65s; }
        .r5 { animation-delay: 0.8s; }
        .r6 { animation-delay: 0.95s; }
        @keyframes rise-in {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Divider ── */
        .divider {
          width: 48px; height: 2px; border-radius: 2px;
          background: linear-gradient(90deg, #F59E0B, #D97706);
          margin: 0 auto 1.5rem;
        }

        /* ── Buttons ── */
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
          background: transparent; color: #1A6A8A; font-size: 0.88rem;
          padding: 0.85rem 1.75rem; border-radius: 10px; text-decoration: none;
          border: 1.5px solid rgba(14,133,178,0.25);
          transition: border-color 0.2s, background 0.2s, transform 0.2s;
        }
        .btn-outline:hover { border-color: #1E9DC8; background: #EBF8FF; transform: translateY(-2px); }

        /* ── Permission badges ── */
        .badge-row { display: flex; gap: 0.6rem; flex-wrap: wrap; justify-content: center; }
        .badge {
          display: inline-flex; align-items: center; gap: 0.4rem;
          border-radius: 8px; padding: 0.45rem 0.85rem;
          font-size: 0.75rem; font-weight: 600;
        }
        .badge-red   { background: #FEE2E2; color: #991B1B; }
        .badge-amber { background: #FEF3C7; color: #92400E; }
        .badge-blue  { background: #EBF8FF; color: #1E40AF; }

        /* ── Stamp ── */
        .stamp {
          display: inline-flex; align-items: center; gap: 0.5rem;
          border: 1.5px dashed rgba(14,133,178,0.22);
          border-radius: 40px; padding: 0.45rem 1.1rem;
          font-size: 0.68rem; font-weight: 600; letter-spacing: 0.1em;
          color: rgba(26,106,138,0.5); text-transform: uppercase;
        }
      `}</style>

            <div className="sky" />
            <div className="dot-grid" />
            <div className="glow-amber" />
            <div className="glow-blue" />

            <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center">

                {/* Gate / lock icon */}
                <div className="gate-wrap mb-6 reveal r1">
                    <svg width="96" height="96" viewBox="0 0 100 100" fill="none">
                        {/* Outer ring */}
                        <circle cx="50" cy="50" r="46" stroke="rgba(245,158,11,0.15)" strokeWidth="1.5"/>
                        <circle cx="50" cy="50" r="46" stroke="url(#gGrad)"
                                strokeWidth="1.5" strokeDasharray="6 5" opacity="0.4"/>
                        {/* Background */}
                        <circle cx="50" cy="50" r="36" fill="#FFFBEB" stroke="rgba(245,158,11,0.20)" strokeWidth="1"/>
                        <circle cx="50" cy="50" r="26" fill="white" stroke="rgba(245,158,11,0.12)" strokeWidth="0.8"/>
                        {/* Gate bars */}
                        <g className="gate-bar-l">
                            <rect x="29" y="38" width="5" height="24" rx="2.5" fill="url(#barGrad)" opacity="0.8"/>
                        </g>
                        <g className="gate-bar-r">
                            <rect x="66" y="38" width="5" height="24" rx="2.5" fill="url(#barGrad)" opacity="0.8"/>
                        </g>
                        {/* Cross bars */}
                        <rect x="27" y="42" width="46" height="3" rx="1.5" fill="rgba(245,158,11,0.30)"/>
                        <rect x="27" y="55" width="46" height="3" rx="1.5" fill="rgba(245,158,11,0.20)"/>
                        {/* Lock */}
                        <g className="gate-lock">
                            <rect x="40" y="48" width="20" height="16" rx="3" fill="url(#gGrad)"/>
                            <path d="M44 48v-4a6 6 0 0 1 12 0v4" stroke="url(#gGrad)" strokeWidth="3" strokeLinecap="round" fill="none"/>
                            <circle cx="50" cy="56" r="2.5" fill="white"/>
                            <rect x="49" y="57" width="2" height="4" rx="1" fill="white"/>
                        </g>
                        <defs>
                            <linearGradient id="gGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="#F59E0B"/>
                                <stop offset="100%" stopColor="#D97706"/>
                            </linearGradient>
                            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#F59E0B"/>
                                <stop offset="100%" stopColor="#92400E"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                {/* 403 */}
                <div className="num-403">403</div>

                {/* Warning stripe */}
                <div className="reveal r2 my-3 w-full flex justify-center">
                    <div className="stripe" />
                </div>

                {/* Heading */}
                <div className="reveal r3 mb-4">
                    <div className="divider" />
                    <h1
                        className="text-3xl font-semibold text-[#0A3D52] md:text-4xl"
                        style={{ fontFamily: "'Playfair Display', serif", letterSpacing: "-0.02em" }}
                    >
                        Access <em className="italic text-amber-500">restricted</em>
                    </h1>
                </div>

                {/* Message */}
                <p className="reveal r4 mb-2 max-w-sm text-base font-light leading-relaxed text-[#1A6A8A]">
                    {message}
                </p>
                <p className="reveal r4 mb-8 text-sm font-light text-[rgba(26,106,138,0.45)]">
                    You don't have permission to access this area.
                    Please sign in or contact support.
                </p>

                {/* Permission badges */}
                <div className="reveal r5 badge-row mb-10">
          <span className="badge badge-red">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="6" cy="6" r="5"/><path d="M6 4v3M6 8.5h.01"/>
            </svg>
            Access denied
          </span>
                    <span className="badge badge-amber">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 1l1.5 3.5H11l-2.8 2 1.1 3.5L6 8l-3.3 2 1.1-3.5L1 5h3.5z"/>
            </svg>
            Clearance required
          </span>
                    <span className="badge badge-blue">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="2" y="5" width="8" height="6" rx="1.5"/>
              <path d="M4 5V3.5a2 2 0 0 1 4 0V5"/>
            </svg>
            Sign in to continue
          </span>
                </div>

                {/* Actions */}
                <div className="reveal r5 flex flex-wrap items-center justify-center gap-3 mb-14">
                    <Link href="/auth/login" className="btn-primary">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <rect x="1" y="2" width="8" height="10" rx="1.5"/>
                            <path d="M9 5l4 2-4 2M5 7h8"/>
                        </svg>
                        Sign in
                    </Link>
                    <Link href="/public" className="btn-outline">
                        <svg className="arr" width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M1 7h12M7 1l6 6-6 6"/>
                        </svg>
                        Back to home
                    </Link>
                    <Link href="/destinations" className="btn-outline">
                        Explore destinations
                    </Link>
                </div>

                {/* Stamp */}
                <div className="reveal r6">
                    <div className="stamp">
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B", display: "inline-block", flexShrink: 0 }} />
                        Tizitaw Ethiopia · Authorized access only
                    </div>
                </div>

            </div>
        </>
    );
}