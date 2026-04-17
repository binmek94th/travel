import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tizitaw Ethiopia — Join Us",
  description: "Sign in or create your Tizitaw Ethiopia account.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-root">

      {/* ── LEFT: Sunny sea illustration panel ── */}
      <div className="sea-panel">
        <div className="bg-sky" />
        <div className="sun" />
        <div className="cloud c1" />
        <div className="cloud c2" />
        <div className="cloud c3" />
        <div className="horizon-line" />
        <div className="sun-shimmer" />

        <div className="sea">
          {/* Animated SVG waves */}
          <svg
            style={{ position:"absolute", top:"-2px", width:"200%", height:"60px" }}
            viewBox="0 0 1440 400"
            preserveAspectRatio="none"
          >
            <path fill="rgba(255,255,255,0.18)"
              d="M0,40 C180,80 360,0 540,40 C720,80 900,0 1080,40 C1260,80 1440,0 1440,40 L1440,0 L0,0Z">
              <animate attributeName="d" dur="6s" repeatCount="indefinite" values="
                M0,40 C180,80 360,0 540,40 C720,80 900,0 1080,40 C1260,80 1440,0 1440,40 L1440,0 L0,0Z;
                M0,20 C180,0 360,60 540,20 C720,0 900,60 1080,20 C1260,0 1440,60 1440,20 L1440,0 L0,0Z;
                M0,40 C180,80 360,0 540,40 C720,80 900,0 1080,40 C1260,80 1440,0 1440,40 L1440,0 L0,0Z"/>
            </path>
            <path fill="rgba(255,255,255,0.10)"
              d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,0 L0,0Z">
              <animate attributeName="d" dur="9s" repeatCount="indefinite" values="
                M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,0 L0,0Z;
                M0,50 C240,10 480,70 720,50 C960,10 1200,70 1440,50 L1440,0 L0,0Z;
                M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,0 L0,0Z"/>
            </path>
          </svg>

          {/* Foam lines */}
          {[
            { top:"8%",  width:"70%", left:"5%",  delay:"0s",   dur:"6s",   op:0.70 },
            { top:"20%", width:"55%", left:"15%", delay:"-2s",  dur:"8s",   op:0.50 },
            { top:"35%", width:"65%", left:"8%",  delay:"-4s",  dur:"7s",   op:0.60 },
            { top:"52%", width:"50%", left:"20%", delay:"-1s",  dur:"9s",   op:0.40 },
            { top:"68%", width:"60%", left:"12%", delay:"-3s",  dur:"6.5s", op:0.50 },
            { top:"82%", width:"45%", left:"25%", delay:"-5s",  dur:"7.5s", op:0.35 },
          ].map((f, i) => (
            <div key={i} className="foam-line" style={{
              top: f.top, width: f.width, left: f.left,
              animationDelay: f.delay, animationDuration: f.dur, opacity: f.op,
            }} />
          ))}

          {/* Sparkles */}
          {[
            { top:"15%", left:"30%", delay:"0s"   },
            { top:"28%", left:"55%", delay:".8s"  },
            { top:"18%", left:"72%", delay:"1.4s" },
            { top:"42%", left:"20%", delay:".3s"  },
            { top:"38%", left:"80%", delay:"1.8s" },
            { top:"60%", left:"45%", delay:".6s"  },
            { top:"55%", left:"65%", delay:"2.2s" },
            { top:"72%", left:"35%", delay:"1.1s" },
          ].map((s, i) => (
            <div key={i} className="sparkle" style={{
              top: s.top, left: s.left, animationDelay: s.delay,
            }} />
          ))}
        </div>

        {/* Sandy beach */}
        <svg className="beach" viewBox="0 0 500 120" preserveAspectRatio="xMidYMax slice">
          <path d="M0 120 L0 68 Q60 58 120 65 Q180 55 240 62 Q300 52 360 60 Q420 50 500 58 L500 120Z"
            fill="var(--color-sand-dark)" />
          <path d="M0 120 L0 78 Q80 70 160 76 Q240 68 320 74 Q400 66 500 72 L500 120Z"
            fill="var(--color-sand-mid)" />
          <path d="M0 120 L0 92 Q100 86 200 90 Q300 84 400 88 Q450 86 500 90 L500 120Z"
            fill="var(--color-sand-light)" />
          <path d="M0 72 Q60 65 120 70 Q200 62 280 68 Q360 60 440 66 Q470 64 500 68"
            stroke="rgba(40,184,232,0.5)" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M0 68 Q80 60 160 65 Q240 57 320 63 Q400 56 500 62"
            stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>

        {/* Brand overlay */}
        <div className="sea-brand">
          <div className="brand-logo">
            <span className="logo-name">Tizitaw</span>
            <span className="logo-sub">Ethiopia</span>
          </div>
          <ul className="place-list">
            {[
              "Lake Tana & Blue Nile Falls",
              "Lake Turkana, Jade Sea",
              "Abijatta-Shalla Lakes",
              "Omo River Basin",
            ].map(p => (
              <li key={p} className="place-item">
                <span className="place-dash" />
                {p}
              </li>
            ))}
          </ul>
          <p className="brand-caption">
            "Where the sun pours gold into waters that have sparkled since the dawn of time."
          </p>
        </div>
      </div>

      {/* ── RIGHT: Form panel ── */}
      <div className="form-panel">
        <div className="form-inner">
          {children}
        </div>
      </div>

      <style>{`
        .auth-root {
          display: flex;
          min-height: 100vh;
        }

        /* Sea panel */
        .sea-panel {
          position: relative;
          width: var(--panel-width);
          min-height: 100vh;
          overflow: hidden;
          flex-shrink: 0;
        }

        .bg-sky {
          position: absolute; inset: 0;
          background: linear-gradient(
            180deg,
            var(--color-sky-deep)        0%,
            var(--color-sky-mid)        18%,
            var(--color-sky-light)      38%,
            var(--color-sky-pale)       52%,
            var(--color-sky-horizon)    58%,
            var(--color-sea-gradient-1) 60%,
            var(--color-sea-gradient-2) 70%,
            var(--color-sea-gradient-3) 82%,
            var(--color-sea-gradient-4) 100%
          );
        }

        .sun {
          position: absolute;
          top: 10%; left: 55%;
          width: var(--sun-size);
          height: var(--sun-size);
          border-radius: 50%;
          background: radial-gradient(
            circle at 50% 50%,
            var(--color-sun-core)  0%,
            var(--color-sun-mid)  40%,
            var(--color-sun-outer) 70%,
            transparent           100%
          );
          box-shadow: var(--shadow-sun-idle);
          animation: tz-sun-pulse var(--anim-sun) ease-in-out infinite;
        }

        .cloud {
          position: absolute;
          border-radius: var(--radius-cloud);
          background: var(--color-cloud);
          animation: tz-cloud-float linear infinite;
        }
        .cloud::before, .cloud::after {
          content: '';
          position: absolute;
          background: var(--color-cloud);
          border-radius: 50%;
        }
        .c1 { width:110px; height:32px; top:14%; left:-20%; animation-duration:var(--anim-cloud-1); }
        .c1::before { width:55px; height:42px; top:-20px; left:18px; }
        .c1::after  { width:42px; height:32px; top:-14px; left:55px; }
        .c2 { width:80px; height:24px; top:22%; left:10%; animation-duration:var(--anim-cloud-2); animation-delay:-20s; opacity:.7; }
        .c2::before { width:40px; height:32px; top:-15px; left:14px; }
        .c2::after  { width:32px; height:24px; top:-10px; left:42px; }
        .c3 { width:140px; height:36px; top:8%; left:30%; animation-duration:var(--anim-cloud-3); animation-delay:-40s; opacity:.6; }
        .c3::before { width:65px; height:50px; top:-24px; left:24px; }
        .c3::after  { width:50px; height:38px; top:-18px; left:72px; }

        .horizon-line {
          position: absolute; top: 58%; left: 0; right: 0; height: 2px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,0.6) 20%,
            var(--color-horizon-shimmer) 50%,
            rgba(255,255,255,0.6) 80%,
            transparent
          );
          filter: blur(1px);
        }

        .sun-shimmer {
          position: absolute;
          top: 58%; left: 40%;
          width: var(--shimmer-width);
          height: 42%;
          background: linear-gradient(
            180deg,
            var(--color-shimmer) 0%,
            var(--color-shimmer-fade) 50%,
            transparent 100%
          );
          filter: blur(8px);
          clip-path: polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%);
          animation: tz-shimmer-sway var(--anim-shimmer) ease-in-out infinite;
        }

        .sea {
          position: absolute;
          top: 59%; left: 0; right: 0; bottom: 0;
          overflow: hidden;
          background: linear-gradient(
            180deg,
            var(--color-sea-bright)  0%,
            var(--color-water-1)     8%,
            var(--color-water-2)    18%,
            var(--color-water-3)    32%,
            var(--color-water-4)    50%,
            var(--color-water-5)    70%,
            var(--color-sea-dark)  100%
          );
        }

        .foam-line {
          position: absolute;
          height: 4px;
          border-radius: var(--radius-foam);
          background: var(--color-foam-line);
          filter: blur(2px);
          animation: tz-foam-drift ease-in-out infinite;
        }

        .sparkle {
          position: absolute;
          width: var(--sparkle-size);
          height: var(--sparkle-size);
          border-radius: 50%;
          background: var(--color-sparkle);
          animation: tz-sparkle var(--anim-sparkle) ease-in-out infinite;
        }

        .beach {
          position: absolute;
          bottom: 0; left: 0;
          width: 100%; height: 22%;
          z-index: var(--z-beach);
        }

        .sea-brand {
          position: absolute; inset: 0;
          z-index: var(--z-brand);
          display: flex; flex-direction: column; justify-content: flex-end;
          padding: var(--space-24);
          background: linear-gradient(
            to top,
            var(--color-overlay-start)  0%,
            var(--color-overlay-end)   30%,
            transparent                55%
          );
        }

        .brand-logo { display: flex; flex-direction: column; gap: 4px; }

        .logo-name {
          font-family: var(--font-display);
          font-size: var(--text-2xl);
          font-weight: var(--weight-normal);
          color: var(--color-brand-title);
          letter-spacing: var(--tracking-tight);
          text-shadow: 0 2px 12px rgba(0,0,0,0.2);
        }

        .logo-sub {
          font-family: var(--font-body);
          font-size: var(--text-lg);
          font-weight: var(--weight-light);
          color: var(--color-brand-sub);
          letter-spacing: var(--tracking-widest);
          text-transform: uppercase;
        }

        .place-list {
          list-style: none;
          margin-top: var(--space-10);
          display: flex; flex-direction: column;
          gap: var(--space-3);
        }

        .place-item {
          display: flex; align-items: center;
          gap: var(--space-4);
          font-size: var(--text-base);
          color: var(--color-brand-place);
          font-weight: var(--weight-light);
          letter-spacing: var(--tracking-wide);
        }

        .place-dash {
          width: 16px; height: 1px;
          background: var(--color-brand-dash);
          flex-shrink: 0;
        }

        .brand-caption {
          margin-top: var(--space-10);
          font-family: var(--font-display);
          font-style: italic;
          font-size: 0.88rem;
          color: var(--color-brand-caption);
          line-height: 1.7;
          border-top: 1px solid var(--color-brand-divider);
          padding-top: 1.1rem;
        }

        /* Form panel */
        .form-panel {
          flex: 1;
          display: flex; align-items: center; justify-content: center;
          padding: var(--space-16) 1.5rem;
          background: linear-gradient(
            160deg,
            var(--color-form-bg-1)  0%,
            var(--color-form-bg-2) 50%,
            var(--color-form-bg-3) 100%
          );
          position: relative; overflow: hidden;
        }

        .form-panel::before {
          content: '';
          position: absolute; bottom: -80px; left: -80px;
          width: 340px; height: 340px; border-radius: 50%;
          background: var(--color-form-bubble-1);
          pointer-events: none;
        }
        .form-panel::after {
          content: '';
          position: absolute; top: -60px; right: -60px;
          width: 260px; height: 260px; border-radius: 50%;
          background: var(--color-form-bubble-2);
          pointer-events: none;
        }

        .form-inner {
          position: relative;
          z-index: var(--z-form);
          width: 100%;
          max-width: var(--form-max-width);
          animation: tz-rise var(--anim-rise) var(--transition-spring) both;
        }

        @media (max-width: 768px) {
          .sea-panel { display: none; }
          .form-panel {
            background: linear-gradient(
              160deg,
              var(--color-form-bg-1) 0%,
              var(--color-form-bg-3) 100%
            );
            padding: 2.5rem 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}
