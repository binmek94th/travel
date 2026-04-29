"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Badge, Btn, Table, Th, Td, Pagination, Card, Tabs, AvatarCell, EmptyState,
} from "@/src/components/admin/ui";
import { BookingDetailPanel, type BookingDetail } from "./BookingDetailPanel";

// ─── Actual Firestore booking schema ─────────────────────────────────────────
export type Booking = {
  id: string;

  // Relations
  tourId: string;
  operatorId: string;
  userId?: string;          // primary traveler link (check your writes)
  travelerId?: string;      // alternate field name

  // Amounts (real field names from Firestore)
  totalAmountUSD: number;
  depositAmountUSD?: number;
  depositPaid?: boolean;
  remainingAmountUSD?: number;
  remainingPaid?: boolean;

  // Status — "pending_payment" is your actual initial status
  status: string;
  paymentProvider?: string;
  paymentRef?: string;

  // Trip
  startDate: string;
  endDate?: string;
  travelers?: number;       // group size
  specialRequests?: string;
  emergencyName?: string;
  emergencyPhone?: string;

  // Timestamps (ISO strings from Firestore)
  createdAt: string;
  updatedAt?: string;

  // ── Server-enriched (batch-fetched in the Server Component) ──────────────
  travelerName?: string;
  travelerEmail?: string;
  travelerPhone?: string;
  travelerAvatarUrl?: string;
  travelerCountry?: string;
  tourTitle?: string;
  tourCoverUrl?: string;
  tourDuration?: number;
  operatorName?: string;
  timeline?: { label: string; at: string }[];
};

// ─── Which statuses allow confirmation / cancellation ─────────────────────────
const CONFIRMABLE = new Set(["paid", "pending_payment"]);
const CANCELLABLE  = new Set(["confirmed", "active", "paid", "pending_payment"]);

// ─── Status tabs (includes your actual status) ────────────────────────────────
const STATUS_TABS = [
  { value: "all",             label: "All"             },
  { value: "pending_payment", label: "Pending Payment" },
  { value: "paid",            label: "Paid"            },
  { value: "confirmed",       label: "Confirmed"       },
  { value: "active",          label: "Active"          },
  { value: "completed",       label: "Completed"       },
  { value: "cancelled",       label: "Cancelled"       },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTravelerId(b: Booking) {
  return b.userId ?? b.travelerId ?? "";
}

function toDetail(b: Booking): BookingDetail {
  return {
    id:               b.id,
    travelerId:       getTravelerId(b),
    travelerName:     b.travelerName,
    travelerEmail:    b.travelerEmail,
    travelerPhone:    b.travelerPhone,
    travelerAvatarUrl:b.travelerAvatarUrl,
    travelerCountry:  b.travelerCountry,

    tourId:           b.tourId,
    tourTitle:        b.tourTitle,
    tourCoverUrl:     b.tourCoverUrl,
    tourDuration:     b.tourDuration,
    operatorId:       b.operatorId,
    operatorName:     b.operatorName,

    totalAmountUSD:   b.totalAmountUSD,
    depositAmountUSD: b.depositAmountUSD,
    depositPaid:      b.depositPaid,
    remainingAmountUSD: b.remainingAmountUSD,
    remainingPaid:    b.remainingPaid,

    status:           b.status,
    paymentProvider:  b.paymentProvider ?? "stripe",
    paymentRef:       b.paymentRef,

    startDate:        b.startDate,
    endDate:          b.endDate,
    groupSize:        b.travelers,
    specialRequests:  b.specialRequests,
    emergencyName:    b.emergencyName,
    emergencyPhone:   b.emergencyPhone,

    createdAt:        b.createdAt,
    updatedAt:        b.updatedAt,
    timeline:         b.timeline,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingsClient({
                                         bookings,
                                         stats,
                                       }: {
  bookings: Booking[];
  stats: { pending: number; confirmed: number; cancelled: number; revenueUSD: number };
}) {
  const router = useRouter();
  const [statusFilter, setStatus] = useState("all");
  const [search, setSearch]       = useState("");
  const [provider, setProvider]   = useState("all");
  const [selected, setSelected]   = useState<string[]>([]);
  const [page, setPage]           = useState(1);
  const [activeBooking, setActiveBooking] = useState<BookingDetail | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return bookings.filter(b => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (provider !== "all" && (b.paymentProvider ?? "stripe") !== provider) return false;
      if (q) {
        const traveler = (b.travelerName ?? b.travelerEmail ?? getTravelerId(b)).toLowerCase();
        const tour     = (b.tourTitle ?? b.tourId).toLowerCase();
        if (!traveler.includes(q) && !tour.includes(q)) return false;
      }
      return true;
    });
  }, [bookings, statusFilter, search, provider]);

  const pendingCount = bookings.filter(b => b.status === "pending_payment").length;
  const allSelected  = filtered.length > 0 && selected.length === filtered.length;

  async function transitionBooking(id: string, status: string, e: React.MouseEvent) {
    e.stopPropagation();
    await fetch(`/api/admin/bookings/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
      <>
        <div className="flex flex-col gap-6">

          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-light text-slate-800" style={{ fontFamily:"'Playfair Display',serif" }}>
                Bookings
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {bookings.length.toLocaleString()} bookings · ${stats.revenueUSD.toLocaleString()} confirmed revenue
              </p>
            </div>
            <Btn variant="ghost" size="sm">Export CSV</Btn>
          </div>

          {/* Stat strip */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Pending",   val: stats.pending,                           color: "text-amber-600",   bg: "bg-amber-50"   },
              { label: "Confirmed", val: stats.confirmed,                         color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Cancelled", val: stats.cancelled,                         color: "text-red-600",     bg: "bg-red-50"     },
              { label: "Revenue",   val: `$${stats.revenueUSD.toLocaleString()}`, color: "text-cyan-600",    bg: "bg-cyan-50"    },
            ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl border border-slate-100 px-4 py-3`}>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{s.label}</div>
                  <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.val}</div>
                </div>
            ))}
          </div>

          <Card>
            <Tabs
                tabs={STATUS_TABS.map(t => ({
                  ...t,
                  count: t.value === "pending_payment" ? pendingCount : undefined,
                }))}
                active={statusFilter}
                onChange={v => { setStatus(v); setPage(1); }}
            />

            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-52">
                  <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                    <circle cx="7" cy="7" r="5"/><path d="M12 12l3 3"/>
                  </svg>
                  <input
                      className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400"
                      placeholder="Search traveler or tour…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <select
                    className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-600 outline-none focus:border-cyan-400 cursor-pointer"
                    value={provider}
                    onChange={e => setProvider(e.target.value)}
                >
                  <option value="all">All providers</option>
                  <option value="stripe">Stripe</option>
                  <option value="chapa">Chapa</option>
                </select>
              </div>
              {selected.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{selected.length} selected</span>
                    <Btn variant="danger" size="sm">Bulk cancel</Btn>
                  </div>
              )}
            </div>

            <Table>
              <thead>
              <tr>
                <Th className="w-10">
                  <input type="checkbox" className="rounded accent-cyan-600"
                         checked={allSelected}
                         onChange={e => setSelected(e.target.checked ? filtered.map(b => b.id) : [])} />
                </Th>
                <Th>Traveler</Th>
                <Th>Tour</Th>
                <Th>Total</Th>
                <Th>Deposit</Th>
                <Th>Provider</Th>
                <Th>Start date</Th>
                <Th>Booked</Th>
                <Th>Status</Th>
                <Th className="w-28">Actions</Th>
              </tr>
              </thead>
              <tbody>
              {filtered.length === 0 ? (
                  <tr><td colSpan={10}>
                    <EmptyState
                        icon={<svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="14" height="14" rx="2"/><path d="M3 8h14M7 2v3M13 2v3"/></svg>}
                        title="No bookings found"
                    />
                  </td></tr>
              ) : filtered.map(b => {
                const displayName = b.travelerName || b.travelerEmail || "Unknown traveler";
                const isEnriched  = !!(b.travelerName || b.travelerEmail);

                return (
                    <tr
                        key={b.id}
                        className="hover:bg-slate-50/60 group transition-colors cursor-pointer"
                        onClick={() => setActiveBooking(toDetail(b))}
                    >
                      {/* Checkbox */}
                      <Td onClick={(e: any) => e.stopPropagation()}>
                        <input type="checkbox" className="rounded accent-cyan-600"
                               checked={selected.includes(b.id)}
                               onChange={e => setSelected(prev =>
                                   e.target.checked ? [...prev, b.id] : prev.filter(id => id !== b.id)
                               )} />
                      </Td>

                      {/* Traveler */}
                      <Td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600
                                        flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                            {displayName[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm truncate max-w-[130px] ${isEnriched ? "text-slate-700" : "text-slate-400 italic"}`}>
                              {isEnriched ? displayName : "Loading…"}
                            </p>
                            {b.travelerEmail && b.travelerName && (
                                <p className="text-[10px] text-slate-400 truncate max-w-[130px]">{b.travelerEmail}</p>
                            )}
                          </div>
                        </div>
                      </Td>

                      {/* Tour title */}
                      <Td className="max-w-[160px]">
                        {b.tourTitle ? (
                            <span className="text-sm text-slate-700 truncate block">{b.tourTitle}</span>
                        ) : (
                            <span className="text-xs text-slate-400 italic font-mono truncate block">
                          {b.tourId.slice(0, 14)}…
                        </span>
                        )}
                      </Td>

                      {/* Total */}
                      <Td className="font-bold text-slate-700 whitespace-nowrap">
                        ${b.totalAmountUSD.toLocaleString()}
                      </Td>

                      {/* Deposit breakdown */}
                      <Td>
                        {b.depositAmountUSD != null ? (
                            <div className="flex flex-col">
                              <span className="text-xs text-slate-600">${b.depositAmountUSD} paid</span>
                              {(b.remainingAmountUSD ?? 0) > 0 && (
                                  <span className={`text-[10px] font-semibold ${b.remainingPaid ? "text-emerald-600" : "text-amber-600"}`}>
                              ${b.remainingAmountUSD} {b.remainingPaid ? "✓ cleared" : "remaining"}
                            </span>
                              )}
                            </div>
                        ) : <span className="text-xs text-slate-300">—</span>}
                      </Td>

                      {/* Provider */}
                      <Td>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border
                        ${(b.paymentProvider ?? "stripe") === "stripe"
                          ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                          : "bg-green-50 text-green-600 border-green-200"}`}>
                        {((b.paymentProvider ?? "stripe")).charAt(0).toUpperCase()
                            + (b.paymentProvider ?? "stripe").slice(1)}
                      </span>
                      </Td>

                      <Td className="text-slate-400 text-xs whitespace-nowrap">{b.startDate}</Td>
                      <Td className="text-slate-400 text-xs whitespace-nowrap">{b.createdAt?.slice(0, 10)}</Td>
                      <Td><Badge status={b.status === "pending_payment" ? "Pending Payment" : b.status} /></Td>

                      {/* Actions */}
                      <Td onClick={(e: any) => e.stopPropagation()}>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {CONFIRMABLE.has(b.status) && (
                              <Btn
                                  variant="primary" size="sm"
                                  onClick={(e: any) => { e.stopPropagation(); setActiveBooking(toDetail(b)); }}
                              >
                                Confirm
                              </Btn>
                          )}
                          {CANCELLABLE.has(b.status) && (
                              <Btn
                                  variant="danger" size="sm"
                                  onClick={(e: any) => transitionBooking(b.id, "cancelled", e)}
                              >
                                Cancel
                              </Btn>
                          )}
                        </div>
                      </Td>
                    </tr>
                );
              })}
              </tbody>
            </Table>

            <Pagination
                total={filtered.length}
                showing={Math.min(filtered.length, 20)}
                page={page}
                perPage={20}
                onPage={setPage}
            />
          </Card>
        </div>

        {/* Detail slide-over */}
        <BookingDetailPanel
            booking={activeBooking}
            onClose={() => setActiveBooking(null)}
        />
      </>
  );
}