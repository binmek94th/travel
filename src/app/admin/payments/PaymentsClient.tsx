"use client";
import { useState, useMemo } from "react";
import { Badge, Table, Th, Td, Pagination, Card, Tabs, Btn, EmptyState } from "@/src/components/admin/ui";

type Payment = { id:string; bookingId:string; amount:number; currency:string; provider:string; status:string; providerTxId:string; webhookVerified:boolean; createdAt:string };

export default function PaymentsClient({ payments, total, totalUSD }: { payments:Payment[]; total:number; totalUSD:number }) {
  const [filter, setFilter] = useState("all");
  const [page, setPage]     = useState(1);

  const filtered = useMemo(() =>
    payments.filter(p => filter === "all" || p.status === filter),
  [payments, filter]);

  const stripeCount = payments.filter(p=>p.provider==="stripe").length;
  const chapaCount  = payments.filter(p=>p.provider==="chapa").length;
  const refunded    = payments.filter(p=>p.status==="refunded").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-light text-slate-800" style={{fontFamily:"'Playfair Display',serif"}}>Payments</h2>
          <p className="text-sm text-slate-500 mt-1">{total} transactions · ${totalUSD.toLocaleString()} USD collected</p>
        </div>
        <Btn variant="ghost" size="sm">Export CSV</Btn>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label:"Total USD", val:`$${totalUSD.toLocaleString()}`, color:"text-cyan-600" },
          { label:"Via Stripe", val: stripeCount, color:"text-indigo-600" },
          { label:"Via Chapa",  val: chapaCount,  color:"text-emerald-600" },
          { label:"Refunded",   val: refunded,    color:"text-red-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{s.label}</div>
            <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>

      <Card>
        <Tabs tabs={[
          { value:"all",       label:"All" },
          { value:"succeeded", label:"Succeeded" },
          { value:"pending",   label:"Pending" },
          { value:"refunded",  label:"Refunded" },
          { value:"failed",    label:"Failed" },
        ]} active={filter} onChange={setFilter} />

        <Table>
          <thead><tr>
            <Th>Booking</Th><Th>Amount</Th><Th>Provider</Th>
            <Th>Transaction ID</Th><Th>Webhook</Th><Th>Status</Th><Th>Date</Th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7}><EmptyState icon={<span className="text-2xl">💳</span>} title="No transactions" /></td></tr>
            ) : filtered.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                <Td className="font-mono text-xs text-slate-500">{p.bookingId}</Td>
                <Td className="font-bold text-slate-800">
                  {p.currency === "ETB" ? "ETB " : "$"}{p.amount.toLocaleString()}
                </Td>
                <Td>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border
                    ${p.provider === "stripe"
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                    {p.provider.charAt(0).toUpperCase()+p.provider.slice(1)}
                  </span>
                </Td>
                <Td className="font-mono text-xs text-slate-400 max-w-[180px] truncate">{p.providerTxId}</Td>
                <Td>
                  <span className={`text-xs font-semibold ${p.webhookVerified ? "text-emerald-600" : "text-amber-600"}`}>
                    {p.webhookVerified ? "✓ Verified" : "⏳ Pending"}
                  </span>
                </Td>
                <Td><Badge status={p.status} /></Td>
                <Td className="text-slate-400 text-xs">{p.createdAt}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Pagination total={total} showing={filtered.length} page={page} perPage={20} onPage={setPage} />
      </Card>
    </div>
  );
}
