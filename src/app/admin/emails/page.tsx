"use client";

import { useState, useEffect } from "react";
import {
    collection, query, orderBy, limit, onSnapshot, Timestamp,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { CampaignComposer } from "./CampaignComposer";

type EmailLog = {
    id:         string;
    type:       string;
    to:         string;
    success:    boolean;
    error?:     string;
    messageId?: string;
    bookingId?: string;
    userId?:    string;
    sentAt:     Timestamp | null;
};

function relTime(ts: Timestamp | null): string {
    if (!ts) return "—";
    const s = Math.floor((Date.now() - ts.toMillis()) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return ts.toDate().toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
}

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    welcome:            { label:"Welcome",    color:"text-cyan-600",    bg:"bg-cyan-50"    },
    booking_confirmed:  { label:"Confirmed",  color:"text-emerald-600", bg:"bg-emerald-50" },
    booking_cancelled:  { label:"Cancelled",  color:"text-red-500",     bg:"bg-red-50"     },
    booking_reminder:   { label:"Reminder",   color:"text-amber-600",   bg:"bg-amber-50"   },
    marketing_campaign: { label:"Campaign",   color:"text-violet-600",  bg:"bg-violet-50"  },
};

function TypeBadge({ type }: { type: string }) {
    const meta = TYPE_LABELS[type] ?? { label: type, color:"text-slate-600", bg:"bg-slate-50" };
    return (
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
      {meta.label}
    </span>
    );
}

export default function AdminEmailPage() {
    const [logs, setLogs]           = useState<EmailLog[]>([]);
    const [loading, setLoading]     = useState(true);
    const [showComposer, setCompose]= useState(false);
    const [reminderLoading, setRL]  = useState(false);
    const [reminderResult, setRR]   = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, "emailLogs"), orderBy("sentAt", "desc"), limit(80));
        const unsub = onSnapshot(q, snap => {
            setLogs(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<EmailLog,"id">) })));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    async function triggerReminders() {
        setRL(true); setRR(null);
        const res  = await fetch("/api/admin/email/reminders", { method: "POST" });
        const data = await res.json();
        setRR(`Sent ${data.sent ?? 0} reminder${(data.sent ?? 0) !== 1 ? "s" : ""}`);
        setRL(false);
    }

    const total     = logs.length;
    const success   = logs.filter(l => l.success).length;
    const campaigns = logs.filter(l => l.type === "marketing_campaign").length;
    const rate      = total > 0 ? Math.round((success / total) * 100) : 0;

    return (
        <>
            <div className="flex flex-col gap-6">

                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h2 className="text-2xl font-light text-slate-800" style={{ fontFamily:"'Playfair Display',serif" }}>
                            Email Marketing
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">{total} emails sent · {rate}% delivery rate</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={triggerReminders} disabled={reminderLoading}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors disabled:opacity-60">
                            {reminderLoading ? "Sending…" : "⏰ Send reminders"}
                        </button>
                        <button onClick={() => setCompose(true)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl transition-colors">
                            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M8 2v12M2 8h12"/>
                            </svg>
                            New campaign
                        </button>
                    </div>
                </div>

                {reminderResult && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm font-medium text-emerald-700">
                        ✓ {reminderResult}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                    {[
                        { label:"Total sent",  val: total,           color:"text-slate-800",   bg:"bg-slate-50"   },
                        { label:"Delivered",   val: success,         color:"text-emerald-600", bg:"bg-emerald-50" },
                        { label:"Failed",      val: total - success, color:"text-red-500",     bg:"bg-red-50"     },
                        { label:"Campaigns",   val: campaigns,       color:"text-violet-600",  bg:"bg-violet-50"  },
                    ].map(s => (
                        <div key={s.label} className={`${s.bg} rounded-xl border border-slate-100 px-4 py-3`}>
                            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{s.label}</div>
                            <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.val}</div>
                        </div>
                    ))}
                </div>

                {/* Log table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-800" style={{ fontFamily:"'Playfair Display',serif" }}>Send log</p>
                        <span className="text-xs text-slate-400">Last 80 entries · live</span>
                    </div>

                    {loading ? (
                        <div className="py-16 flex items-center justify-center">
                            <div className="w-5 h-5 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin"/>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="py-16 flex flex-col items-center gap-2 text-slate-400">
                            <svg className="w-8 h-8 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                                <path strokeLinecap="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                            </svg>
                            <p className="text-sm">No emails sent yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                <tr className="border-b border-slate-100">
                                    {["Type","Recipient","Status","Sent"].map(h => (
                                        <th key={h} className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">{h}</th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                {logs.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-5 py-3"><TypeBadge type={log.type}/></td>
                                        <td className="px-5 py-3 text-slate-600 text-xs font-mono truncate max-w-[180px]">{log.to}</td>
                                        <td className="px-5 py-3">
                                            {log.success ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>Delivered
                          </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500" title={log.error}>
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"/>Failed
                          </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 text-xs text-slate-400 whitespace-nowrap">{relTime(log.sentAt)}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Full-screen composer — rendered outside the card flow */}
            {showComposer && <CampaignComposer onClose={() => setCompose(false)}/>}
        </>
    );
}