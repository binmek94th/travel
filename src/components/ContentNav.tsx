"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/src/lib/firebase";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { useNotifications } from "@/src/hooks/useNotifications";
import { NotificationBell } from "@/src/components/notifications/NotificationBell";

type NavLink = { label: string; href: string };

const NAV_CONFIG: Record<string, { label: string; color: string; links: NavLink[] }> = {
    "/destinations": {
        label: "Destinations", color: "#0A6A94",
        links: [
            { label: "Tours",      href: "/tours"      },
            { label: "Routes",     href: "/routes"     },
            { label: "Guides",     href: "/guides"     },
            { label: "Events",     href: "/events"     },
            { label: "Community",  href: "/community"  },
        ],
    },
    "/events": {
        label: "Events", color: "#94230a",
        links: [
            { label: "Destinations", href: "/destinations" },
            { label: "Tours",        href: "/tours"        },
            { label: "Guides",     href: "/guides"     },
            { label: "Routes",       href: "/routes"       },
            { label: "Community",    href: "/community"    },
        ],
    },
    "/tours": {
        label: "Tours", color: "#065F46",
        links: [
            { label: "Destinations", href: "/destinations" },
            { label: "Guides",     href: "/guides"     },
            { label: "Routes",       href: "/routes"       },
            { label: "Events",       href: "/events"       },
            { label: "Community",    href: "/community"    },
        ],
    },
    "/routes": {
        label: "Routes", color: "#c87c1b",
        links: [
            { label: "Destinations", href: "/destinations" },
            { label: "Tours",        href: "/tours"        },
            { label: "Guides",     href: "/guides"     },
            { label: "Events",       href: "/events"       },
            { label: "Community",    href: "/community"    },
        ],
    },
    "/guides": {
        label: "Guides", color: "#c87c1b",
        links: [
            { label: "Destinations", href: "/destinations" },
            { label: "Tours",        href: "/tours"        },
            { label: "Guides",     href: "/guides"     },
            { label: "Events",       href: "/events"       },
            { label: "Community",    href: "/community"    },
        ],
    },
    "/saved": {
        label: "Saved", color: "#7C3AED",
        links: [
            { label: "Destinations", href: "/destinations" },
            { label: "Tours",        href: "/tours"        },
            { label: "Guides",     href: "/guides"     },
            { label: "Routes",       href: "/routes"       },
            { label: "Events",       href: "/events"       },
            { label: "Community",    href: "/community"    },
        ],
    },
    "/bookings": {
        label: "Bookings", color: "#0A6A94",
        links: [
            { label: "Destinations", href: "/destinations" },
            { label: "Tours",        href: "/tours"        },
            { label: "Guides",     href: "/guides"     },
            { label: "Routes",       href: "/routes"       },
            { label: "Events",       href: "/events"       },
            { label: "Community",    href: "/community"    },
        ],
    },
    "/settings": {
        label: "Settings", color: "#0A6A94",
        links: [
            { label: "Destinations", href: "/destinations" },
            { label: "Tours",        href: "/tours"        },
            { label: "Guides",     href: "/guides"     },
            { label: "Routes",       href: "/routes"       },
            { label: "Events",       href: "/events"       },
            { label: "Community",    href: "/community"    },
        ],
    },
    "/profile": {
        label: "Profile", color: "#0A6A94",
        links: [
            { label: "Destinations", href: "/destinations" },
            { label: "Tours",        href: "/tours"        },
            { label: "Guides",     href: "/guides"     },
            { label: "Routes",       href: "/routes"       },
            { label: "Events",       href: "/events"       },
            { label: "Community",    href: "/community"    },
        ],
    },
    "/community": {
        label: "Community", color: "#0a9436",
        links: [
            { label: "Destinations", href: "/destinations" },
            { label: "Tours",        href: "/tours"        },
            { label: "Guides",     href: "/guides"     },
            { label: "Routes",       href: "/routes"       },
            { label: "Events",       href: "/events"       },
        ],
    },
    "/terms": {
        label: "Terms", color: "#0A6A94",
        links: [
            { label: "Destinations", href: "/destinations" },
            { label: "Tours",        href: "/tours"        },
            { label: "Guides",     href: "/guides"     },
            { label: "Routes",       href: "/routes"       },
            { label: "Events",       href: "/events"       },
            { label: "Community",    href: "/community"    },
        ],
    },
    "/cookies": {
        label: "Cookies", color: "#0A6A94",
        links: [
            { label: "Destinations", href: "/destinations" },
            { label: "Tours",        href: "/tours"        },
            { label: "Guides",     href: "/guides"     },
            { label: "Routes",       href: "/routes"       },
            { label: "Events",       href: "/events"       },
            { label: "Community",    href: "/community"    },
        ],
    },
    "/privacy": {
        label: "Privacy", color: "#0a9436",
        links: [
            { label: "Destinations", href: "/destinations" },
            { label: "Tours",        href: "/tours"        },
            { label: "Guides",     href: "/guides"     },
            { label: "Routes",       href: "/routes"       },
            { label: "Events",       href: "/events"       },
        ],
    },
    "/cancellation": {
        label: "Cancellation", color: "#0a9436",
        links: [
            { label: "Destinations", href: "/destinations" },
            { label: "Tours",        href: "/tours"        },
            { label: "Guides",     href: "/guides"     },
            { label: "Routes",       href: "/routes"       },
            { label: "Events",       href: "/events"       },
        ],
    },
    "/contact": {
        label: "Contact", color: "#0a9436",
        links: [
            { label: "Destinations", href: "/destinations" },
            { label: "Tours",        href: "/tours"        },
            { label: "Guides",     href: "/guides"     },
            { label: "Routes",       href: "/routes"       },
            { label: "Events",       href: "/events"       },
        ],
    },
};

function getConfig(pathname: string) {
    const key = Object.keys(NAV_CONFIG).find(k => pathname.startsWith(k));
    return key ? NAV_CONFIG[key] : NAV_CONFIG["/destinations"];
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, photoURL }: { name: string; photoURL?: string | null }) {
    const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    if (photoURL) {
        return <img src={photoURL} alt={name} style={{ width:34, height:34, borderRadius:"50%", objectFit:"cover", border:"2px solid rgba(14,133,178,0.25)" }}/>;
    }
    return (
        <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#28B8E8,#0A6A94)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.72rem", fontWeight:700, color:"#fff", border:"2px solid rgba(14,133,178,0.25)", flexShrink:0 }}>
            {initials}
        </div>
    );
}

// ── User dropdown ─────────────────────────────────────────────────────────────
function UserDropdown({ user, onClose }: { user: User; onClose: () => void }) {
    const router = useRouter();
    const ref    = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fn = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
        document.addEventListener("mousedown", fn);
        return () => document.removeEventListener("mousedown", fn);
    }, [onClose]);

    async function handleSignOut() {
        await signOut(auth);
        await fetch("/api/auth/session", { method: "DELETE" });
        router.push("/");
    }

    const name  = user.displayName ?? user.email ?? "Traveler";
    const email = user.email ?? "";

    const items = [
        { Icon: ProfileIcon,  label: "Profile",     href: "/profile"   },
        { Icon: SavedIcon,    label: "Saved",        href: "/saved"     },
        { Icon: BookingIcon,  label: "My bookings",  href: "/bookings"  },
        { Icon: SettingsIcon, label: "Settings",     href: "/settings"  },
    ];

    return (
        <div ref={ref} style={{ position:"absolute", top:"calc(100% + 10px)", right:0, width:240, background:"#fff", border:"1px solid rgba(14,133,178,0.12)", borderRadius:14, boxShadow:"0 16px 48px rgba(14,133,178,0.16), 0 4px 12px rgba(14,133,178,0.08)", overflow:"hidden", zIndex:200, animation:"dropdown-pop 0.18s cubic-bezier(0.22,1,0.36,1) both" }}>
            <style>{`@keyframes dropdown-pop{from{opacity:0;transform:translateY(-8px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>

            <div style={{ padding:"1rem 1rem 0.75rem", borderBottom:"1px solid rgba(14,133,178,0.08)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"0.65rem" }}>
                    <Avatar name={name} photoURL={user.photoURL}/>
                    <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:"0.83rem", fontWeight:700, color:"#0A3D52", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{name}</div>
                        <div style={{ fontSize:"0.7rem", color:"#1A6A8A", fontWeight:300, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{email}</div>
                    </div>
                </div>
            </div>

            <div style={{ padding:"0.4rem 0" }}>
                {items.map(({ Icon, label, href }) => (
                    <Link key={label} href={href} onClick={onClose}
                          style={{ display:"flex", alignItems:"center", gap:"0.65rem", padding:"0.6rem 1rem", textDecoration:"none", color:"#1A6A8A", fontSize:"0.83rem", transition:"background 0.12s, color 0.12s" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#F0F9FF"; (e.currentTarget as HTMLElement).style.color = "#0A3D52"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#1A6A8A"; }}>
                        <Icon/>{label}
                    </Link>
                ))}
            </div>

            <div style={{ borderTop:"1px solid rgba(14,133,178,0.08)", padding:"0.4rem 0" }}>
                <button onClick={handleSignOut}
                        style={{ display:"flex", alignItems:"center", gap:"0.65rem", width:"100%", padding:"0.6rem 1rem", background:"none", border:"none", color:"#E05252", fontSize:"0.83rem", cursor:"pointer", transition:"background 0.12s" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#FEF2F2"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                    <SignOutIcon/>Sign out
                </button>
            </div>
        </div>
    );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function ProfileIcon()  { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="5.5" r="2.5"/><path d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/></svg>; }
function SavedIcon()    { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 13.5S1.5 9.5 1.5 5.5a3.5 3.5 0 0 1 6.5-1.8A3.5 3.5 0 0 1 14.5 5.5c0 4-6.5 8-6.5 8z"/></svg>; }
function BookingIcon()  { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="3" width="12" height="11" rx="2"/><path d="M5 3V1.5M11 3V1.5M2 7h12M5 10h2M9 10h2M5 12.5h2"/></svg>; }
function SettingsIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/></svg>; }
function SignOutIcon()  { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/><path d="M10 11l4-3-4-3M14 8H6"/></svg>; }

// ── Main Navbar ───────────────────────────────────────────────────────────────
export default function ContentNav() {
    const pathname = usePathname();
    const [user,     setUser]     = useState<User | null>(null);
    const [loading,  setLoading]  = useState(true);
    const [scrolled, setScrolled] = useState(false);
    const [dropOpen, setDropOpen] = useState(false);

    const { label, color, links } = getConfig(pathname ?? "/destinations");
    const name = user?.displayName ?? user?.email ?? "Traveler";

    // ── Auth listener ─────────────────────────────────────────────────────────
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, u => { setUser(u); setLoading(false); });
        return () => unsub();
    }, []);

    // ── Scroll shadow ─────────────────────────────────────────────────────────
    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", fn, { passive: true });
        return () => window.removeEventListener("scroll", fn);
    }, []);

    // ── Notifications — only active when a user is signed in ──────────────────
    const { notifications, markRead, markAllRead } = useNotifications(user?.uid ?? null);

    return (
        <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, height:64, background:scrolled?"rgba(255,255,255,0.97)":"rgba(255,255,255,0.92)", borderBottom:`1px solid ${scrolled?"rgba(14,133,178,0.12)":"rgba(14,133,178,0.07)"}`, boxShadow:scrolled?"0 2px 24px rgba(14,133,178,0.09)":"none", backdropFilter:"blur(16px)", transition:"all 0.25s ease", display:"flex", alignItems:"center" }}>
            <div style={{ maxWidth:1280, margin:"0 auto", width:"100%", padding:"0 2rem", display:"flex", alignItems:"center", gap:"1.5rem" }}>

                {/* Logo */}
                <Link href="/" style={{ fontFamily:"Georgia,serif", fontSize:"1.2rem", fontWeight:700, color:"#0A3D52", textDecoration:"none", flexShrink:0 }}>
                    Tizitaw <em style={{ fontStyle:"italic", color:"#1E9DC8" }}>Ethiopia</em>
                </Link>

                {/* Page label pill */}
                <div style={{ display:"flex", alignItems:"center", gap:"0.4rem", background:`${color}15`, border:`1px solid ${color}30`, borderRadius:20, padding:"0.25rem 0.75rem", fontSize:"0.72rem", fontWeight:700, color, flexShrink:0 }}>
                    <span style={{ width:5, height:5, borderRadius:"50%", background:color, display:"inline-block" }}/>
                    {label}
                </div>

                <div style={{ width:1, height:20, background:"rgba(14,133,178,0.15)", flexShrink:0 }}/>

                {/* Nav links */}
                <div style={{ display:"flex", alignItems:"center", gap:"0.25rem", flex:1 }}>
                    {links.map(link => {
                        const active = pathname === link.href;
                        return (
                            <Link key={link.href} href={link.href}
                                  style={{ fontSize:"0.83rem", fontWeight:active?600:400, color:active?"#0A3D52":"#1A6A8A", textDecoration:"none", padding:"0.4rem 0.75rem", borderRadius:8, background:active?"rgba(14,133,178,0.08)":"transparent", transition:"all 0.15s", position:"relative" }}
                                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(14,133,178,0.05)"; }}
                                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                                {link.label}
                                {active && <span style={{ position:"absolute", bottom:-1, left:"50%", transform:"translateX(-50%)", width:16, height:2, borderRadius:2, background:"linear-gradient(90deg,#28B8E8,#0A6A94)" }}/>}
                            </Link>
                        );
                    })}
                </div>

                {/* Right side */}
                <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", flexShrink:0 }}>

                    {/* Notification bell — only shown when signed in */}
                    {!loading && user && (
                        <NotificationBell
                            notifications={notifications}
                            onMarkRead={markRead}
                            onMarkAllRead={markAllRead}
                        />
                    )}

                    {loading ? (
                        <div style={{ width:34, height:34, borderRadius:"50%", background:"rgba(14,133,178,0.08)" }}/>
                    ) : user ? (
                        <div style={{ position:"relative" }}>
                            <button onClick={() => setDropOpen(v => !v)}
                                    style={{ display:"flex", alignItems:"center", gap:"0.5rem", background:"none", border:"1px solid rgba(14,133,178,0.15)", borderRadius:40, padding:"0.25rem 0.65rem 0.25rem 0.3rem", cursor:"pointer", transition:"border-color 0.15s, background 0.15s" }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(14,133,178,0.35)"; (e.currentTarget as HTMLElement).style.background = "rgba(14,133,178,0.04)"; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(14,133,178,0.15)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                                <Avatar name={name} photoURL={user.photoURL}/>
                                <span style={{ fontSize:"0.8rem", fontWeight:500, color:"#0A3D52", maxWidth:100, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                    {name.split(" ")[0]}
                                </span>
                                <svg style={{ transform:dropOpen?"rotate(180deg)":"none", transition:"transform 0.2s", flexShrink:0 }} width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#1A6A8A" strokeWidth="1.8" strokeLinecap="round">
                                    <path d="M2 4l4 4 4-4"/>
                                </svg>
                            </button>
                            {dropOpen && <UserDropdown user={user} onClose={() => setDropOpen(false)}/>}
                        </div>
                    ) : (
                        <>
                            <Link href="/auth/login" style={{ fontSize:"0.83rem", color:"#1A6A8A", textDecoration:"none", padding:"0.4rem 0.75rem", borderRadius:8, transition:"background 0.15s" }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#EBF8FF"; }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                                Sign in
                            </Link>
                            <Link href="/auth/signup" style={{ fontSize:"0.83rem", fontWeight:700, color:"#fff", background:"linear-gradient(135deg,#28B8E8,#0A6A94)", padding:"0.45rem 1rem", borderRadius:8, textDecoration:"none", boxShadow:"0 2px 10px rgba(14,133,178,0.30)", transition:"box-shadow 0.2s, transform 0.2s" }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 18px rgba(14,133,178,0.45)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 10px rgba(14,133,178,0.30)"; (e.currentTarget as HTMLElement).style.transform = "none"; }}>
                                Get started
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}