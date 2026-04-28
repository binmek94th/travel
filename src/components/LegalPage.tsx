// src/components/LegalPage.tsx
import Link from "next/link";

type Section = { heading: string; content: string };

type Props = {
    title: string;
    subtitle: string;
    sections: Section[];
};

function parseContent(text: string) {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        if (line.trim() === "") { i++; continue; }

        // Bullet list
        if (line.startsWith("• ")) {
            const items: string[] = [];
            while (i < lines.length && lines[i].startsWith("• ")) {
                items.push(lines[i].slice(2));
                i++;
            }
            elements.push(
                <ul key={`ul-${i}`} style={{ margin:"0.5rem 0 0.75rem", padding:0, display:"flex", flexDirection:"column", gap:4 }}>
                    {items.map((item, j) => (
                        <li key={j} style={{ display:"flex", gap:10, alignItems:"flex-start", fontSize:"0.9rem", color:"#1A6A8A", lineHeight:1.7, listStyleType:"none" }}>
                            <span style={{ color:"#1E9DC8", flexShrink:0, marginTop:4, fontSize:"0.55rem" }}>●</span>
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            );
            continue;
        }

        // Normal paragraph
        elements.push(
            <p key={i} style={{ margin:"0 0 0.6rem", fontSize:"0.9rem", color:"#1A6A8A", lineHeight:1.75 }}>
                {line}
            </p>
        );
        i++;
    }

    return elements;
}

export default function LegalPage({ title, subtitle, sections }: Props) {
    const links = [
        { label: "Terms of Service", href: "/terms"   },
        { label: "Privacy Policy",   href: "/privacy"  },
        { label: "Cookie Policy",    href: "/cookies"  },
    ];

    return (
        <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#F0F9FF 0%,#fff 40%,#F0F9FF 100%)", paddingTop:64 }}>

            {/* ── HERO ── */}
            <div style={{ position:"relative", overflow:"hidden", borderBottom:"1px solid rgba(14,133,178,0.08)", padding:"4rem 2rem 3rem" }}>
                {/* BG orbs */}
                {[{l:"5%",t:"30%",s:320},{l:"88%",t:"10%",s:380},{l:"50%",t:"80%",s:240}].map((o,i)=>(
                    <div key={i} style={{ position:"absolute", left:o.l, top:o.t, width:o.s, height:o.s, borderRadius:"50%", background:"radial-gradient(circle,rgba(40,184,232,0.08) 0%,transparent 70%)", transform:"translate(-50%,-50%)", pointerEvents:"none" }}/>
                ))}
                <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle,rgba(14,133,178,0.08) 1px,transparent 1px)", backgroundSize:"30px 30px", WebkitMaskImage:"radial-gradient(ellipse 80% 100% at 50% 0%,black 20%,transparent 100%)", maskImage:"radial-gradient(ellipse 80% 100% at 50% 0%,black 20%,transparent 100%)", pointerEvents:"none" }}/>

                <div style={{ position:"relative", maxWidth:760, margin:"0 auto" }}>
                    <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#EBF8FF", border:"1px solid rgba(14,133,178,0.18)", borderRadius:20, padding:"0.3rem 0.8rem", fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.14em", color:"#1E9DC8", textTransform:"uppercase", marginBottom:"1rem" }}>
                        ⚖️ Legal
                    </div>
                    <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(2rem,4vw,3rem)", fontWeight:700, color:"#0A3D52", letterSpacing:"-0.025em", marginBottom:"0.5rem", lineHeight:1.15 }}>
                        {title}
                    </h1>
                    <p style={{ fontSize:"0.83rem", color:"#1A6A8A", fontWeight:300 }}>{subtitle}</p>
                </div>
            </div>

            {/* ── BODY ── */}
            <div style={{ maxWidth:1100, margin:"0 auto", padding:"3rem 2rem", display:"grid", gridTemplateColumns:"1fr 240px", gap:"3rem", alignItems:"start" }}>

                {/* ── CONTENT ── */}
                <article>
                    {sections.map((section, i) => (
                        <div key={i} style={{ marginBottom:"2.5rem", paddingBottom:"2.5rem", borderBottom: i < sections.length - 1 ? "1px solid rgba(14,133,178,0.08)" : "none" }}>
                            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.1rem", fontWeight:700, color:"#0A3D52", marginBottom:"0.85rem", lineHeight:1.3 }}>
                                {section.heading}
                            </h2>
                            <div>{parseContent(section.content)}</div>
                        </div>
                    ))}

                    {/* Footer note */}
                    <div style={{ marginTop:"3rem", padding:"1.25rem 1.5rem", borderRadius:16, background:"linear-gradient(135deg,#EBF8FF,#D6F0FA)", border:"1px solid rgba(14,133,178,0.14)" }}>
                        <p style={{ fontSize:"0.83rem", color:"#1A6A8A", lineHeight:1.7, margin:0 }}>
                            If you have any questions about these policies, please{" "}
                            <a href="mailto:legal@tizitawethiopia.com" style={{ color:"#1E9DC8", fontWeight:600, textDecoration:"none" }}>
                                contact our team
                            </a>
                            . We're happy to help clarify anything.
                        </p>
                    </div>
                </article>

                {/* ── SIDEBAR ── */}
                <aside style={{ position:"sticky", top:88, display:"flex", flexDirection:"column", gap:"1rem" }}>

                    {/* Navigation */}
                    <div style={{ borderRadius:16, border:"1px solid rgba(14,133,178,0.12)", background:"white", overflow:"hidden", boxShadow:"0 4px_20px rgba(14,133,178,0.07)" }}>
                        <div style={{ padding:"0.9rem 1.1rem", borderBottom:"1px solid rgba(14,133,178,0.08)", background:"rgba(14,133,178,0.03)" }}>
                            <p style={{ fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#1A6A8A", margin:0 }}>Legal documents</p>
                        </div>
                        <div style={{ padding:"0.4rem 0" }}>
                            {links.map(link => (
                                <Link key={link.href} href={link.href}
                                      style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.6rem 1.1rem", textDecoration:"none", fontSize:"0.83rem", color: link.label === title ? "#0A3D52" : "#1A6A8A", fontWeight: link.label === title ? 700 : 400, background: link.label === title ? "rgba(14,133,178,0.06)" : "transparent", borderLeft: link.label === title ? "3px solid #1E9DC8" : "3px solid transparent", transition:"all 0.15s" }}>
                                    {link.label}
                                    {link.label === title && (
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#1E9DC8" strokeWidth="2" strokeLinecap="round">
                                            <path d="M2 6l3 3 5-5"/>
                                        </svg>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Quick links */}
                    <div style={{ borderRadius:16, border:"1px solid rgba(14,133,178,0.12)", background:"white", padding:"1.1rem", boxShadow:"0 4px 20px rgba(14,133,178,0.07)" }}>
                        <p style={{ fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#1A6A8A", marginBottom:"0.75rem" }}>Quick links</p>
                        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                            {[
                                { label:"Contact us",     href:"/contact"  },
                                { label:"Help center",    href:"/help"     },
                                { label:"Destinations",   href:"/destinations" },
                                { label:"Browse tours",   href:"/tours"    },
                            ].map(link => (
                                <Link key={link.href} href={link.href}
                                      style={{ display:"flex", alignItems:"center", gap:6, fontSize:"0.8rem", color:"#1A6A8A", textDecoration:"none", padding:"0.35rem 0", borderBottom:"1px solid rgba(14,133,178,0.06)", transition:"color 0.15s" }}>
                                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#1E9DC8" strokeWidth="2" strokeLinecap="round">
                                        <path d="M2 6h8M6 2l4 4-4 4"/>
                                    </svg>
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Contact card */}
                    <div style={{ borderRadius:16, background:"linear-gradient(135deg,#0A3D52,#0E85B2)", padding:"1.25rem", color:"white" }}>
                        <p style={{ fontSize:"0.8rem", fontWeight:700, marginBottom:"0.4rem", fontFamily:"'Playfair Display',serif" }}>Need help?</p>
                        <p style={{ fontSize:"0.75rem", color:"rgba(235,248,255,0.75)", lineHeight:1.6, marginBottom:"0.85rem" }}>
                            Our team is happy to answer questions about our policies.
                        </p>
                        <a href="mailto:legal@tizitawethiopia.com"
                           style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.22)", borderRadius:10, padding:"0.55rem 0.85rem", fontSize:"0.75rem", fontWeight:600, color:"white", textDecoration:"none", transition:"background 0.15s" }}>
                            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                <rect x="1" y="3" width="12" height="9" rx="2"/><path d="M1 5l6 4 6-4"/>
                            </svg>
                            Email us
                        </a>
                    </div>
                </aside>
            </div>

            {/* ── FOOTER BAR ── */}
            <div style={{ borderTop:"1px solid rgba(14,133,178,0.08)", background:"#F8FCFF", padding:"1.5rem 2rem" }}>
                <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem" }}>
                    <p style={{ fontSize:"0.78rem", color:"#1A6A8A", margin:0 }}>
                        © {new Date().getFullYear()} Tizitaw Ethiopia. All rights reserved.
                    </p>
                    <div style={{ display:"flex", gap:"1.5rem" }}>
                        {links.map(l => (
                            <Link key={l.href} href={l.href} style={{ fontSize:"0.78rem", color:"#1A6A8A", textDecoration:"none", fontWeight: l.label === title ? 700 : 400 }}>
                                {l.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
        @media (max-width: 768px) {
          article, aside { grid-column: 1 / -1 !important; }
        }
      `}</style>
        </div>
    );
}