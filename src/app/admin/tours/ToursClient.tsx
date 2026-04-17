"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Badge, Btn, Table, Th, Td, Pagination, Card, Tabs,
  Modal, FormField, inputCls, EmptyState,
} from "@/src/components/admin/ui";
import Dropdown, { DropdownOption } from "@/src/components/ui/Dropdown";
import DeleteDialog from "@/src/components/admin/DeleteDialog";

// ── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  title:        z.string().min(3, "Title must be at least 3 characters"),
  operatorId:   z.string().min(1, "Please select an operator"),
  priceUSD:     z.coerce.number().min(0, "Required").nonnegative("Must be positive"),
  priceETB:     z.coerce.number().min(0, "Required").nonnegative("Must be positive"),
  durationDays: z.coerce.number().min(1, "At least 1 day"),
  status:       z.enum(["active", "draft", "archived"]),
  isFeatured:   z.boolean(),
});

type FormValues = z.infer<typeof schema>;

// ── Types ─────────────────────────────────────────────────────────────────────
type Tour = {
  id: string; title: string; operatorId: string;
  priceUSD: number; priceETB: number; durationDays: number;
  status: string; bookingCount: number; avgRating: number;
  isFeatured: boolean; destinationIds: string[]; categories: string[];
};

type Operator = { uid: string; name: string };

// ── Dropdown options ──────────────────────────────────────────────────────────
const STATUS_TABS = [
  { value: "all",      label: "All"      },
  { value: "active",   label: "Active"   },
  { value: "pending",  label: "Pending"  },
  { value: "draft",    label: "Draft"    },
  { value: "archived", label: "Archived" },
];

const DURATION_OPTIONS: DropdownOption[] = [
  { label: "All durations", value: "all" },
  { label: "1–3 days",      value: "1-3" },
  { label: "4–7 days",      value: "4-7" },
  { label: "8+ days",       value: "8+"  },
];

const FORM_STATUS_OPTIONS: DropdownOption[] = [
  { label: "Active",   value: "active"   },
  { label: "Draft",    value: "draft"    },
  { label: "Archived", value: "archived" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1">{msg}</p>;
}

function errorBorder(hasError: boolean) {
  return hasError ? "border-red-400 focus:border-red-400" : "";
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ToursClient({
                                      tours, total, pendingCount, operators,
                                    }: {
  tours: Tour[]; total: number; pendingCount: number; operators: Operator[];
}) {
  const router = useRouter();

  // filter state
  const [statusFilter,   setStatus]   = useState("all");
  const [durationFilter, setDuration] = useState("all");
  const [search,         setSearch]   = useState("");
  const [page,           setPage]     = useState(1);

  // modal + delete state
  const [modal,        setModal]        = useState(false);
  const [editing,      setEditing]      = useState<Tour | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Tour | null>(null);

  const operatorOptions: DropdownOption[] = useMemo(
      () => operators.map(o => ({ label: o.name, value: o.uid })),
      [operators],
  );

  const tabs = STATUS_TABS.map(t => ({
    ...t,
    count: t.value === "pending" ? pendingCount : undefined,
  }));

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => tours.filter(t => {
    const mStatus   = statusFilter === "all" || t.status === statusFilter;
    const mSearch   = !search || t.title.toLowerCase().includes(search.toLowerCase());
    const mDuration =
        durationFilter === "1-3" ? t.durationDays <= 3 :
            durationFilter === "4-7" ? t.durationDays >= 4 && t.durationDays <= 7 :
                durationFilter === "8+"  ? t.durationDays >= 8 : true;
    return mStatus && mSearch && mDuration;
  }), [tours, statusFilter, search, durationFilter]);

  // ── RHF ───────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "", operatorId: "", priceUSD: 0, priceETB: 0,
      durationDays: 1, status: "draft", isFeatured: false,
    },
  });

  // ── Modal helpers ──────────────────────────────────────────────────────────
  function openNew() {
    setEditing(null);
    reset({
      title: "", operatorId: "", priceUSD: 0, priceETB: 0,
      durationDays: 1, status: "draft", isFeatured: false,
    });
    setModal(true);
  }

  function openEdit(t: Tour) {
    setEditing(t);
    reset({
      title:        t.title,
      operatorId:   t.operatorId,
      priceUSD:     t.priceUSD,
      priceETB:     t.priceETB,
      durationDays: t.durationDays,
      status:       t.status as "active" | "draft" | "archived",
      isFeatured:   t.isFeatured,
    });
    setModal(true);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function onSubmit(data: FormValues) {
    setSaving(true);
    try {
      const method = editing ? "PATCH" : "POST";
      const url    = editing
          ? `/api/admin/tours/${editing.id}`
          : "/api/admin/tours";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? res.statusText ?? "Request failed");
      }

      toast.success(editing ? "Tour updated" : "Tour created");
      setModal(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save tour");
    } finally {
      setSaving(false);
    }
  }

  // ── Row actions ────────────────────────────────────────────────────────────
  async function approveTour(id: string) {
    const res = await fetch(`/api/admin/tours/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: "active" }),
    });
    if (!res.ok) { toast.error("Failed to approve tour"); return; }
    toast.success("Tour approved");
    router.refresh();
  }

  async function deleteTour() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/tours/${deleteTarget.id}`, {
      method: "DELETE",
    });
    if (!res.ok) { toast.error("Failed to delete tour"); return; }
    toast.success("Tour deleted");
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
              Tours
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {total.toLocaleString()} listings · {pendingCount} pending approval
            </p>
          </div>
          <Btn variant="primary" size="sm" onClick={openNew}>+ Add tour</Btn>
        </div>

        <Card>
          <Tabs tabs={tabs} active={statusFilter} onChange={setStatus} />

          {/* Filters */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-52">
              <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <circle cx="7" cy="7" r="5" /><path d="M12 12l3 3" />
              </svg>
              <input
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400"
                  placeholder="Search tours…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Dropdown
                options={DURATION_OPTIONS}
                value={durationFilter}
                onChange={setDuration}
                width="w-36"
            />
          </div>

          {/* Table */}
          <Table>
            <thead>
            <tr>
              <Th>Tour</Th><Th>Operator</Th><Th>Price</Th><Th>Duration</Th>
              <Th>Bookings</Th><Th>Rating</Th><Th>Featured</Th><Th>Status</Th>
              <Th className="w-32">Actions</Th>
            </tr>
            </thead>
            <tbody>
            {filtered.length === 0 ? (
                <tr><td colSpan={9}>
                  <EmptyState
                      icon={<svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="10" r="8" /><path d="M13.5 6.5l-2 5-5 2 2-5 5-2z" /></svg>}
                      title="No tours found"
                  />
                </td></tr>
            ) : filtered.map(tour => {
              const opName = operators.find(o => o.uid === tour.operatorId)?.name ?? tour.operatorId;
              return (
                  <tr key={tour.id} className="hover:bg-slate-50/60 group transition-colors">
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-md bg-cyan-50 flex items-center justify-center text-cyan-500 flex-shrink-0 text-base">
                          🧭
                        </div>
                        <div>
                          <div className="font-medium text-slate-800 text-sm leading-tight">{tour.title}</div>
                          <div className="text-xs text-slate-400">
                            {tour.destinationIds.length} destination{tour.destinationIds.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-slate-500 text-sm truncate max-w-[120px]">{opName}</Td>
                    <Td className="font-semibold text-slate-700">${tour.priceUSD.toLocaleString()}</Td>
                    <Td className="text-slate-500 text-sm">{tour.durationDays}d</Td>
                    <Td className="font-medium text-slate-700">{tour.bookingCount}</Td>
                    <Td>
                      {tour.avgRating > 0 ? (
                          <span className="flex items-center gap-1 text-sm font-semibold">
                        <span className="text-amber-400">★</span>{tour.avgRating.toFixed(1)}
                      </span>
                      ) : <span className="text-slate-300 text-sm">—</span>}
                    </Td>
                    <Td>{tour.isFeatured && <span className="text-amber-500 text-sm">⭐</span>}</Td>
                    <Td><Badge status={tour.status} /></Td>
                    <Td>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {tour.status === "pending" && (
                            <Btn variant="primary" size="sm" onClick={() => approveTour(tour.id)}>
                              Approve
                            </Btn>
                        )}
                        <Btn variant="ghost" size="sm" onClick={() => openEdit(tour)}>Edit</Btn>
                        <Btn variant="danger" size="sm" onClick={() => setDeleteTarget(tour)}>
                          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <path d="M3 4h10M6 4V3h4v1M5 4v9h6V4" />
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

        {/* Edit / Add modal */}
        <Modal
            open={modal}
            onClose={() => setModal(false)}
            title={editing ? `Edit: ${editing.title}` : "Add tour"}
            wide
            footer={
              <>
                <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
                <Btn
                    variant="primary"
                    disabled={saving}
                    onClick={handleSubmit(onSubmit)}
                >
                  {saving ? "Saving…" : "Save tour"}
                </Btn>
              </>
            }
        >
          <form onSubmit={e => e.preventDefault()} className="flex flex-col gap-4">

            <FormField label="Tour title">
              <input
                  {...register("title")}
                  className={`${inputCls} ${errorBorder(!!errors.title)}`}
                  placeholder="e.g. 7-Day Lalibela Explorer"
              />
              <FieldError msg={errors.title?.message} />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Operator">
                <Controller
                    name="operatorId"
                    control={control}
                    render={({ field }) => (
                        <Dropdown
                            searchable
                            options={operatorOptions}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select operator"
                            width="w-full"
                        />
                    )}
                />
                <FieldError msg={errors.operatorId?.message} />
              </FormField>

              <FormField label="Status">
                <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                        <Dropdown
                            options={FORM_STATUS_OPTIONS}
                            value={field.value}
                            onChange={v => field.onChange(v as "active" | "draft" | "archived")}
                            width="w-full"
                        />
                    )}
                />
                <FieldError msg={errors.status?.message} />
              </FormField>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField label="Price (USD)">
                <input
                    {...register("priceUSD")}
                    type="number" min="0"
                    className={`${inputCls} ${errorBorder(!!errors.priceUSD)}`}
                />
                <FieldError msg={errors.priceUSD?.message} />
              </FormField>
              <FormField label="Price (ETB)">
                <input
                    {...register("priceETB")}
                    type="number" min="0"
                    className={`${inputCls} ${errorBorder(!!errors.priceETB)}`}
                />
                <FieldError msg={errors.priceETB?.message} />
              </FormField>
              <FormField label="Duration (days)">
                <input
                    {...register("durationDays")}
                    type="number" min="1"
                    className={`${inputCls} ${errorBorder(!!errors.durationDays)}`}
                />
                <FieldError msg={errors.durationDays?.message} />
              </FormField>
            </div>

            <Controller
                name="isFeatured"
                control={control}
                render={({ field }) => (
                    <label className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer">
                      <input
                          type="checkbox"
                          className="w-4 h-4 rounded accent-amber-500"
                          checked={field.value}
                          onChange={e => field.onChange(e.target.checked)}
                      />
                      Mark as Featured ⭐
                    </label>
                )}
            />

          </form>
        </Modal>

        {/* Delete dialog */}
        <DeleteDialog
            open={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={deleteTour}
            title={`Delete "${deleteTarget?.title}"?`}
            description="This will permanently remove the tour and all associated data."
            requireConfirmText={deleteTarget?.title}
        />

      </div>
  );
}