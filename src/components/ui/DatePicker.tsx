// components/ui/DatePicker.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type DatePickerProps = {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    minDate?: string;
    maxDate?: string;
    hasError?: boolean;
    error?: boolean;        // alias so both props work
    className?: string;
};

const MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
];
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function pad(n: number) { return String(n).padStart(2, "0"); }
function toISO(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
function formatDisplay(iso: string) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d} ${MONTHS[+m - 1].slice(0, 3)} ${y}`;
}

export default function DatePicker({
                                       value, onChange, placeholder = "Select date",
                                       minDate, maxDate, hasError = false, error = false, className = "",
                                   }: DatePickerProps) {
    const ref  = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);

    const today = new Date();
    const [viewing, setViewing] = useState({
        y: value ? +value.split("-")[0] : today.getFullYear(),
        m: value ? +value.split("-")[1] - 1 : today.getMonth(),
    });

    const isErrored = hasError || error;

    useEffect(() => {
        if (value) setViewing({ y: +value.split("-")[0], m: +value.split("-")[1] - 1 });
    }, [value]);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    function navigate(dir: number) {
        setViewing(v => {
            let m = v.m + dir, y = v.y;
            if (m > 11) { m = 0; y++; }
            if (m < 0)  { m = 11; y--; }
            return { y, m };
        });
    }

    function pick(iso: string) { onChange(iso); setOpen(false); }

    const { y, m } = viewing;
    const firstDay    = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const todayISO    = toISO(today.getFullYear(), today.getMonth(), today.getDate());

    // Border / ring classes for the trigger
    const triggerBorder = open
        ? "border-cyan-600 ring-2 ring-cyan-600/10"
        : isErrored
            ? "border-red-400 ring-2 ring-red-400/10"
            : "border-gray-200 hover:border-cyan-600";

    return (
        <div ref={ref} className={`relative ${className}`}>

            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className={`flex items-center justify-between gap-2 w-full h-9 px-3 bg-white border rounded-md text-sm cursor-pointer select-none transition-all duration-150 ${triggerBorder} ${value ? "text-gray-800" : "text-gray-400"}`}
            >
                <span className={isErrored && !value ? "text-red-400" : undefined}>
                    {value ? formatDisplay(value) : placeholder}
                </span>
                <svg
                    className={`w-3.5 h-3.5 flex-shrink-0 ${isErrored && !value ? "opacity-60 text-red-400" : "opacity-50"}`}
                    viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
                >
                    <rect x="2" y="3" width="12" height="11" rx="2"/>
                    <path d="M5 1v4M11 1v4M2 7h12"/>
                </svg>
            </button>

            {/* Calendar */}
            {open && (
                <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-64 bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">

                    {/* Month nav */}
                    <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
                        <button type="button" onClick={() => navigate(-1)}
                                className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 transition-colors">
                            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M8 2L4 6l4 4"/>
                            </svg>
                        </button>
                        <span className="text-sm font-medium text-gray-800">{MONTHS[m]} {y}</span>
                        <button type="button" onClick={() => navigate(1)}
                                className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 transition-colors">
                            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M4 2l4 4-4 4"/>
                            </svg>
                        </button>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-7 gap-px p-2">
                        {DAYS.map(d => (
                            <div key={d} className="text-[11px] text-gray-400 text-center py-1 font-medium">{d}</div>
                        ))}
                        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`}/>)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day        = i + 1;
                            const iso        = toISO(y, m, day);
                            const isSelected = iso === value;
                            const isToday    = iso === todayISO;
                            const isDisabled = !!(minDate && iso < minDate) || !!(maxDate && iso > maxDate);
                            return (
                                <button key={day} type="button" disabled={isDisabled} onClick={() => pick(iso)}
                                        className={`text-[13px] text-center py-1.5 rounded-md w-full transition-colors ${
                                            isSelected  ? "bg-cyan-600 text-white font-medium" :
                                                isToday     ? "text-cyan-600 font-semibold hover:bg-gray-100" :
                                                    isDisabled  ? "text-gray-300 cursor-not-allowed" :
                                                        "text-gray-700 hover:bg-gray-100"
                                        }`}>
                                    {day}
                                </button>
                            );
                        })}
                    </div>

                    {/* Clear */}
                    {value && (
                        <div className="border-t border-gray-100 px-3 py-2">
                            <button type="button" onClick={() => { onChange(""); setOpen(false); }}
                                    className="text-xs text-gray-400 hover:text-red-400 transition-colors">
                                Clear date
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}