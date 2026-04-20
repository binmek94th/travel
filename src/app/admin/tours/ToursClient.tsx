"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Badge, Btn, Table, Th, Td, Pagination, Card, Tabs,
  Modal, FormField, inputCls, EmptyState,
} from "@/src/components/admin/ui";
import Dropdown, { DropdownOption } from "@/src/components/ui/Dropdown";
import DeleteDialog from "@/src/components/admin/DeleteDialog";
import ImageUploader from "@/src/components/ui/ImageUploader";
import ItineraryDayCard from "@/src/app/admin/tours/ItineraryDayCard";

// ── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  title:        z.string().min(3, "Title must be at least 3 characters"),
  operatorId:   z.string().min(1, "Please select an operator"),
  description:  z.string().min(10, "Description must be at least 10 characters"),
  priceUSD:     z.coerce.number().min(0).nonnegative(),
  priceETB:     z.coerce.number().min(0).nonnegative(),
  durationDays: z.coerce.number().min(1, "At least 1 day"),
  groupSizeMin: z.coerce.number().min(1),
  groupSizeMax: z.coerce.number().min(1),
  status:       z.enum(["active", "draft", "archived"]),
  isFeatured:   z.boolean(),
  images:       z.array(z.string()).optional(),
  includes:     z.array(z.object({ item: z.string().min(1, "Required") })).optional(),
  excludes: z.array(z.object({ item: z.string().min(1, "Required") })).optional(), // ← add
  itinerary: z.array(z.object({
    day:         z.coerce.number().min(1),
    title:       z.string().min(1, "Title required"),
    description: z.string().min(1, "Description required"),
    latitude:    z.coerce.number().optional().or(z.literal("")),
    longitude:   z.coerce.number().optional().or(z.literal("")),
    transportMode: z.enum(["driving", "walking", "flying", "boat"]).optional(),
  })).optional(),
}).refine(d => d.groupSizeMax >= d.groupSizeMin, {
  message: "Max group size must be ≥ min",
  path: ["groupSizeMax"],
});

type FormValues = z.infer<typeof schema>;

// ── Types ─────────────────────────────────────────────────────────────────────
type Tour = {
  id: string; title: string; slug: string; operatorId: string;
  priceUSD: number; priceETB: number; durationDays: number;
  status: string; bookingCount: number; avgRating: number;
  isFeatured: boolean; destinationIds: string[]; categories: string[];
  description: string; images: string[];
  itinerary: { day: number; title: string; description: string; latitude?: number; longitude?: number; transportMode?: "driving" | "walking" | "flying" | "boat"; }[];
  includes: string[]; groupSizeMin: number; groupSizeMax: number; excludes: string[]
};

type Operator = { uid: string; name: string };

// ── Constants ─────────────────────────────────────────────────────────────────
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

function errorBorder(has: boolean) {
  return has ? "border-red-400 focus:border-red-400" : "";
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

  // modal state
  const [modal,        setModal]        = useState(false);
  const [editing,      setEditing]      = useState<Tour | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Tour | null>(null);
  const [activeTab, setActiveTab] = useState<"basic" | "itinerary" | "includes" | "excludes" | "media">("basic");

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
      title: "", operatorId: "", description: "",
      priceUSD: 0, priceETB: 0, durationDays: 1,
      groupSizeMin: 1, groupSizeMax: 12,
      status: "draft", isFeatured: false,
      images: [], includes: [], itinerary: [],
    },
  });

  const {
    fields: itineraryFields,
    append: appendDay,
    remove: removeDay,
    move:   moveDay,
  } = useFieldArray({ control, name: "itinerary" });

  const {
    fields: includesFields,
    append: appendInclude,
    remove: removeInclude,
  } = useFieldArray({ control, name: "includes" });

  const {
    fields: excludesFields,
    append: appendExclude,
    remove: removeExclude,
  } = useFieldArray({ control, name: "excludes" });

  // ── Modal helpers ──────────────────────────────────────────────────────────
  function openNew() {
    setEditing(null);
    setActiveTab("basic");
    reset({
      title: "", operatorId: "", description: "",
      priceUSD: 0, priceETB: 0, durationDays: 1,
      groupSizeMin: 1, groupSizeMax: 12,
      status: "draft", isFeatured: false,
      images: [], includes: [], itinerary: [], excludes: []
    });
    setModal(true);
  }

  function openEdit(t: Tour) {
    setEditing(t);
    setActiveTab("basic");
    reset({
      title:        t.title,
      operatorId:   t.operatorId,
      description:  t.description,
      priceUSD:     t.priceUSD,
      priceETB:     t.priceETB,
      durationDays: t.durationDays,
      groupSizeMin: t.groupSizeMin,
      groupSizeMax: t.groupSizeMax,
      status:       t.status as "active" | "draft" | "archived",
      isFeatured:   t.isFeatured,
      images:       t.images   ?? [],
      includes:     (t.includes ?? []).map(item => ({ item })),
      excludes: (t.excludes ?? []).map(item => ({ item })),
      itinerary: t.itinerary?.map(d => ({
        ...d,
        latitude:  d.latitude  ?? "",
        longitude: d.longitude ?? "",
        transportMode: d.transportMode ?? "driving",
      })) ?? [],
    });
    setModal(true);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function onSubmit(data: FormValues) {
    setSaving(true);
    try {
      const payload = {
        ...data,
        // flatten includes back to string[]
        includes: (data.includes ?? []).map(i => i.item).filter(Boolean),
        excludes: (data.excludes ?? []).map(i => i.item).filter(Boolean),
      };

      const method = editing ? "PATCH" : "POST";
      const url    = editing ? `/api/admin/tours/${editing.id}` : "/api/admin/tours";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    if (!res.ok) { toast.error("Failed to approve tour"); return; }
    toast.success("Tour approved");
    router.refresh();
  }

  async function deleteTour() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/tours/${deleteTarget.id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed to delete tour"); return; }
    toast.success("Tour deleted");
    router.refresh();
  }

  const modalTabs = [
    { key: "basic",     label: "Basic info"                            },
    { key: "itinerary", label: `Itinerary (${itineraryFields.length})` },
    { key: "includes",  label: `Includes (${includesFields.length})`   },
    { key: "excludes",  label: `Excludes (${excludesFields.length})`   },
    { key: "media",     label: "Images"                                },
  ] as const;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
      <div className="flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-light text-slate-800" style={{ fontFamily: "'Playfair Display',serif" }}>
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
                <circle cx="7" cy="7" r="5"/><path d="M12 12l3 3"/>
              </svg>
              <input
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400"
                  placeholder="Search tours…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Dropdown options={DURATION_OPTIONS} value={durationFilter} onChange={setDuration} width="w-36" />
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
                      icon={<svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="10" r="8"/><path d="M13.5 6.5l-2 5-5 2 2-5 5-2z"/></svg>}
                      title="No tours found"
                  />
                </td></tr>
            ) : filtered.map(tour => {
              const opName = operators.find(o => o.uid === tour.operatorId)?.name ?? tour.operatorId;
              return (
                  <tr key={tour.id} className="hover:bg-slate-50/60 group transition-colors">
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-md overflow-hidden bg-cyan-50 flex items-center justify-center text-cyan-500 flex-shrink-0">
                          {tour.images?.[0]
                              ? <img src={tour.images[0]} alt={tour.title} className="w-full h-full object-cover" />
                              : <span className="text-base">🧭</span>
                          }
                        </div>
                        <div>
                          <div className="font-medium text-slate-800 text-sm leading-tight">{tour.title}</div>
                          <div className="text-xs text-slate-400">
                            {tour.destinationIds.length} destination{tour.destinationIds.length !== 1 ? "s" : ""}
                            {tour.itinerary?.length > 0 && ` · ${tour.itinerary.length} days`}
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
                            <Btn variant="primary" size="sm" onClick={() => approveTour(tour.id)}>Approve</Btn>
                        )}
                        <Btn variant="ghost" size="sm" onClick={() => openEdit(tour)}>Edit</Btn>
                        <Btn variant="danger" size="sm" onClick={() => setDeleteTarget(tour)}>
                          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <path d="M3 4h10M6 4V3h4v1M5 4v9h6V4"/>
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

        {/* ── Modal ── */}
        <Modal
            open={modal}
            onClose={() => setModal(false)}
            title={editing ? `Edit: ${editing.title}` : "Add tour"}
            wide
            footer={
              <>
                <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
                <Btn variant="primary" disabled={saving} onClick={handleSubmit(onSubmit)}>
                  {saving ? "Saving…" : "Save tour"}
                </Btn>
              </>
            }
        >
          {/* Modal tabs */}
          <div className="flex border-b border-slate-100 mb-5 -mx-1">
            {modalTabs.map(tab => (
                <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2.5 text-xs font-semibold capitalize transition-colors border-b-2 -mb-px whitespace-nowrap ${
                        activeTab === tab.key
                            ? "border-cyan-600 text-cyan-600"
                            : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                >
                  {tab.label}
                </button>
            ))}
          </div>

          <form onSubmit={e => e.preventDefault()} className="flex flex-col gap-4">

            {/* ── Basic info ── */}
            {activeTab === "basic" && (
                <>
                  <FormField label="Tour title">
                    <input
                        {...register("title")}
                        className={`${inputCls} ${errorBorder(!!errors.title)}`}
                        placeholder="e.g. 7-Day Lalibela Explorer"
                    />
                    <FieldError msg={errors.title?.message} />
                  </FormField>

                  <FormField label="Description">
                <textarea
                    {...register("description")}
                    className={`${inputCls} min-h-[80px] resize-y ${errorBorder(!!errors.description)}`}
                    placeholder="Describe the tour experience…"
                />
                    <FieldError msg={errors.description?.message} />
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
                    </FormField>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField label="Price (USD)">
                      <input {...register("priceUSD")} type="number" min="0" className={`${inputCls} ${errorBorder(!!errors.priceUSD)}`} />
                      <FieldError msg={errors.priceUSD?.message} />
                    </FormField>
                    <FormField label="Price (ETB)">
                      <input {...register("priceETB")} type="number" min="0" className={`${inputCls} ${errorBorder(!!errors.priceETB)}`} />
                      <FieldError msg={errors.priceETB?.message} />
                    </FormField>
                    <FormField label="Duration (days)">
                      <input {...register("durationDays")} type="number" min="1" className={`${inputCls} ${errorBorder(!!errors.durationDays)}`} />
                      <FieldError msg={errors.durationDays?.message} />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Min group size">
                      <input {...register("groupSizeMin")} type="number" min="1" className={`${inputCls} ${errorBorder(!!errors.groupSizeMin)}`} />
                      <FieldError msg={errors.groupSizeMin?.message} />
                    </FormField>
                    <FormField label="Max group size">
                      <input {...register("groupSizeMax")} type="number" min="1" className={`${inputCls} ${errorBorder(!!errors.groupSizeMax)}`} />
                      <FieldError msg={errors.groupSizeMax?.message} />
                    </FormField>
                  </div>

                  <Controller
                      name="isFeatured"
                      control={control}
                      render={({ field }) => (
                          <label className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 rounded accent-amber-500"
                                   checked={field.value} onChange={e => field.onChange(e.target.checked)} />
                            Mark as Featured ⭐
                          </label>
                      )}
                  />
                </>
            )}

            {/* ── Itinerary ── */}
            {activeTab === "itinerary" && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-slate-500">
                    Build the day-by-day itinerary. Pin a location for each day — optional.
                  </p>

                  {itineraryFields.length === 0 && (
                      <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center text-slate-400 text-sm">
                        No itinerary days yet. Add a day below.
                      </div>
                  )}

                  {itineraryFields.map((field, i) => (
                      <ItineraryDayCard
                          key={field.id}
                          index={i}
                          total={itineraryFields.length}
                          register={register}
                          control={control}
                          errors={errors}
                          onMoveUp={() => moveDay(i, i - 1)}
                          onMoveDown={() => moveDay(i, i + 1)}
                          onRemove={() => removeDay(i)}
                      />
                  ))}

                  <button
                      type="button"
                      onClick={() => appendDay({ day: itineraryFields.length + 1, title: "", transportMode: "driving", description: "", latitude: "", longitude: "" })}
                      className="flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-700 font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M8 2v12M2 8h12"/>
                    </svg>
                    Add day
                  </button>
                </div>
            )}

            {/* ── Includes ── */}
            {activeTab === "includes" && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-slate-500">
                    List everything included in the tour price — accommodation, meals, guides, transport, etc.
                  </p>

                  {includesFields.length === 0 && (
                      <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center text-slate-400 text-sm">
                        No items yet. Add what's included below.
                      </div>
                  )}

                  <div className="flex flex-col gap-2">
                    {includesFields.map((field, i) => (
                        <div key={field.id} className="flex items-center gap-2">
                    <span className="text-emerald-500 flex-shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M3 8l4 4 6-6"/>
                      </svg>
                    </span>
                          <input
                              {...register(`includes.${i}.item`)}
                              className={`${inputCls} flex-1 ${errors.includes?.[i]?.item ? "border-red-400" : ""}`}
                              placeholder="e.g. All accommodation (3-star hotels)"
                          />
                          <button type="button" onClick={() => removeInclude(i)}
                                  className="text-slate-400 hover:text-red-400 transition-colors flex-shrink-0">
                            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                              <path d="M3 3l10 10M13 3L3 13"/>
                            </svg>
                          </button>
                        </div>
                    ))}
                  </div>

                  <button
                      type="button"
                      onClick={() => appendInclude({ item: "" })}
                      className="flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-700 font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M8 2v12M2 8h12"/>
                    </svg>
                    Add item
                  </button>
                </div>
            )}
            {/* ── Excludes ── */}
            {activeTab === "excludes" && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-slate-500">
                    List everything NOT included — flights, visa fees, personal expenses, tips, etc.
                  </p>

                  {excludesFields.length === 0 && (
                      <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center text-slate-400 text-sm">
                        No items yet. Add what's excluded below.
                      </div>
                  )}

                  <div className="flex flex-col gap-2">
                    {excludesFields.map((field, i) => (
                        <div key={field.id} className="flex items-center gap-2">
          <span className="text-red-400 flex-shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 3l10 10M13 3L3 13"/>
            </svg>
          </span>
                          <input
                              {...register(`excludes.${i}.item`)}
                              className={`${inputCls} flex-1 ${errors.excludes?.[i]?.item ? "border-red-400" : ""}`}
                              placeholder="e.g. International flights"
                          />
                          <button
                              type="button"
                              onClick={() => removeExclude(i)}
                              className="text-slate-400 hover:text-red-400 transition-colors flex-shrink-0"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                              <path d="M3 3l10 10M13 3L3 13"/>
                            </svg>
                          </button>
                        </div>
                    ))}
                  </div>

                  <button
                      type="button"
                      onClick={() => appendExclude({ item: "" })}
                      className="flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-700 font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M8 2v12M2 8h12"/>
                    </svg>
                    Add item
                  </button>
                </div>
            )}

            {/* ── Images ── */}
            {activeTab === "media" && (
                <Controller
                    name="images"
                    control={control}
                    render={({ field }) => (
                        <ImageUploader
                            value={field.value ?? []}
                            onChange={field.onChange}
                            folder="tours"
                            maxImages={12}
                        />
                    )}
                />
            )}

          </form>
        </Modal>

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