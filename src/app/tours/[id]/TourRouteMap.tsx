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

export default function TourRouteMap({ itinerary, tourTitle }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef       = useRef<any>(null);
    const [ready, setReady] = useState(false);

    // Filter days that have valid coordinates
    const days = itinerary.filter(d => {
        const lat = Number(d.latitude);
        const lng = Number(d.longitude);
        return d.latitude && d.longitude && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
    });

    useEffect(() => {
        if (mapRef.current || !containerRef.current || days.length === 0) return;

        const load = async () => {
            if (!document.getElementById("leaflet-css")) {
                const link  = document.createElement("link");
                link.id     = "leaflet-css";
                link.rel    = "stylesheet";
                link.href   = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
                document.head.appendChild(link);
            }
            if (!(window as any).L) {
                await new Promise<void>((res, rej) => {
                    const s   = document.createElement("script");
                    s.src     = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
                    s.onload  = () => res();
                    s.onerror = rej;
                    document.head.appendChild(s);
                });
            }

            const L = (window as any).L;

            // Compute bounds from all day coordinates
            const latlngs = days.map(d => [Number(d.latitude), Number(d.longitude)] as [number, number]);

            const map = L.map(containerRef.current!, {
                zoomControl: true,
                attributionControl: false,
                scrollWheelZoom: false,
            });
            mapRef.current = map;

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18 }).addTo(map);

            // Fit map to all pins
            if (latlngs.length === 1) {
                map.setView(latlngs[0], 10);
            } else {
                map.fitBounds(L.latLngBounds(latlngs), { padding: [48, 48] });
            }

            // Draw route lines between consecutive days
            for (let i = 1; i < days.length; i++) {
                const from = days[i - 1];
                const to   = days[i];
                const mode = to.transportMode ?? "driving";
                const color = TRANSPORT_COLORS[mode] ?? "#1E9DC8";

                const isDashed = mode === "flying" || mode === "boat";
                const isArc    = mode === "flying";

                if (isArc) {
                    // Draw a curved arc for flights using intermediate points
                    const fromLat = Number(from.latitude);
                    const fromLng = Number(from.longitude);
                    const toLat   = Number(to.latitude);
                    const toLng   = Number(to.longitude);

                    // Generate arc points
                    const arcPoints: [number, number][] = [];
                    const steps = 20;
                    for (let s = 0; s <= steps; s++) {
                        const t = s / steps;
                        // Bezier-style arc: lift the midpoint up by some offset
                        const midLat = (fromLat + toLat) / 2 + Math.abs(toLat - fromLat) * 0.3;
                        const midLng = (fromLng + toLng) / 2;
                        const lat = (1 - t) * (1 - t) * fromLat + 2 * (1 - t) * t * midLat + t * t * toLat;
                        const lng = (1 - t) * (1 - t) * fromLng + 2 * (1 - t) * t * midLng + t * t * toLng;
                        arcPoints.push([lat, lng]);
                    }

                    L.polyline(arcPoints, {
                        color,
                        weight: 2.5,
                        opacity: 0.75,
                        dashArray: "6 5",
                    }).addTo(map);
                } else {
                    L.polyline(
                        [[Number(from.latitude), Number(from.longitude)], [Number(to.latitude), Number(to.longitude)]],
                        {
                            color,
                            weight: mode === "walking" ? 2 : 3,
                            opacity: 0.75,
                            dashArray: isDashed ? "6 5" : mode === "walking" ? "3 4" : undefined,
                        }
                    ).addTo(map);
                }

                // Transport mode label at midpoint
                const midLat = (Number(from.latitude) + Number(to.latitude)) / 2;
                const midLng = (Number(from.longitude) + Number(to.longitude)) / 2;
                const label = TRANSPORT_LABELS[mode] ?? "";
                L.marker([midLat, midLng], {
                    icon: L.divIcon({
                        html: `<div style="
              background:${color};color:white;
              font-size:10px;font-weight:700;
              padding:2px 7px;border-radius:20px;
              white-space:nowrap;
              box-shadow:0 2px 8px rgba(0,0,0,0.18);
              border:1.5px solid white;
            ">${label}</div>`,
                        className: "",
                        iconAnchor: [30, 10],
                    }),
                    interactive: false,
                }).addTo(map);
            }

            // Day pins
            days.forEach((day, idx) => {
                const lat = Number(day.latitude);
                const lng = Number(day.longitude);
                const isFirst = idx === 0;
                const isLast  = idx === days.length - 1;

                const icon = L.divIcon({
                    html: `<div style="
            width:36px;height:44px;
            filter:drop-shadow(0 3px 8px rgba(14,133,178,0.45));
            position:relative;
          ">
            <svg viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 0C11.37 0 6 5.37 6 12c0 9 12 32 12 32S30 21 30 12C30 5.37 24.63 0 18 0z"
                fill="${isFirst ? "#10B981" : isLast ? "#EF4444" : "#1E9DC8"}"
                stroke="white" stroke-width="1.5"/>
              <circle cx="18" cy="12" r="8" fill="white"/>
              <text x="18" y="16" text-anchor="middle"
                font-size="9" font-weight="800"
                fill="${isFirst ? "#10B981" : isLast ? "#EF4444" : "#1E9DC8"}"
                font-family="system-ui,sans-serif">${day.day}</text>
            </svg>
          </div>`,
                    className: "",
                    iconSize:    [36, 44],
                    iconAnchor:  [18, 44],
                    popupAnchor: [0, -46],
                });

                const marker = L.marker([lat, lng], { icon }).addTo(map);

                const popupContent = `
          <div style="font-family:'Lato',system-ui,sans-serif;min-width:180px;max-width:220px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
              <div style="
                min-width:20px;height:20px;border-radius:50%;
                background:${isFirst?"#10B981":isLast?"#EF4444":"#1E9DC8"};
                color:white;font-size:9px;font-weight:800;
                display:flex;align-items:center;justify-content:center;
                flex-shrink:0;
              ">${day.day}</div>
              <div style="font-size:11px;font-weight:700;color:#0A3D52;line-height:1.3">${day.title}</div>
            </div>
            <p style="font-size:11px;color:#1A6A8A;line-height:1.5;margin:0">${day.description.slice(0, 120)}${day.description.length > 120 ? "…" : ""}</p>
            ${day.transportMode && idx > 0 ? `
              <div style="margin-top:6px;display:inline-flex;align-items:center;gap:4px;background:${TRANSPORT_COLORS[day.transportMode]}18;border-radius:20px;padding:2px 8px">
                <span style="font-size:10px">${TRANSPORT_LABELS[day.transportMode]}</span>
              </div>` : ""}
          </div>`;

                marker.bindPopup(popupContent, { closeButton: false, offset: [0, -6], maxWidth: 240 });
                marker.on("mouseover", () => marker.openPopup());
                marker.on("mouseout",  () => marker.closePopup());
            });

            setReady(true);
        };

        load().catch(console.error);
        return () => {
            if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
        };
    }, [days.length]);

    if (days.length === 0) return null;

    return (
        <div className="rounded-2xl overflow-hidden border border-[rgba(14,133,178,0.12)] shadow-[0_4px_24px_rgba(14,133,178,0.07)]">
            {/* Header */}
            <div className="flex items-center justify-between bg-white px-4 py-3 border-b border-[rgba(14,133,178,0.08)]">
                <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#28B8E8] to-[#0A6A94]">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                            <path d="M2 6 C2 3 10 3 10 6 S2 9 2 6"/>
                            <circle cx="2" cy="6" r="1.2" fill="white" stroke="none"/>
                            <circle cx="10" cy="6" r="1.2" fill="white" stroke="none"/>
                        </svg>
                    </div>
                    <span className="text-sm font-semibold text-[#0A3D52]">Tour route</span>
                    <span className="text-xs font-light text-[#1A6A8A]">· {days.length} stops</span>
                </div>
                <div className="flex items-center gap-3">
                    {/* Legend */}
                    {Object.entries(TRANSPORT_COLORS).filter(([mode]) =>
                        days.slice(1).some(d => (d.transportMode ?? "driving") === mode)
                    ).map(([mode, color]) => (
                        <div key={mode} className="flex items-center gap-1">
                            <div style={{ width:16, height:2, borderRadius:2,
                                borderTop: mode==="flying"||mode==="boat" ? `2px dashed ${color}` : undefined,
                                background: mode==="flying"||mode==="boat" ? "transparent" : color,
                            }}/>
                            <span className="text-[0.62rem] text-[#1A6A8A] capitalize">{mode}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Map */}
            <div className="relative" style={{ height: 420 }}>
                <div ref={containerRef} style={{ width:"100%", height:"100%" }}/>
                {!ready && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#EBF8FF] z-10">
                        <div className="flex flex-col items-center gap-2">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[rgba(14,133,178,0.2)] border-t-[#1E9DC8]"/>
                            <span className="text-xs text-[#1A6A8A]">Loading route map…</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Day stops list */}
            <div className="bg-[#F8FCFF] border-t border-[rgba(14,133,178,0.08)] px-4 py-3">
                <div className="flex gap-0 overflow-x-auto hide-scrollbar">
                    {days.map((day, idx) => {
                        const isFirst = idx === 0;
                        const isLast  = idx === days.length - 1;
                        const mode    = day.transportMode;
                        const color   = isFirst ? "#10B981" : isLast ? "#EF4444" : "#1E9DC8";
                        return (
                            <div key={day.day} className="flex items-center flex-shrink-0">
                                <div className="flex flex-col items-center" style={{ minWidth: 80, maxWidth: 100 }}>
                                    <div style={{ width:24, height:24, borderRadius:"50%", background:color, color:"white", fontSize:9, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, border:"2px solid white", boxShadow:"0 2px 8px rgba(14,133,178,0.25)" }}>
                                        {day.day}
                                    </div>
                                    <div className="text-center mt-1.5 px-1">
                                        <div className="text-[0.6rem] font-bold text-[#0A3D52] leading-tight line-clamp-2">{day.title}</div>
                                    </div>
                                </div>
                                {idx < days.length - 1 && mode && (
                                    <div className="flex flex-col items-center mx-1 flex-shrink-0" style={{ width: 48 }}>
                                        <div style={{ width:"100%", height:2, background:TRANSPORT_COLORS[days[idx+1]?.transportMode ?? "driving"] ?? "#1E9DC8", borderRadius:2, opacity:0.7, borderTop: days[idx+1]?.transportMode === "flying" ? "2px dashed" : undefined }}/>
                                        <div className="text-[0.55rem] text-[#1A6A8A] mt-0.5 text-center leading-none" style={{ whiteSpace:"nowrap" }}>
                                            {days[idx+1]?.transportMode ?? "drive"}
                                        </div>
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