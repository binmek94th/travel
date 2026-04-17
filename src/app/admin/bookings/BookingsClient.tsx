"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Badge, Btn, Table, Th, Td, Pagination, Card, Tabs, AvatarCell, EmptyState,
} from "@/src/components/admin/ui";

type Booking = {
  id: string; travelerId: string; tourId: string; operatorId: string;
  totalUSD: number; totalETB: number; currency: string;
  status: string; paymentProvider: string; startDate: string; createdAt: string;
};

const STATUS_TABS = [
  { value: "all",       label: "All" },
  { value: "pending",   label: "Pending" },
  { value: "paid",      label: "Paid" },
  { value: "confirmed", label: "Confirmed" },
  { value: "active",    label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function BookingsClient({
  bookings, stats,
}: {
  bookings: Booking[];
  stats: { pending: number; confirmed: number; cancelled: number; revenueUSD: number };
}) {
  const router = useRouter();
  const [statusFilter, setStatus] = useState("all");
  const [selected, setSelected]   = useState<string[]>([]);
  const [page, setPage]           = useState(1);

  const filtered = useMemo(() =>
    bookings.filter(b => statusFilter === "all" || b.status === statusFilter),
  [bookings, statusFilter]);

  const allSelected = filtered.length > 0 && selected.length === filtered.length;

  async function transitionBooking(id: string, status: string) {
    await fetch(`/api/admin/bookings/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
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
          { label: "Pending",   val: stats.pending,                  color: "text-amber-600",  bg: "bg-amber-50"  },
          { label: "Confirmed", val: stats.confirmed,                color: "text-emerald-600",bg: "bg-emerald-50"},
          { label: "Cancelled", val: stats.cancelled,                color: "text-red-600",    bg: "bg-red-50"    },
          { label: "Revenue",   val: `$${stats.revenueUSD.toLocaleString()}`, color: "text-cyan-600", bg: "bg-cyan-50" },
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
            count: t.value === "pending" ? stats.pending : undefined,
          }))}
          active={statusFilter}
          onChange={setStatus}
        />

        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-52">
              <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="7" cy="7" r="5"/><path d="M12 12l3 3"/></svg>
              <input className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400" placeholder="Search traveler or tour…" />
            </div>
            <select className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-600 outline-none focus:border-cyan-400 cursor-pointer">
              <option>All providers</option>
              <option>Stripe</option>
              <option>Chapa</option>
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
              <Th>Amount</Th>
              <Th>Provider</Th>
              <Th>Start date</Th>
              <Th>Booked</Th>
              <Th>Status</Th>
              <Th className="w-32">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9}>
                <EmptyState
                  icon={<svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="14" height="14" rx="2"/><path d="M3 8h14M7 2v3M13 2v3"/></svg>}
                  title="No bookings found"
                />
              </td></tr>
            ) : filtered.map(b => (
              <tr key={b.id} className="hover:bg-slate-50/60 group transition-colors">
                <Td>
                  <input type="checkbox" className="rounded accent-cyan-600"
                    checked={selected.includes(b.id)}
                    onChange={e => setSelected(prev =>
                      e.target.checked ? [...prev, b.id] : prev.filter(id => id !== b.id)
                    )} />
                </Td>
                <Td><AvatarCell name={b.travelerId} /></Td>
                <Td className="text-slate-500 text-sm truncate max-w-[160px]">{b.tourId}</Td>
                <Td className="font-bold text-slate-700">
                  {b.currency === "ETB" ? "ETB " : "$"}
                  {(b.currency === "ETB" ? b.totalETB : b.totalUSD).toLocaleString()}
                </Td>
                <Td>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border
                    ${b.paymentProvider === "stripe"
                      ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                      : "bg-green-50 text-green-600 border-green-200"}`}>
                    {b.paymentProvider.charAt(0).toUpperCase()+b.paymentProvider.slice(1)}
                  </span>
                </Td>
                <Td className="text-slate-400 text-xs">{b.startDate}</Td>
                <Td className="text-slate-400 text-xs">{b.createdAt}</Td>
                <Td><Badge status={b.status} /></Td>
                <Td>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {b.status === "paid" && (
                      <Btn variant="primary" size="sm" onClick={() => transitionBooking(b.id, "confirmed")}>
                        Confirm
                      </Btn>
                    )}
                    {["confirmed","active"].includes(b.status) && (
                      <Btn variant="danger" size="sm" onClick={() => transitionBooking(b.id, "cancelled")}>
                        Cancel
                      </Btn>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>

        <Pagination total={bookings.length} showing={filtered.length} page={page} perPage={20} onPage={setPage} />
      </Card>
    </div>
  );
}
