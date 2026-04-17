// components/admin/DeleteDialog.tsx
"use client";

import { useState } from "react";
import { Btn } from "@/src/components/admin/ui";

type DeleteDialogProps = {
    open: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    title?: string;
    description?: string;
    confirmLabel?: string;
    // Pass the item name to require typed confirmation for destructive deletes
    requireConfirmText?: string;
};

export default function DeleteDialog({
                                         open,
                                         onClose,
                                         onConfirm,
                                         title = "Delete this item?",
                                         description = "This action cannot be undone.",
                                         confirmLabel = "Delete",
                                         requireConfirmText,
                                     }: DeleteDialogProps) {
    const [typed,   setTyped]   = useState("");
    const [loading, setLoading] = useState(false);

    if (!open) return null;

    const isConfirmed = requireConfirmText
        ? typed.trim().toLowerCase() === requireConfirmText.trim().toLowerCase()
        : true;

    async function handleConfirm() {
        if (!isConfirmed) return;
        setLoading(true);
        try {
            await onConfirm();
            onClose();
        } finally {
            setLoading(false);
            setTyped("");
        }
    }

    function handleClose() {
        if (loading) return;
        setTyped("");
        onClose();
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]"
                onClick={handleClose}
            />

            {/* Dialog */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                    className="pointer-events-auto w-full max-w-sm bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Top accent bar */}
                    <div className="h-1 w-full bg-red-500" />

                    <div className="p-6 flex flex-col gap-4">
                        {/* Icon + title */}
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg
                                    className="w-4 h-4 text-red-500"
                                    viewBox="0 0 20 20" fill="none"
                                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                                >
                                    <path d="M10 6v4M10 14h.01" strokeWidth="2" />
                                    <circle cx="10" cy="10" r="8" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
                                <p className="text-sm text-slate-500 mt-0.5">{description}</p>
                            </div>
                        </div>

                        {/* Typed confirmation */}
                        {requireConfirmText && (
                            <div className="flex flex-col gap-1.5">
                                <p className="text-xs text-slate-500">
                                    Type{" "}
                                    <span className="font-semibold text-slate-700 font-mono">
                    {requireConfirmText}
                  </span>{" "}
                                    to confirm
                                </p>
                                <input
                                    type="text"
                                    value={typed}
                                    onChange={e => setTyped(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleConfirm()}
                                    placeholder={requireConfirmText}
                                    className={`
                    w-full h-9 px-3 text-sm rounded-lg border outline-none transition-colors
                    ${isConfirmed
                                        ? "border-red-300 focus:border-red-400 bg-red-50/40"
                                        : "border-slate-200 focus:border-slate-400 bg-white"
                                    }
                  `}
                                    autoFocus
                                />
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-1">
                            <Btn variant="ghost" onClick={handleClose} disabled={loading}>
                                Cancel
                            </Btn>
                            <button
                                onClick={handleConfirm}
                                disabled={!isConfirmed || loading}
                                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                  transition-all duration-150
                  ${isConfirmed && !loading
                                    ? "bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                                    : "bg-red-100 text-red-300 cursor-not-allowed"
                                }
                `}
                            >
                                {loading ? (
                                    <>
                                        <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                                        </svg>
                                        Deleting…
                                    </>
                                ) : confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}