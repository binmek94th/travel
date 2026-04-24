// src/app/routes/DestinationRouteMap.tsx
// Wraps TourRouteMap's logic for route stops (destinations with days/notes)
"use client";

import { useEffect, useRef, useState } from "react";

type Stop = {
    destinationId: string;
    days: number;
    notes: string;
};

type Destination = {
    id: string;
    name: string;
    latitude?: number | null;
    longitude?: number | null;
    images?: string[];
    region?: string;
};

type Props = {
    stops: Stop[];
    destinations: Destination[];
    routeName: string;
};

// ── Transport is always "driving" between route stops ──────────────────────────
const LINE_COLOR = "#1E9DC8";

function haversineKm(a: [number, number], b: [number, number]) {
    const R = 6371;
    const dLat = ((b[0] - a[0]) * Math.PI) / 180;
    const dLng = ((b[1] - a[1]) * Math.PI) / 180;
    const sin2 =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((a[0] * Math.PI) / 180) *
        Math.cos((b[0] * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.asin(Math.sqrt(sin2));
}

function fmtDist(km: number) {
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(0)} km`;
}

function fmtDur(min: number) {
    if (min < 60) return `${Math.round(min)} min`;
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function buildArc(from: [number, number], to: [number, number], lift = 0.1): [number, number][] {
    const steps = 32;
    const midLat = (from[0] + to[0]) / 2 + Math.abs(to[0] - from[0]) * lift;
    const midLng = (from[1] + to[1]) / 2;
    const pts: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        pts.push([
            (1-t)*(1-t)*from[0] + 2*(1-t)*t*midLat + t*t*to[0],
            (1-t)*(1-t)*from[1] + 2*(1-t)*t*midLng + t*t*to[1],
        ]);
    }
    return pts;
}

async function fetchRoadRoute(
    from: [number, number],
    to:   [number, number]
): Promise<{ pts: [number, number][]; distanceKm: number; durationMin: number } | null> {
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    try {
        const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
        const data = await res.json();
        if (data.code !== "Ok" || !data.routes?.[0]) return null;
        const route = data.routes[0];
        return {
            pts:         route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]),
            distanceKm:  route.distance / 1000,
            durationMin: route.duration / 60,
        };
    } catch { return null; }
}

type Segment = {
    distanceKm:  number;
    durationMin: number;
    isFallback:  boolean;
};

export default function DestinationRouteMap({ stops, destinations, routeName }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef       = useRef<any>(null);
    const [ready,    setReady]    = useState(false);
    const [loading,  setLoading]  = useState(true);
    const [routeErr, setRouteErr] = useState(false);
    const [segments, setSegments] = useState<Segment[]>([]);

    // Only stops with valid coordinates
    const mapped = stops
        .map(s => {
            const dest = destinations.find(d => d.id === s.destinationId);
            if (!dest?.latitude || !dest?.longitude) return null;
            const lat = Number(dest.latitude), lng = Number(dest.longitude);
            if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return null;
            return { stop: s, dest, lat, lng };
        })
        .filter(Boolean) as { stop: Stop; dest: Destination; lat: number; lng: number }[];

    const totalDays    = segments.length > 0 ? null : null; // computed below
    const totalKm      = segments.length && segments.every(s => s.distanceKm  != null) ? segments.reduce((a,s) => a + s.distanceKm,  0) : null;
    const totalMin     = segments.length && segments.every(s => s.durationMin != null) ? segments.reduce((a,s) => a + s.durationMin, 0) : null;

    useEffect(() => {
        if (mapRef.current || !containerRef.current || mapped.length === 0) return;
        let cancelled = false;

        const init = async () => {
            // Load Leaflet
            if (!document.getElementById("leaflet-css")) {
                const link = document.createElement("link");
                link.id = "leaflet-css"; link.rel = "stylesheet";
                link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
                document.head.appendChild(link);
            }
            if (!(window as any).L) {
                await new Promise<void>((res, rej) => {
                    const s = document.createElement("script");
                    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
                    s.onload = () => res(); s.onerror = rej;
                    document.head.appendChild(s);
                });
            }
            if (cancelled) return;

            const L = (window as any).L;
            const latlngs: [number, number][] = mapped.map(m => [m.lat, m.lng]);

            const map = L.map(containerRef.current!, {
                zoomControl: true, attributionControl: false, scrollWheelZoom: false,
            });
            mapRef.current = map;
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18 }).addTo(map);
            latlngs.length === 1
                ? map.setView(latlngs[0], 10)
                : map.fitBounds(L.latLngBounds(latlngs), { padding: [48, 48] });

            // Fetch segments in parallel
            const segs = await Promise.all(
                mapped.slice(1).map(async (m, i) => {
                    const from: [number, number] = [mapped[i].lat, mapped[i].lng];
                    const to:   [number, number] = [m.lat, m.lng];
                    const road = await fetchRoadRoute(from, to);
                    if (road) return { ...road, isFallback: false };
                    // Fallback arc
                    const distanceKm  = haversineKm(from, to) * 1.35;
                    const durationMin = (distanceKm / 60) * 60;
                    return { pts: buildArc(from, to), distanceKm, durationMin, isFallback: true };
                })
            );
            if (cancelled) return;

            let anyFallback = false;

            segs.forEach((seg, i) => {
                if (seg.isFallback) anyFallback = true;
                const from: [number, number] = [mapped[i].lat, mapped[i].lng];
                const to:   [number, number] = [mapped[i + 1].lat, mapped[i + 1].lng];

                // Road / arc polyline
                L.polyline(seg.pts, {
                    color: LINE_COLOR, weight: 3.5, opacity: 0.80,
                    lineJoin: "round", lineCap: "round",
                }).addTo(map);

                // Mid-point distance pill
                const mid = seg.pts[Math.floor(seg.pts.length / 2)];
                L.marker(mid, {
                    icon: L.divIcon({
                        html: `<div style="
              display:inline-flex;align-items:center;gap:5px;
              background:${LINE_COLOR};color:white;
              font-size:10px;font-weight:700;
              padding:3px 9px;border-radius:20px;
              white-space:nowrap;
              box-shadow:0 2px 8px rgba(0,0,0,0.20);
              border:1.5px solid white;
            ">
              🚙 ${fmtDist(seg.distanceKm)} · ${fmtDur(seg.durationMin)}
            </div>`,
                        className: "", iconAnchor: [56, 12],
                    }),
                    interactive: false, zIndexOffset: 50,
                }).addTo(map);
            });

            if (anyFallback) setRouteErr(true);
            setSegments(segs.map(s => ({ distanceKm: s.distanceKm, durationMin: s.durationMin, isFallback: s.isFallback })));

            // Draw pins
            mapped.forEach((m, idx) => {
                const isFirst  = idx === 0;
                const isLast   = idx === mapped.length - 1;
                const pinColor = isFirst ? "#10B981" : isLast ? "#EF4444" : LINE_COLOR;

                const icon = L.divIcon({
                    html: `<div style="width:38px;height:46px;filter:drop-shadow(0 3px 8px rgba(14,133,178,0.45))">
            <svg viewBox="0 0 38 46" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 0C11.82 0 6 5.82 6 13c0 9.5 13 33 13 33S32 22.5 32 13C32 5.82 26.18 0 19 0z"
                fill="${pinColor}" stroke="white" stroke-width="1.5"/>
              <circle cx="19" cy="13" r="8.5" fill="white"/>
              <text x="19" y="17.5" text-anchor="middle" font-size="9.5" font-weight="800"
                fill="${pinColor}" font-family="system-ui,sans-serif">${idx + 1}</text>
            </svg>
          </div>`,
                    className: "", iconSize: [38, 46], iconAnchor: [19, 46], popupAnchor: [0, -48],
                });

                const seg     = segs[idx - 1];
                const segInfo = seg
                    ? `<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">
              <span style="font-size:10px;color:#1A6A8A;background:#EBF8FF;padding:1px 7px;border-radius:10px">📏 ${fmtDist(seg.distanceKm)}</span>
              <span style="font-size:10px;color:#1A6A8A;background:#EBF8FF;padding:1px 7px;border-radius:10px">⏱ ${fmtDur(seg.durationMin)}</span>
            </div>` : "";

                const marker = L.marker([m.lat, m.lng], { icon, zIndexOffset: 100 }).addTo(map);
                marker.bindPopup(`
          <div style="font-family:'Lato',system-ui,sans-serif;min-width:180px;max-width:240px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
              <div style="min-width:22px;height:22px;border-radius:50%;background:${pinColor};
                color:white;font-size:9.5px;font-weight:800;display:flex;align-items:center;
                justify-content:center;flex-shrink:0">${idx + 1}</div>
              <div style="font-size:12px;font-weight:700;color:#0A3D52;line-height:1.3">${m.dest.name}</div>
            </div>
            ${m.dest.region ? `<div style="font-size:10px;color:#1A6A8A;margin-bottom:4px">📍 ${m.dest.region}</div>` : ""}
            <div style="font-size:11px;color:#1A6A8A">${m.stop.days} night${m.stop.days !== 1 ? "s" : ""}${m.stop.notes ? " · " + m.stop.notes : ""}</div>
            ${segInfo}
          </div>`, { closeButton: false, offset: [0, -6], maxWidth: 260 });

                marker.on("mouseover", () => marker.openPopup());
                marker.on("mouseout",  () => marker.closePopup());
            });

            setReady(true);
            setLoading(false);
        };

        init().catch(() => setLoading(false));
        return () => {
            cancelled = true;
            if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
        };
    }, [mapped.length]);

    if (mapped.length === 0) return null;

    // Cumulative day numbers for the strip
    const cumDays = mapped.reduce<number[]>((acc, m, i) => {
        acc.push((acc[i - 1] ?? 0) + m.stop.days);
        return acc;
    }, []);

    return (
        <div className="rounded-2xl overflow-hidden border border-[rgba(14,133,178,0.12)] shadow-[0_4px_24px_rgba(14,133,178,0.07)]">

            {/* ── Header ── */}
            <div className="flex items-center justify-between bg-white px-4 py-3 border-b border-[rgba(14,133,178,0.08)]">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#28B8E8] to-[#0A6A94]">
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                            <path d="M7 1C4.79 1 3 2.79 3 5c0 3.18 4 8 4 8s4-4.82 4-8c0-2.21-1.79-4-4-4z"/><circle cx="7" cy="5" r="1.2"/>
                        </svg>
                    </div>
                    <span className="text-sm font-semibold text-[#0A3D52]">Route map</span>
                    <span className="text-xs font-light text-[#1A6A8A]">· {mapped.length} stop{mapped.length !== 1 ? "s" : ""}</span>
                    {loading && (
                        <div className="flex items-center gap-1 text-[0.65rem] text-[#1A6A8A]">
                            <div className="h-3 w-3 animate-spin rounded-full border border-[rgba(14,133,178,0.2)] border-t-[#1E9DC8]"/>
                            routing…
                        </div>
                    )}
                </div>
                <a
                    href={`https://www.google.com/maps/dir/${mapped.map(m => `${m.lat},${m.lng}`).join("/")}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-medium text-[#1E9DC8] hover:underline">
                    Open in Maps
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M2 8L8 2M4 2h4v4"/>
                    </svg>
                </a>
            </div>

            {/* ── Summary bar ── */}
            {!loading && segments.length > 0 && (
                <div className="flex items-center gap-0 bg-gradient-to-r from-[#0A3D52] to-[#0E85B2] px-4 py-2.5 overflow-x-auto">
                    <div className="flex flex-1 flex-wrap items-center gap-3">
                        {segments.map((seg, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5">
                                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: LINE_COLOR, flexShrink: 0 }}/>
                                    <span className="text-[0.65rem] font-semibold text-white/70 whitespace-nowrap">
                    {mapped[i].dest.name} → {mapped[i + 1].dest.name}
                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] font-semibold text-white whitespace-nowrap">
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M1 5h8M5 1l4 4-4 4"/>
                    </svg>
                      {fmtDist(seg.distanceKm)}
                  </span>
                                    <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] font-semibold text-white whitespace-nowrap">
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <circle cx="5" cy="5" r="4"/><path d="M5 2.5V5l1.5 1.5"/>
                    </svg>
                                        {fmtDur(seg.durationMin)}
                  </span>
                                </div>
                                {i < segments.length - 1 && <div className="w-px h-3 bg-white/20"/>}
                            </div>
                        ))}
                    </div>

                    {(totalKm !== null || totalMin !== null) && (
                        <div className="flex items-center gap-2 border-l border-white/15 pl-4 ml-2 flex-shrink-0">
                            <span className="text-[0.65rem] font-bold text-white/50 uppercase tracking-wider">Total</span>
                            {totalKm  !== null && <span className="text-sm font-bold text-white">{fmtDist(totalKm)}</span>}
                            {totalMin !== null && <span className="text-sm font-bold text-white/80">{fmtDur(totalMin)}</span>}
                        </div>
                    )}
                </div>
            )}

            {/* ── Map ── */}
            <div className="relative" style={{ height: 380 }}>
                <div ref={containerRef} style={{ width: "100%", height: "100%" }}/>
                {!ready && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#EBF8FF] z-10">
                        <div className="flex flex-col items-center gap-2">
                            <div className="relative h-8 w-8">
                                <div className="absolute inset-0 animate-spin rounded-full border-2 border-[rgba(14,133,178,0.12)] border-t-[#1E9DC8]"/>
                                <div className="absolute inset-1.5 animate-spin rounded-full border border-[rgba(14,133,178,0.08)] border-t-[#28B8E8]"
                                     style={{ animationDirection: "reverse", animationDuration: "0.7s" }}/>
                            </div>
                            <span className="text-xs text-[#1A6A8A]">Loading route map…</span>
                        </div>
                    </div>
                )}
                {ready && routeErr && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[500] pointer-events-none">
                        <div className="flex items-center gap-1.5 rounded-full bg-amber-500/85 px-3 py-1.5 text-white text-[0.65rem] font-medium backdrop-blur-sm shadow">
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                <path d="M6 1v6M6 10v1"/>
                            </svg>
                            Some road routes unavailable — showing estimated path
                        </div>
                    </div>
                )}
            </div>

            {/* ── Stop strip ── */}
            <div className="bg-[#F8FCFF] border-t border-[rgba(14,133,178,0.08)] px-4 py-3">
                <style>{`.dst-scrollbar::-webkit-scrollbar{display:none}.dst-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
                <div className="flex items-start overflow-x-auto dst-scrollbar gap-0">
                    {mapped.map((m, idx) => {
                        const isFirst  = idx === 0;
                        const isLast   = idx === mapped.length - 1;
                        const pinColor = isFirst ? "#10B981" : isLast ? "#EF4444" : LINE_COLOR;
                        const dayStart = (cumDays[idx - 1] ?? 0) + 1;
                        const dayEnd   = cumDays[idx];
                        const seg      = segments[idx];

                        return (
                            <div key={m.dest.id} className="flex items-start flex-shrink-0">
                                {/* Stop node */}
                                <div className="flex flex-col items-center" style={{ minWidth: 80 }}>
                                    <div style={{
                                        width: 24, height: 24, borderRadius: "50%", background: pinColor,
                                        color: "white", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center",
                                        justifyContent: "center", border: "2px solid white",
                                        boxShadow: "0 2px 8px rgba(14,133,178,0.25)", flexShrink: 0,
                                    }}>
                                        {idx + 1}
                                    </div>
                                    <div className="mt-1.5 px-1 text-center">
                                        <div className="text-[0.6rem] font-bold text-[#0A3D52] leading-tight"
                                             style={{ maxWidth: 72, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                            {m.dest.name}
                                        </div>
                                        <div className="text-[0.55rem] text-[#1A6A8A] mt-0.5">
                                            Day{dayStart === dayEnd ? ` ${dayStart}` : `s ${dayStart}–${dayEnd}`}
                                        </div>
                                    </div>
                                </div>

                                {/* Connector */}
                                {idx < mapped.length - 1 && (
                                    <div className="flex flex-col items-center mx-1 flex-shrink-0 pt-2" style={{ minWidth: 72 }}>
                                        <svg width="72" height="6" viewBox="0 0 72 6">
                                            <line x1="0" y1="3" x2="72" y2="3" stroke={LINE_COLOR} strokeWidth="2"
                                                  strokeLinecap="round" opacity="0.65"/>
                                        </svg>
                                        {seg && (
                                            <div className="mt-1 flex flex-col items-center gap-0.5">
                                                <span className="text-[0.55rem] font-semibold text-[#0A3D52]">{fmtDist(seg.distanceKm)}</span>
                                                <span className="text-[0.55rem] text-[#1A6A8A]">{fmtDur(seg.durationMin)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}