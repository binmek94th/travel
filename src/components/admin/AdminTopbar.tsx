"use client";

import { usePathname } from "next/navigation";

const TITLES: Record<string, string> = {
  "/admin":              "Dashboard",
  "/admin/users":        "Users",
  "/admin/destinations": "Destinations",
  "/admin/tours":        "Tours",
  "/admin/bookings":     "Bookings",
  "/admin/operators":    "Operators",
  "/admin/reviews":      "Reviews",
  "/admin/payments":     "Payments",
  "/admin/featured":     "Featured Listings",
  "/admin/videos":       "Videos",
  "/admin/guides":       "Guides & Blog",
  "/admin/routes":       "Travel Routes",
  "/admin/events":       "Events",
  "/admin/qa":           "Q&A Posts",
  "/admin/settings":     "Settings",
};

export default function AdminTopbar() {
  const pathname = usePathname();
  const title    = TITLES[pathname] ?? "Admin";

  return (
    <header className="h-[60px] bg-white border-b border-slate-100 flex items-center py-2 px-6 gap-4 sticky top-0 z-40 shadow-sm">
      <h1 className="flex-1 text-lg font-light text-slate-800 tracking-tight"
        style={{ fontFamily: "'Playfair Display', serif" }}>
        {title}
      </h1>

      {/* Search */}
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-56">
        <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" viewBox="0 0 16 16" fill="none"
          stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <circle cx="7" cy="7" r="5"/><path d="M12 12l3 3"/>
        </svg>
        <input
          className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
          placeholder="Search…"
        />
      </div>

      {/* Bell */}
      <button className="relative w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:border-cyan-300 hover:text-cyan-600 transition-colors">
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M10 2a6 6 0 016 6v3l2 3H2l2-3V8a6 6 0 016-6z"/>
          <path d="M8 17a2 2 0 004 0"/>
        </svg>
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
      </button>

      {/*/!* Add new *!/*/}
      {/*<button className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg transition-colors">*/}
      {/*  <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">*/}
      {/*    <path d="M7 1v12M1 7h12"/>*/}
      {/*  </svg>*/}
      {/*  Add New*/}
      {/*</button>*/}
    </header>
  );
}
