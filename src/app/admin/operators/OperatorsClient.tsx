"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge, Btn, Table, Th, Td, Pagination, Card, Tabs, AvatarCell, Modal, FormField, inputCls, selectCls, EmptyState } from "@/src/components/admin/ui";

type Operator = { id:string; businessName:string; email:string; licenseNumber:string; isVerified:boolean; tourCount:number; avgRating:number; revenueTotal:number; createdAt:string; featuredUntil:string|null };

export default function OperatorsClient({ operators, total, pendingCount }: { operators:Operator[]; total:number; pendingCount:number }) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [modal, setModal]   = useState(false);
  const [editing, setEdit]  = useState<Operator|null>(null);
  const [page, setPage]     = useState(1);

  const filtered = useMemo(() =>
    operators.filter(o => filter === "all" ? true : filter === "verified" ? o.isVerified : !o.isVerified),
  [operators, filter]);

  async function verify(id:string, isVerified:boolean) {
    await fetch(`/api/admin/operators/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ isVerified }) });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-light text-slate-800" style={{fontFamily:"'Playfair Display',serif"}}>Operators</h2>
          <p className="text-sm text-slate-500 mt-1">{total} registered · {pendingCount} pending verification</p>
        </div>
        <Btn variant="primary" size="sm" onClick={() => { setEdit(null); setModal(true); }}>+ Add operator</Btn>
      </div>

      <Card>
        <Tabs
          tabs={[
            { value:"all", label:"All" },
            { value:"verified", label:"Verified" },
            { value:"pending", label:"Pending", count: pendingCount },
          ]}
          active={filter} onChange={setFilter}
        />

        <Table>
          <thead><tr>
            <Th>Operator</Th><Th>License</Th><Th>Tours</Th><Th>Rating</Th><Th>Revenue</Th><Th>Status</Th><Th>Joined</Th><Th className="w-32">Actions</Th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8}><EmptyState icon={<svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="7" width="14" height="10" rx="2"/><path d="M7 7V5a2 2 0 012-2h2a2 2 0 012 2v2"/></svg>} title="No operators found" /></td></tr>
            ) : filtered.map(op => (
              <tr key={op.id} className="hover:bg-slate-50/60 group transition-colors">
                <Td><AvatarCell name={op.businessName} sub={op.email} square /></Td>
                <Td className={`font-mono text-xs ${op.licenseNumber==="PENDING"?"text-amber-600":"text-slate-500"}`}>{op.licenseNumber}</Td>
                <Td className="font-medium">{op.tourCount}</Td>
                <Td>{op.avgRating > 0 ? <span className="flex items-center gap-1 text-sm font-semibold"><span className="text-amber-400">★</span>{op.avgRating.toFixed(1)}</span> : <span className="text-slate-300 text-sm">—</span>}</Td>
                <Td className="font-semibold">{op.revenueTotal > 0 ? `$${op.revenueTotal.toLocaleString()}` : "—"}</Td>
                <Td><Badge status={op.isVerified ? "verified" : "pending"} /></Td>
                <Td className="text-slate-400 text-xs">{op.createdAt}</Td>
                <Td>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!op.isVerified && <Btn variant="primary" size="sm" onClick={() => verify(op.id, true)}>Verify</Btn>}
                    <Btn variant="ghost" size="sm" onClick={() => { setEdit(op); setModal(true); }}>Edit</Btn>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Pagination total={total} showing={filtered.length} page={page} perPage={20} onPage={setPage} />
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? editing.businessName : "Add operator"}
        footer={<><Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn><Btn variant="primary">Save</Btn></>}>
        <div className="flex flex-col gap-4">
          <FormField label="Business name"><input className={inputCls} defaultValue={editing?.businessName} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email"><input className={inputCls} defaultValue={editing?.email} type="email" /></FormField>
            <FormField label="License number"><input className={inputCls} defaultValue={editing?.licenseNumber} placeholder="ETH-TL-YYYY-XXXX" /></FormField>
          </div>
          <label className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded accent-cyan-600" defaultChecked={editing?.isVerified} />
            Mark as verified
          </label>
        </div>
      </Modal>
    </div>
  );
}
