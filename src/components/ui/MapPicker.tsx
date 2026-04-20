"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
    latitude:  number | string;
    longitude: number | string;
    onChange:  (lat: number, lng: number) => void;
};

export default function MapPicker({ latitude, longitude, onChange }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef       = useRef<any>(null);
    const markerRef    = useRef<any>(null);
    const [ready, setReady] = useState(false);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
        latitude && longitude && latitude !== "" && longitude !== ""
            ? { lat: Number(latitude), lng: Number(longitude) }
            : null
    );

    // Ethiopia center
    const DEFAULT_LAT = 9.145;
    const DEFAULT_LNG = 40.489;

    useEffect(() => {
        if (mapRef.current || !containerRef.current) return;

        // Dynamically load Leaflet CSS + JS
        const loadLeaflet = async () => {
            // CSS
            if (!document.getElementById("leaflet-css")) {
                const link = document.createElement("link");
                link.id   = "leaflet-css";
                link.rel  = "stylesheet";
                link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
                document.head.appendChild(link);
            }

            // JS
            if (!(window as any).L) {
                await new Promise<void>((resolve, reject) => {
                    const s = document.createElement("script");
                    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
                    s.onload = () => resolve();
                    s.onerror = reject;
                    document.head.appendChild(s);
                });
            }

            const L = (window as any).L;

            const initLat = coords ? coords.lat : DEFAULT_LAT;
            const initLng = coords ? coords.lng : DEFAULT_LNG;

            const map = L.map(containerRef.current!, {
                center: [initLat, initLng],
                zoom:   coords ? 10 : 6,
                zoomControl: true,
                attributionControl: false,
            });

            mapRef.current = map;

            // OpenStreetMap tiles
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 18,
            }).addTo(map);

            // Custom marker icon
            const icon = L.divIcon({
                html: `
          <div style="
            width:32px;height:40px;position:relative;filter:drop-shadow(0 3px 6px rgba(14,133,178,0.5));
          ">
            <svg viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C9.373 0 4 5.373 4 12c0 8 12 28 12 28S28 20 28 12C28 5.373 22.627 0 16 0z"
                fill="url(#mg)" stroke="white" stroke-width="1.5"/>
              <circle cx="16" cy="12" r="5" fill="white"/>
              <defs>
                <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#28B8E8"/>
                  <stop offset="100%" stop-color="#0A6A94"/>
                </linearGradient>
              </defs>
            </svg>
          </div>`,
                className: "",
                iconSize:    [32, 40],
                iconAnchor:  [16, 40],
                popupAnchor: [0, -42],
            });

            // Place initial marker if coordinates exist
            if (coords) {
                markerRef.current = L.marker([coords.lat, coords.lng], { icon, draggable: true }).addTo(map);
                markerRef.current.on("dragend", (e: any) => {
                    const pos = e.target.getLatLng();
                    const lat = parseFloat(pos.lat.toFixed(6));
                    const lng = parseFloat(pos.lng.toFixed(6));
                    setCoords({ lat, lng });
                    onChange(lat, lng);
                });
            }

            // Click to place / move marker
            map.on("click", (e: any) => {
                const lat = parseFloat(e.latlng.lat.toFixed(6));
                const lng = parseFloat(e.latlng.lng.toFixed(6));

                if (markerRef.current) {
                    markerRef.current.setLatLng([lat, lng]);
                } else {
                    markerRef.current = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
                    markerRef.current.on("dragend", (ev: any) => {
                        const pos = ev.target.getLatLng();
                        const la = parseFloat(pos.lat.toFixed(6));
                        const lo = parseFloat(pos.lng.toFixed(6));
                        setCoords({ lat: la, lng: lo });
                        onChange(la, lo);
                    });
                }

                setCoords({ lat, lng });
                onChange(lat, lng);
            });

            setReady(true);
        };

        loadLeaflet().catch(console.error);

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current   = null;
                markerRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync external coordinate changes into the map (e.g. form reset)
    useEffect(() => {
        if (!mapRef.current || !ready) return;
        const L = (window as any).L;
        if (!L) return;

        const newLat = latitude !== "" ? Number(latitude) : null;
        const newLng = longitude !== "" ? Number(longitude) : null;

        if (newLat !== null && newLng !== null && !isNaN(newLat) && !isNaN(newLng)) {
            if (markerRef.current) {
                markerRef.current.setLatLng([newLat, newLng]);
            }
            setCoords({ lat: newLat, lng: newLng });
        } else if (newLat === null && newLng === null) {
            if (markerRef.current) {
                mapRef.current.removeLayer(markerRef.current);
                markerRef.current = null;
            }
            setCoords(null);
        }
    }, [latitude, longitude, ready]);

    function clearMarker() {
        if (markerRef.current && mapRef.current) {
            mapRef.current.removeLayer(markerRef.current);
            markerRef.current = null;
        }
        setCoords(null);
        onChange(0, 0);
    }

    return (
        <div className="flex flex-col gap-2">
            {/* Map container */}
            <div className="relative rounded-xl overflow-hidden border border-slate-200" style={{ height: 320 }}>
                <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

                {/* Loading state */}
                {!ready && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
                        <div className="flex flex-col items-center gap-2">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-500" />
                            <span className="text-xs text-slate-400">Loading map…</span>
                        </div>
                    </div>
                )}

                {/* Hint overlay — shown until first click */}
                {ready && !coords && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[500] pointer-events-none">
                        <div className="flex items-center gap-1.5 rounded-full bg-[#0A3D52]/80 px-3 py-1.5 text-white text-xs font-medium backdrop-blur-sm shadow-lg">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                <path d="M6 1C4.34 1 3 2.34 3 4c0 2.54 3 7 3 7s3-4.46 3-7c0-1.66-1.34-3-3-3z"/>
                                <circle cx="6" cy="4" r="1"/>
                            </svg>
                            Click anywhere on the map to pin location
                        </div>
                    </div>
                )}

                {/* Zoom reset button */}
                {ready && (
                    <button
                        type="button"
                        onClick={() => mapRef.current?.setView([DEFAULT_LAT, DEFAULT_LNG], 6)}
                        className="absolute top-2 right-2 z-[500] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[0.68rem] font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
                    >
                        🇪🇹 Ethiopia
                    </button>
                )}
            </div>

            {/* Coordinate display + clear */}
            {coords ? (
                <div className="flex items-center justify-between rounded-lg border border-[rgba(14,133,178,0.18)] bg-[#F0F9FF] px-3 py-2">
                    <div className="flex items-center gap-3 text-sm">
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#1E9DC8" strokeWidth="1.8" strokeLinecap="round">
                            <path d="M7 1C4.79 1 3 2.79 3 5c0 3.18 4 8 4 8s4-4.82 4-8c0-2.21-1.79-4-4-4z"/>
                            <circle cx="7" cy="5" r="1.2"/>
                        </svg>
                        <span className="font-mono text-[0.78rem] text-[#0A3D52]">
              {coords.lat.toFixed(6)},  {coords.lng.toFixed(6)}
            </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[0.7rem] font-medium text-[#1E9DC8] hover:underline"
                        >
                            View in Maps ↗
                        </a>
                        <button
                            type="button"
                            onClick={clearMarker}
                            className="text-slate-400 hover:text-red-400 transition-colors ml-1"
                            title="Clear location"
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                <path d="M2 2l10 10M12 2L2 12"/>
                            </svg>
                        </button>
                    </div>
                </div>
            ) : (
                <p className="text-[0.72rem] font-light text-slate-400 px-1">
                    No location set — click the map to place a pin. You can drag it to adjust.
                </p>
            )}
        </div>
    );
}