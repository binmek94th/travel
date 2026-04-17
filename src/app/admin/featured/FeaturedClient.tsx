"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Badge, Btn, Table, Th, Td, Pagination, Card, CardHeader,
  Modal, FormField, inputCls, EmptyState,
} from "@/src/components/admin/ui";
import Dropdown, { DropdownOption } from "@/src/components/ui/Dropdown";
import DatePicker from "@/src/components/ui/DatePicker";
import DeleteDialog from "@/src/components/admin/DeleteDialog";

// ── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  type:        z.enum(["tour", "operator"]),
  plan:        z.enum(["standard", "premium"]),
  targetId:    z.string().min(1, "Please select a tour or operator"),
  startDate:   z.string().min(1, "Start date is required"),
  endDate:     z.string().min(1, "End date is required"),
  amountPaid:  z.coerce.number().min(0, "Amount must be positive"),
}).refine(d => d.endDate >= d.startDate, {
  message: "End date must be on or after start date",
  path:    ["endDate"],
});

type FormValues = z.infer<typeof schema>;

// ── Types ─────────────────────────────────────────────────────────────────────
type FeaturedItem = {
  id: string; name: string; type: string; targetId: string;
  operatorId: string; plan: string; startDate: string; endDate: string;
  endDateRaw: string | null; startDateRaw: string | null;
  impressions: number; clicks: number; amountPaid: number;
};

type Operator = { uid: string; name: string };
type Tour     = { id: string;  title: string };

// ── Dropdown options ──────────────────────────────────────────────────────────
const TYPE_OPTIONS: DropdownOption[] = [
  { label: "Tour",     value: "tour"     },
  { label: "Operator", value: "operator" },
];

const TYPE_FILTER_OPTIONS: DropdownOption[] = [
  { label: "All types", value: "all" },
  ...TYPE_OPTIONS,
];

const PLAN_OPTIONS: DropdownOption[] = [
  { label: "Standard — $99/mo",  value: "standard" },
  { label: "Premium — $299/mo",  value: "premium"  },
];

const PLAN_FILTER_OPTIONS: DropdownOption[] = [
  { label: "All plans", value: "all" },
  { label: "Standard",  value: "standard" },
  { label: "Premium",   value: "premium"  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const today = new Date();

function getStatus(item: FeaturedItem) {
  if (!item.endDateRaw || !item.startDateRaw) return "expired";
  if (new Date(item.startDateRaw) > today)    return "upcoming";
  if (new Date(item.endDateRaw)   > today)    return "live";
  return "expired";
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1">{msg}</p>;
}

function errorBorder(has: boolean) {
  return has ? "border-red-400 focus:border-red-400" : "";
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function FeaturedClient({
                                         items, total, operators = [], tours = [],
                                       }: {
  items: FeaturedItem[]; total: number;
  operators?: Operator[]; tours?: Tour[];
}) {
  const router = useRouter();

  // filters
  const [typeFilter, setTypeFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [page,       setPage]       = useState(1);

  // modal + delete
  const [modal,        setModal]        = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FeaturedItem | null>(null);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const revenue          = items.reduce((s, i) => s + i.amountPaid, 0);
  const liveCount        = items.filter(i => getStatus(i) === "live").length;
  const totalImpressions = items.reduce((s, i) => s + i.impressions, 0);
  const withImpressions  = items.filter(i => i.impressions > 0);
  const avgCtr = withImpressions.length > 0
      ? (withImpressions.reduce((s, i) => s + (i.clicks / i.impressions * 100), 0) / withImpressions.length).toFixed(1)
      : "0";

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => items.filter(i => {
    const mType = typeFilter === "all" || i.type === typeFilter;
    const mPlan = planFilter === "all" || i.plan === planFilter;
    return mType && mPlan;
  }), [items, typeFilter, planFilter]);

  // ── RHF ───────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "tour", plan: "standard", targetId: "",
      startDate: "", endDate: "", amountPaid: 0,
    },
  });

  const watchedType      = watch("type");
  const watchedStartDate = watch("startDate");

  // Build target options based on selected type
  const targetOptions: DropdownOption[] = useMemo(() =>
          watchedType === "operator"
              ? operators.map(o => ({ label: o.name,  value: o.uid }))
              : tours.map(t     => ({ label: t.title, value: t.id  })),
      [watchedType, operators, tours],
  );

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function onSubmit(data: FormValues) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/featured", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? res.statusText ?? "Request failed");
      }
      toast.success("Featured listing created");
      setModal(false);
      reset();
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create listing");
    } finally {
      setSaving(false);
    }
  }

  function openModal() {
    reset({
      type: "tour", plan: "standard", targetId: "",
      startDate: "", endDate: "", amountPaid: 0,
    });
    setModal(true);
  }

  // ── Row actions ────────────────────────────────────────────────────────────
  async function endListing(id: string) {
    const res = await fetch(`/api/admin/featured/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ endDate: new Date().toISOString() }),
    });
    if (!res.ok) { toast.error("Failed to end listing"); return; }
    toast.success("Listing ended");
    router.refresh();
  }

  async function deleteListing() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/featured/${deleteTarget.id}`, {
      method: "DELETE",
    });
    if (!res.ok) { toast.error("Failed to delete listing"); return; }
    toast.success("Listing deleted");
    router.refresh();
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
      <div className="flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2
                className="text-2xl font-light text-slate-800"
                style={{ fontFamily: "'Playfair Display',serif" }}
            >
              Featured Listings
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {total} listings · ${revenue.toLocaleString()} revenue
            </p>
          </div>
          <Btn variant="primary" size="sm" onClick={openModal}>+ Create listing</Btn>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Live now",          val: liveCount,                        color: "text-emerald-600" },
            { label: "Total revenue",     val: `$${revenue.toLocaleString()}`,   color: "text-cyan-600"   },
            { label: "Total impressions", val: totalImpressions.toLocaleString(), color: "text-amber-600" },
            { label: "Avg. CTR",          val: `${avgCtr}%`,                     color: "text-violet-600" },
          ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{s.label}</div>
                <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.val}</div>
              </div>
          ))}
        </div>

        <Card>
          <CardHeader title="All Featured Slots" subtitle="Paid promotion for tours and operators">
            <Dropdown
                options={TYPE_FILTER_OPTIONS}
                value={typeFilter}
                onChange={setTypeFilter}
                width="w-32"
            />
            <Dropdown
                options={PLAN_FILTER_OPTIONS}
                value={planFilter}
                onChange={setPlanFilter}
                width="w-32"
            />
          </CardHeader>

          <Table>
            <thead>
            <tr>
              <Th>Name</Th><Th>Type</Th><Th>Plan</Th><Th>Period</Th>
              <Th>Impressions</Th><Th>Clicks</Th><Th>CTR</Th><Th>Paid</Th>
              <Th>Status</Th><Th className="w-28">Actions</Th>
            </tr>
            </thead>
            <tbody>
            {filtered.length === 0 ? (
                <tr><td colSpan={10}>
                  <EmptyState
                      icon={<span className="text-2xl">⭐</span>}
                      title="No featured listings yet"
                  />
                </td></tr>
            ) : filtered.map(item => {
              const s   = getStatus(item);
              const ctr = item.impressions > 0
                  ? (item.clicks / item.impressions * 100).toFixed(1)
                  : null;

              return (
                  <tr key={item.id} className="hover:bg-slate-50/60 group transition-colors">
                    <Td>
                      <div className="font-medium text-slate-800 text-sm">{item.name}</div>
                      <div className="text-xs text-slate-400">{item.operatorId}</div>
                    </Td>
                    <Td>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border
                      ${item.type === "operator"
                        ? "bg-violet-50 text-violet-700 border-violet-200"
                        : "bg-cyan-50 text-cyan-700 border-cyan-200"}`}
                    >
                      {item.type}
                    </span>
                    </Td>
                    <Td>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border
                      ${item.plan === "premium"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"}`}
                    >
                      {item.plan}
                    </span>
                    </Td>
                    <Td>
                      <div className="text-xs text-slate-600">{item.startDate}</div>
                      <div className="text-xs text-slate-400">→ {item.endDate}</div>
                    </Td>
                    <Td className="font-medium">
                      {item.impressions > 0 ? item.impressions.toLocaleString() : "—"}
                    </Td>
                    <Td className="font-medium">
                      {item.clicks > 0 ? item.clicks : "—"}
                    </Td>
                    <Td className={`font-semibold ${ctr && parseFloat(ctr) >= 5 ? "text-emerald-600" : ""}`}>
                      {ctr ? `${ctr}%` : "—"}
                    </Td>
                    <Td className="font-semibold">${item.amountPaid}</Td>
                    <Td><Badge status={s} /></Td>
                    <Td>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {s === "live" && (
                            <Btn variant="danger" size="sm" onClick={() => endListing(item.id)}>
                              End
                            </Btn>
                        )}
                        {s === "expired" && (
                            <Btn variant="primary" size="sm" onClick={() => {/* renew flow */}}>
                              Renew
                            </Btn>
                        )}
                        <Btn variant="ghost" size="sm" onClick={() => setDeleteTarget(item)}>
                          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <path d="M3 4h10M5 4v9h6V4M6 4V3h4v1" />
                          </svg>
                        </Btn>
                      </div>
                    </Td>
                  </tr>
              );
            })}
            </tbody>
          </Table>

          <Pagination total={total} showing={filtered.length} page={page} perPage={20} onPage={setPage} />
        </Card>

        {/* Create modal */}
        <Modal
            open={modal}
            onClose={() => setModal(false)}
            title="Create featured listing"
            footer={
              <>
                <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
                <Btn variant="primary" disabled={saving} onClick={handleSubmit(onSubmit)}>
                  {saving ? "Creating…" : "Create"}
                </Btn>
              </>
            }
        >
          <form onSubmit={e => e.preventDefault()} className="flex flex-col gap-4">

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Type">
                <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                        <Dropdown
                            options={TYPE_OPTIONS}
                            value={field.value}
                            onChange={v => {
                              field.onChange(v);
                              // reset targetId when type switches
                              reset(vals => ({ ...vals, type: v as "tour" | "operator", targetId: "" }));
                            }}
                            width="w-full"
                        />
                    )}
                />
                <FieldError msg={errors.type?.message} />
              </FormField>

              <FormField label="Plan">
                <Controller
                    name="plan"
                    control={control}
                    render={({ field }) => (
                        <Dropdown
                            options={PLAN_OPTIONS}
                            value={field.value}
                            onChange={v => field.onChange(v as "standard" | "premium")}
                            width="w-full"
                        />
                    )}
                />
                <FieldError msg={errors.plan?.message} />
              </FormField>
            </div>

            <FormField label={watchedType === "operator" ? "Select operator" : "Select tour"}>
              <Controller
                  name="targetId"
                  control={control}
                  render={({ field }) => (
                      <Dropdown
                          searchable
                          options={targetOptions}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={targetOptions.length === 0
                              ? `No ${watchedType}s available`
                              : `Choose ${watchedType}…`
                          }
                          width="w-full"
                      />
                  )}
              />
              <FieldError msg={errors.targetId?.message} />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Start date">
                <Controller
                    name="startDate"
                    control={control}
                    render={({ field }) => (
                        <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Start date"
                            hasError={!!errors.startDate}
                        />
                    )}
                />
                <FieldError msg={errors.startDate?.message} />
              </FormField>

              <FormField label="End date">
                <Controller
                    name="endDate"
                    control={control}
                    render={({ field }) => (
                        <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="End date"
                            minDate={watchedStartDate || undefined}
                            hasError={!!errors.endDate}
                        />
                    )}
                />
                <FieldError msg={errors.endDate?.message} />
              </FormField>
            </div>

            <FormField label="Amount paid (USD)">
              <input
                  {...register("amountPaid")}
                  type="number" min="0"
                  className={`${inputCls} ${errorBorder(!!errors.amountPaid)}`}
                  placeholder="0"
              />
              <FieldError msg={errors.amountPaid?.message} />
            </FormField>

          </form>
        </Modal>

        {/* Delete dialog */}
        <DeleteDialog
            open={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={deleteListing}
            title={`Delete "${deleteTarget?.name}"?`}
            description="This will permanently remove the featured listing."
            requireConfirmText={deleteTarget?.name}
        />

      </div>
  );
}