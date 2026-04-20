"use client";

import { useEffect, useRef, useState } from "react";

type ItineraryDay = {
    day: number;
    title: string;
    description: string;
    latitude?: number | string;
    longitude?: number | string;
    transportMode?: "driving" | "walking" | "flying" | "boat";
};

type RouteSegment = {
    from: ItineraryDay;
    to: ItineraryDay;
    mode: string;
    pts: [number, number][];
    distanceKm: number | null;
    durationMin: number | null;
};

type Props = { itinerary: ItineraryDay[]; tourTitle: string };

const TRANSPORT_COLORS: Record<string, string> = {
    driving: "#1E9DC8",
    walking: "#10B981",
    flying:  "#8B5CF6",
    boat:    "#F59E0B",
};

const TRANSPORT_LABELS: Record<string, string> = {
    driving: "🚙 Drive",
    walking: "🚶 Walk",
    flying:  "✈️ Fly",
    boat:    "⛵ Boat",
};

// Average speeds for ETA on non-routed modes (km/h)
const AVG_SPEEDS: Record<string, number> = {
    flying: 800,
    boat:   30,
};

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
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function fmtDur(min: number) {
    if (min < 60) return `${Math.round(min)} min`;
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

async function fetchRoadRoute(
    from: [number, number],
    to: [number, number],
    mode: "driving" | "walking"
): Promise<{ pts: [number, number][]; distanceKm: number; durationMin: number } | null> {
    const profile = mode === "walking" ? "foot" : "driving";
    const url = `https://router.project-osrm.org/route/v1/${profile}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    try {
        const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
        const data = await res.json();
        if (data.code !== "Ok" || !data.routes?.[0]) return null;
        const route = data.routes[0];
        return {
            pts: route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]),
            distanceKm: route.distance / 1000,
            durationMin: route.duration / 60,
        };
    } catch {
        return null;
    }
}

function buildArc(from: [number, number], to: [number, number], lift = 0.3): [number, number][] {
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

// ── SEGMENT STAT PILL shown on map at midpoint ────────────────────────────────
function segmentPopupHtml(mode: string, distKm: number | null, durMin: number | null) {
    const color = TRANSPORT_COLORS[mode] ?? "#1E9DC8";
    const label = TRANSPORT_LABELS[mode] ?? mode;
    const dist  = distKm  !== null ? fmtDist(distKm)  : null;
    const dur   = durMin  !== null ? fmtDur(durMin)    : null;
    return `<div style="
    display:inline-flex;align-items:center;gap:5px;
    background:${color};color:white;
    font-size:10px;font-weight:700;
    padding:3px 9px;border-radius:20px;
    white-space:nowrap;
    box-shadow:0 2px 8px rgba(0,0,0,0.20);
    border:1.5px solid white;
  ">
    ${label}
    ${dist ? `<span style="opacity:0.85;font-weight:500">· ${dist}</span>` : ""}
    ${dur  ? `<span style="opacity:0.85;font-weight:500">· ${dur}</span>`  : ""}
  </div>`;
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function TourRouteMap({ itinerary, tourTitle }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef       = useRef<any>(null);
    const [ready,     setReady]     = useState(false);
    const [loading,   setLoading]   = useState(true);
    const [routeErr,  setRouteErr]  = useState(false);
    const [segments,  setSegments]  = useState<RouteSegment[]>([]);

    const days = itinerary.filter(d => {
        const lat = Number(d.latitude), lng = Number(d.longitude);
        return d.latitude && d.longitude && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
    });

    // Totals for summary bar
    const totalKm  = segments.every(s => s.distanceKm  !== null) ? segments.reduce((a,s) => a + (s.distanceKm  ?? 0), 0) : null;
    const totalMin = segments.every(s => s.durationMin !== null) ? segments.reduce((a,s) => a + (s.durationMin ?? 0), 0) : null;

    useEffect(() => {
        if (mapRef.current || !containerRef.current || days.length === 0) return;
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
            const latlngs: [number, number][] = days.map(d => [Number(d.latitude), Number(d.longitude)]);

            const map = L.map(containerRef.current!, {
                zoomControl: true, attributionControl: false, scrollWheelZoom: false,
            });
            mapRef.current = map;
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18 }).addTo(map);
            latlngs.length === 1
                ? map.setView(latlngs[0], 10)
                : map.fitBounds(L.latLngBounds(latlngs), { padding: [48, 48] });

            // Fetch all segments in parallel
            const results = await Promise.all(
                days.slice(1).map(async (day, i) => {
                    const from  = days[i];
                    const to    = day;
                    const mode  = to.transportMode ?? "driving";
                    const fromLL: [number, number] = [Number(from.latitude), Number(from.longitude)];
                    const toLL:   [number, number] = [Number(to.latitude),   Number(to.longitude)];

                    let pts: [number, number][]  = [];
                    let distanceKm: number | null = null;
                    let durationMin: number | null = null;

                    if (mode === "driving" || mode === "walking") {
                        const road = await fetchRoadRoute(fromLL, toLL, mode);
                        if (road) {
                            pts = road.pts;
                            distanceKm  = road.distanceKm;
                            durationMin = road.durationMin;
                        } else {
                            pts = buildArc(fromLL, toLL, 0.1);
                            // Estimate from straight-line distance
                            distanceKm  = haversineKm(fromLL, toLL) * 1.35; // road factor
                            durationMin = (distanceKm / (mode === "walking" ? 5 : 60)) * 60;
                        }
                    } else {
                        // flying / boat — arc + speed-based ETA
                        const lift = mode === "flying" ? 0.35 : 0.15;
                        pts = buildArc(fromLL, toLL, lift);
                        distanceKm  = haversineKm(fromLL, toLL);
                        durationMin = (distanceKm / AVG_SPEEDS[mode]) * 60;
                    }

                    return { from, to, mode, pts, distanceKm, durationMin, idx: i } as RouteSegment & { idx: number };
                })
            );

            if (cancelled) return;

            const builtSegments: RouteSegment[] = results.map(r => ({
                from: r.from, to: r.to, mode: r.mode,
                pts: r.pts, distanceKm: r.distanceKm, durationMin: r.durationMin,
            }));
            setSegments(builtSegments);

            let anyFallback = false;

            for (const seg of results) {
                const { mode, pts, distanceKm, durationMin, idx } = seg;
                const color = TRANSPORT_COLORS[mode] ?? "#1E9DC8";

                // Check if we got a fallback arc (<=33 pts means arc not road)
                if ((mode === "driving" || mode === "walking") && pts.length <= 33) anyFallback = true;

                L.polyline(pts, {
                    color,
                    weight:    mode === "walking" ? 2.5 : 3.5,
                    opacity:   0.85,
                    dashArray: mode === "flying" ? "7 5" : mode === "boat" ? "5 4" : mode === "walking" ? "3 4" : undefined,
                    lineJoin:  "round",
                    lineCap:   "round",
                }).addTo(map);

                // Mid-point label with distance + ETA
                const mid = pts[Math.floor(pts.length / 2)];
                L.marker(mid, {
                    icon: L.divIcon({
                        html: segmentPopupHtml(mode, distanceKm, durationMin),
                        className: "",
                        iconAnchor: [50, 12],
                    }),
                    interactive: false,
                    zIndexOffset: 50,
                }).addTo(map);
            }

            if (anyFallback) setRouteErr(true);

            // Draw pins on top
            days.forEach((day, idx) => {
                const lat = Number(day.latitude), lng = Number(day.longitude);
                const isFirst = idx === 0, isLast = idx === days.length - 1;
                const pinColor = isFirst ? "#10B981" : isLast ? "#EF4444" : "#1E9DC8";

                const icon = L.divIcon({
                    html: `<div style="width:38px;height:46px;filter:drop-shadow(0 3px 8px rgba(14,133,178,0.45))">
            <svg viewBox="0 0 38 46" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 0C11.82 0 6 5.82 6 13c0 9.5 13 33 13 33S32 22.5 32 13C32 5.82 26.18 0 19 0z"
                fill="${pinColor}" stroke="white" stroke-width="1.5"/>
              <circle cx="19" cy="13" r="8.5" fill="white"/>
              <text x="19" y="17.5" text-anchor="middle" font-size="9.5" font-weight="800"
                fill="${pinColor}" font-family="system-ui,sans-serif">${day.day}</text>
            </svg>
          </div>`,
                    className: "", iconSize: [38,46], iconAnchor: [19,46], popupAnchor: [0,-48],
                });

                const marker = L.marker([lat, lng], { icon, zIndexOffset: 100 }).addTo(map);

                const seg     = results[idx - 1];
                const segInfo = seg
                    ? `<div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap">
              ${seg.distanceKm  !== null ? `<span style="font-size:10px;color:#1A6A8A;background:#EBF8FF;padding:1px 7px;border-radius:10px">📏 ${fmtDist(seg.distanceKm)}</span>`  : ""}
              ${seg.durationMin !== null ? `<span style="font-size:10px;color:#1A6A8A;background:#EBF8FF;padding:1px 7px;border-radius:10px">⏱ ${fmtDur(seg.durationMin)}</span>` : ""}
            </div>` : "";

                marker.bindPopup(`
          <div style="font-family:'Lato',system-ui,sans-serif;min-width:190px;max-width:240px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
              <div style="min-width:22px;height:22px;border-radius:50%;background:${pinColor};
                color:white;font-size:9.5px;font-weight:800;display:flex;align-items:center;
                justify-content:center;flex-shrink:0">${day.day}</div>
              <div style="font-size:12px;font-weight:700;color:#0A3D52;line-height:1.3">${day.title}</div>
            </div>
            <p style="font-size:11px;color:#1A6A8A;line-height:1.55;margin:0">
              ${day.description.slice(0,130)}${day.description.length>130?"…":""}
            </p>
            ${segInfo}
          </div>`, { closeButton: false, offset: [0,-6], maxWidth: 260 });

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
    }, [days.length]);

    if (days.length === 0) return null;

    const activeModes = [...new Set(days.slice(1).map(d => d.transportMode ?? "driving"))];

    return (
        <div className="rounded-2xl overflow-hidden border border-[rgba(14,133,178,0.12)] shadow-[0_4px_24px_rgba(14,133,178,0.07)]">

            {/* ── Header ── */}
            <div className="flex items-center justify-between bg-white px-4 py-3 border-b border-[rgba(14,133,178,0.08)]">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#28B8E8] to-[#0A6A94]">
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                            <path d="M2 7C2 4 12 4 12 7S2 10 2 7"/>
                            <circle cx="2"  cy="7" r="1.5" fill="white" stroke="none"/>
                            <circle cx="12" cy="7" r="1.5" fill="white" stroke="none"/>
                        </svg>
                    </div>
                    <span className="text-sm font-semibold text-[#0A3D52]">Tour route</span>
                    <span className="text-xs font-light text-[#1A6A8A]">· {days.length} stop{days.length!==1?"s":""}</span>
                    {loading && (
                        <div className="flex items-center gap-1 text-[0.65rem] text-[#1A6A8A]">
                            <div className="h-3 w-3 animate-spin rounded-full border border-[rgba(14,133,178,0.2)] border-t-[#1E9DC8]"/>
                            routing…
                        </div>
                    )}
                </div>
                {/* Legend */}
                <div className="flex items-center gap-3">
                    {activeModes.map(mode => {
                        const color    = TRANSPORT_COLORS[mode] ?? "#1E9DC8";
                        const isDashed = mode === "flying" || mode === "boat";
                        const isDotted = mode === "walking";
                        return (
                            <div key={mode} className="flex items-center gap-1.5">
                                <svg width="20" height="6" viewBox="0 0 20 6">
                                    <line x1="0" y1="3" x2="20" y2="3" stroke={color}
                                          strokeWidth={isDotted?2:2.5}
                                          strokeDasharray={isDashed?"6 4":isDotted?"3 3":undefined}
                                          strokeLinecap="round"/>
                                </svg>
                                <span className="text-[0.62rem] text-[#1A6A8A] capitalize">{mode}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Summary bar — total distance + ETA ── */}
            {!loading && segments.length > 0 && (
                <div className="flex items-center gap-0 bg-gradient-to-r from-[#0A3D52] to-[#0E85B2] px-4 py-2.5">
                    <div className="flex flex-1 flex-wrap items-center gap-4">
                        {/* Per-segment stats */}
                        {segments.map((seg, i) => {
                            const color = TRANSPORT_COLORS[seg.mode] ?? "#1E9DC8";
                            return (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5">
                                        <div style={{ width:6, height:6, borderRadius:"50%", background:color, flexShrink:0 }}/>
                                        <span className="text-[0.65rem] font-semibold text-white/70">
                      Day {seg.from.day}→{seg.to.day}
                    </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {seg.distanceKm !== null && (
                                            <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] font-semibold text-white">
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M1 5h8M5 1l4 4-4 4"/>
                        </svg>
                                                {fmtDist(seg.distanceKm)}
                      </span>
                                        )}
                                        {seg.durationMin !== null && (
                                            <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] font-semibold text-white">
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <circle cx="5" cy="5" r="4"/><path d="M5 2.5V5l1.5 1.5"/>
                        </svg>
                                                {fmtDur(seg.durationMin)}
                      </span>
                                        )}
                                    </div>
                                    {i < segments.length - 1 && <div className="w-px h-3 bg-white/20"/>}
                                </div>
                            );
                        })}
                    </div>

                    {/* Total */}
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
            <div className="relative" style={{ height: 420 }}>
                <div ref={containerRef} style={{ width:"100%", height:"100%" }}/>
                {!ready && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#EBF8FF] z-10">
                        <div className="flex flex-col items-center gap-2">
                            <div className="relative h-8 w-8">
                                <div className="absolute inset-0 animate-spin rounded-full border-2 border-[rgba(14,133,178,0.12)] border-t-[#1E9DC8]"/>
                                <div className="absolute inset-1.5 animate-spin rounded-full border border-[rgba(14,133,178,0.08)] border-t-[#28B8E8]"
                                     style={{ animationDirection:"reverse", animationDuration:"0.7s" }}/>
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

            {/* ── Day stops strip ── */}
            <div className="bg-[#F8FCFF] border-t border-[rgba(14,133,178,0.08)] px-4 py-3">
                <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}.hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
                <div className="flex items-start overflow-x-auto hide-scrollbar gap-0">
                    {days.map((day, idx) => {
                        const isFirst  = idx === 0;
                        const isLast   = idx === days.length - 1;
                        const pinColor = isFirst ? "#10B981" : isLast ? "#EF4444" : "#1E9DC8";
                        const seg      = segments[idx]; // segment arriving AT this day
                        const nextSeg  = segments[idx]; // segment leaving FROM this day
                        const nextMode = days[idx + 1]?.transportMode ?? "driving";
                        const lineColor = TRANSPORT_COLORS[nextMode] ?? "#1E9DC8";

                        return (
                            <div key={day.day} className="flex items-start flex-shrink-0">
                                {/* Stop */}
                                <div className="flex flex-col items-center" style={{ minWidth: 80 }}>
                                    <div style={{ width:24, height:24, borderRadius:"50%", background:pinColor,
                                        color:"white", fontSize:9, fontWeight:800, display:"flex", alignItems:"center",
                                        justifyContent:"center", border:"2px solid white",
                                        boxShadow:"0 2px 8px rgba(14,133,178,0.25)", flexShrink:0 }}>
                                        {day.day}
                                    </div>
                                    <div className="mt-1.5 px-1 text-center">
                                        <div className="text-[0.6rem] font-bold text-[#0A3D52] leading-tight"
                                             style={{ maxWidth:72, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                                            {day.title}
                                        </div>
                                    </div>
                                </div>

                                {/* Connector with distance + ETA */}
                                {idx < days.length - 1 && (
                                    <div className="flex flex-col items-center mx-1 flex-shrink-0 pt-2" style={{ minWidth: 68 }}>
                                        <svg width="68" height="6" viewBox="0 0 68 6">
                                            <line x1="0" y1="3" x2="68" y2="3" stroke={lineColor} strokeWidth="2"
                                                  strokeDasharray={nextMode==="flying"?"6 4":nextMode==="boat"?"5 3":nextMode==="walking"?"3 3":undefined}
                                                  strokeLinecap="round" opacity="0.75"/>
                                        </svg>
                                        {segments[idx] && (
                                            <div className="mt-1 flex flex-col items-center gap-0.5">
                                                {segments[idx].distanceKm !== null && (
                                                    <span className="text-[0.55rem] font-semibold text-[#0A3D52]">
                            {fmtDist(segments[idx].distanceKm!)}
                          </span>
                                                )}
                                                {segments[idx].durationMin !== null && (
                                                    <span className="text-[0.55rem] text-[#1A6A8A]">
                            {fmtDur(segments[idx].durationMin!)}
                          </span>
                                                )}
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