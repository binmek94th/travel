"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export type DropdownOption = {
    label: string;
    value: string;
    badge?: string | number;
};

type DropdownProps = {
    options: DropdownOption[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchable?: boolean;
    className?: string;
    width?: string;
};

export default function Dropdown({
                                     options,
                                     value,
                                     onChange,
                                     placeholder = "Select...",
                                     searchable = false,
                                     className = "",
                                     width = "w-44",
                                 }: DropdownProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    const selected = options?.find((o) => o.value === value);

    const filtered = searchable
        ? options?.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
        : options;

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} className={`relative inline-block ${width} ${className}`}>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={`
          flex items-center justify-between gap-2 w-full h-9 px-3
          bg-white border rounded-md text-sm text-gray-800
          transition-all duration-150 cursor-pointer select-none
          ${open
                    ? "border-cyan-600 ring-2 ring-cyan-600/10"
                    : "border-gray-200 hover:border-cyan-600"
                }
        `}
            >
        <span className={selected ? "text-gray-800" : "text-gray-400"}>
          {selected ? selected.label : placeholder}
        </span>
                <ChevronDown
                    size={14}
                    strokeWidth={2}
                    className={`text-gray-400 flex-shrink-0 transition-transform duration-150 ${
                        open ? "rotate-180" : ""
                    }`}
                />
            </button>

            {/* Menu */}
            {open && (
                <div className="absolute z-50 top-[calc(100%+4px)] left-0 right-0 bg-white border border-gray-200 rounded-md shadow-md overflow-hidden">
                    {searchable && (
                        <div className="p-2 border-b border-gray-100">
                            <input
                                autoFocus
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="Search..."
                                className="w-full h-8 px-2 text-sm bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-cyan-600"
                            />
                        </div>
                    )}

                    {filtered.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-gray-400">No results</p>
                    ) : (
                        filtered.map((option, i) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setOpen(false);
                                    setQuery("");
                                }}
                                className={`
                  flex items-center gap-2 w-full px-3 py-2 text-sm text-left
                  transition-colors duration-100 cursor-pointer
                  ${value === option.value
                                    ? "text-cyan-600 font-medium bg-cyan-600/5"
                                    : "text-gray-800 hover:bg-gray-50"
                                }
                `}
                            >
                                <span className="flex-1">{option.label}</span>
                                {option.badge !== undefined && (
                                    <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-cyan-600/10 text-cyan-600 font-medium">
                    {option.badge}
                  </span>
                                )}
                                {value === option.value && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 flex-shrink-0" />
                                )}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}