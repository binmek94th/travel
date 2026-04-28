// src/components/AIPlannerButton.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import AIPlannerDialog from "./AIPlannerDialog";

type Destination = { id: string; name: string; region: string; categories: string[]; description: string; images: string[]; avgRating: number };
type Tour        = { id: string; title: string; priceUSD: number; durationDays: number; categories: string[]; description: string; images: string[]; avgRating: number; region: string };

export default function AIPlannerButton({ destinations, tours }: {
    destinations: Destination[]; tours: Tour[];
}) {
    const [open,    setOpen]    = useState(false);
    const [visible, setVisible] = useState(false);
    const [hovered, setHovered] = useState(false);

    // Fade in button after mount
    useEffect(() => { setTimeout(() => setVisible(true), 800); }, []);

    return (
        <>
            <style>{`
        @keyframes planner-pulse { 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(1.6);opacity:0} }
        @keyframes btn-in { from{opacity:0;transform:translateY(16px) scale(0.9)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>

            {/* Floating button */}
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    title="AI Journey Planner"
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    style={{
                        position:    "fixed", bottom:24, right:24, zIndex:300,
                        width:       54, height:54, borderRadius:"50%",
                        background:  "linear-gradient(135deg,#28B8E8,#0A6A94)",
                        border:      "none", cursor:"pointer",
                        display:     "flex", alignItems:"center", justifyContent:"center",
                        boxShadow:   hovered ? "0 10px 36px rgba(14,133,178,0.55)" : "0 6px 24px rgba(14,133,178,0.40)",
                        transform:   hovered ? "scale(1.08) translateY(-2px)" : "scale(1)",
                        opacity:     visible ? 1 : 0,
                        animation:   visible ? "btn-in 0.5s cubic-bezier(0.22,1,0.36,1) both" : "none",
                        transition:  "transform 0.2s cubic-bezier(0.22,1,0.36,1), box-shadow 0.2s",
                    }}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/>
                        <path d="M8 11h8M8 15h5"/>
                    </svg>
                    {/* Pulse rings */}
                    <span style={{ position:"absolute", inset:-5, borderRadius:"50%", border:"2px solid rgba(40,184,232,0.45)", animation:"planner-pulse 2s ease-out infinite", pointerEvents:"none" }}/>
                    <span style={{ position:"absolute", inset:-5, borderRadius:"50%", border:"2px solid rgba(40,184,232,0.25)", animation:"planner-pulse 2s ease-out 0.6s infinite", pointerEvents:"none" }}/>
                    {/* Tooltip */}
                    {hovered && (
                        <div style={{ position:"absolute", right:"calc(100% + 10px)", top:"50%", transform:"translateY(-50%)", background:"linear-gradient(135deg,#0A3D52,#0E85B2)", color:"white", fontSize:"0.72rem", fontWeight:600, padding:"5px 10px", borderRadius:8, whiteSpace:"nowrap", boxShadow:"0 4px 14px rgba(14,133,178,0.30)", pointerEvents:"none", animation:"chip-in 0.2s ease both" }}>
                            ✨ AI Journey Planner
                            <div style={{ position:"absolute", right:-5, top:"50%", transform:"translateY(-50%)", width:0, height:0, borderTop:"5px solid transparent", borderBottom:"5px solid transparent", borderLeft:"5px solid #0E85B2" }}/>
                        </div>
                    )}
                </button>
            )}

            <AIPlannerDialog
                open={open}
                onClose={() => setOpen(false)}
                destinations={destinations}
                tours={tours}
            />
        </>
    );
}