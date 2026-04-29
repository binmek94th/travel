"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ComponentType, type SVGProps } from "react";

type NavItem = {
  href:   string;
  label:  string;
  icon:   ComponentType<SVGProps<SVGSVGElement>>;
  badge?: number;
};

type NavSection = { section: string; items: NavItem[] };

const NAV: NavSection[] = [
  {
    section: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: IcoGrid },
    ],
  },
  {
    section: "Content",
    items: [
      { href: "/admin/destinations", label: "Destinations", icon: IcoMap },
      { href: "/admin/tours",        label: "Tours",        icon: IcoCompass },
      { href: "/admin/guides",       label: "Guides & Blog",icon: IcoBook },
      { href: "/admin/videos",       label: "Videos",       icon: IcoVideo },
      { href: "/admin/routes",       label: "Routes",       icon: IcoRoute },
      { href: "/admin/events",       label: "Events",       icon: IcoCal },
    ],
  },
  {
    section: "Commerce",
    items: [
      { href: "/admin/bookings",  label: "Bookings",  icon: IcoTicket },
      { href: "/admin/operators", label: "Operators", icon: IcoBag },
      { href: "/admin/payments",  label: "Payments",  icon: IcoCoin },
      { href: "/admin/featured",  label: "Featured",  icon: IcoStar },
    ],
  },
  {
    section: "Community",
    items: [
      { href: "/admin/emails",   label: "Emails",    icon: IcoMail },
      { href: "/admin/users",   label: "Users",    icon: IcoUsers },
      { href: "/admin/reviews", label: "Reviews",  icon: IcoStar2 },
      { href: "/admin/qa",      label: "Q&A Posts",icon: IcoChat },
    ],
  },
  {
    section: "System",
    items: [
      { href: "/admin/settings", label: "Settings", icon: IcoSettings },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 min-h-screen bg-slate-900 flex flex-col fixed top-0 left-0 bottom-0 z-50 border-r border-white/[0.06]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <span className="block text-2xl font-light text-slate-100 tracking-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}>
          Tizitaw
        </span>
        <span className="block text-[10px] font-semibold text-cyan-400 tracking-[0.12em] uppercase mt-0.5">
          Admin Console
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <p className="px-5 pt-4 pb-1.5 text-[9px] font-semibold tracking-[0.12em] uppercase text-white/25">
              {section}
            </p>
            {items.map(({ href, label, icon: Icon, badge }) => {
              const active =
                pathname === href ||
                (href !== "/admin" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex items-center gap-2.5 px-5 py-2.5 text-sm transition-colors
                    ${active
                      ? "bg-cyan-500/[0.15] text-cyan-200 font-medium"
                      : "text-white/55 hover:bg-white/[0.05] hover:text-white/80"
                    }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-cyan-400 rounded-r-full" />
                  )}
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-opacity ${active ? "opacity-100" : "opacity-60"}`}
                  />
                  <span className="flex-1">{label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span className="bg-cyan-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/[0.06] flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
          AD
        </div>
        <div>
          <div className="text-xs font-medium text-slate-200">Super Admin</div>
          <div className="text-[10px] text-cyan-400">Administrator</div>
        </div>
      </div>
    </aside>
  );
}

/* ── Icons ── */
function IcoGrid(p: SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="2" width="7" height="7" rx="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5"/></svg>;
}
function IcoMap(p: SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 2C7.24 2 5 4.24 5 7c0 4.17 5 11 5 11s5-6.83 5-11c0-2.76-2.24-5-5-5z"/><circle cx="10" cy="7" r="1.5"/></svg>;
}
function IcoCompass(p: SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="10" cy="10" r="8"/><path d="M13.5 6.5l-2 5-5 2 2-5 5-2z"/></svg>;
}
function IcoBook(p: SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4h8a2 2 0 012 2v10a2 2 0 01-2 2H4V4z"/><path d="M14 4h2a2 2 0 012 2v10a2 2 0 01-2 2h-2"/></svg>;
}
function IcoVideo(p: SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="5" width="11" height="10" rx="2"/><path d="M13 8.5l5-3v9l-5-3V8.5z"/></svg>;
}
function IcoRoute(p: SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="4" cy="6" r="2"/><circle cx="16" cy="16" r="2"/><path d="M4 8v4c0 2 2 3 4 3h4c2 0 4 1 4 3"/></svg>;
}
function IcoCal(p: SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="14" height="14" rx="2"/><path d="M3 8h14M7 2v3M13 2v3"/></svg>;
}
function IcoTicket(p: SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 7a1 1 0 011-1h12a1 1 0 011 1v2a2 2 0 000 4v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2a2 2 0 000-4V7z"/></svg>;
}
function IcoBag(p: SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="7" width="14" height="10" rx="2"/><path d="M7 7V5a2 2 0 012-2h2a2 2 0 012 2v2"/><path d="M3 11h14"/></svg>;
}
function IcoCoin(p: SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="10" cy="10" r="8"/><path d="M10 6v8M7.5 8.5c0-1.5 5-1.5 5 0s-5 2-5 3.5 5 1.5 5 0"/></svg>;
}
function IcoStar(p: SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 2l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 14.27l-4.77 2.51.91-5.32L2.27 7.62l5.34-.78L10 2z"/></svg>;
}
function IcoStar2(p: SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 2l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 14.27l-4.77 2.51.91-5.32L2.27 7.62l5.34-.78L10 2z"/></svg>;
}

export function IcoMail(p: SVGProps<SVGSVGElement>) {
  return (
      <svg
          {...p}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
      >
        {/* Envelope body */}
        <rect x="2.5" y="4" width="15" height="12" rx="2" />

        <path d="M3 5l7 6 7-6" />
      </svg>
  );
}

function IcoUsers(p: SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="6" r="3"/><path d="M2 18c0-3.31 2.69-6 6-6s6 2.69 6 6"/><path d="M15 3c1.66 0 3 1.34 3 3s-1.34 3-3 3"/><path d="M18 18c0-2.21-1.34-4.1-3.25-4.75"/></svg>;
}
function IcoChat(p: SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4h12a2 2 0 012 2v7a2 2 0 01-2 2H9l-5 3v-3H4a2 2 0 01-2-2V6a2 2 0 012-2z"/></svg>;
}
function IcoSettings(p: SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="10" cy="10" r="2.5"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42"/></svg>;
}
