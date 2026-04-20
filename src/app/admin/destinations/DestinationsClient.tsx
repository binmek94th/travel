"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Badge, Btn, Table, Th, Td, Pagination,
  Card, Modal, FormField, inputCls, EmptyState,
} from "@/src/components/admin/ui";
import Dropdown, { DropdownOption } from "@/src/components/ui/Dropdown";
import DeleteDialog from "@/src/components/admin/DeleteDialog";
import ImageUploader from "@/src/components/ui/ImageUploader";
import MapPicker from "@/src/components/ui/MapPicker";

// ── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  name:            z.string().min(2, "Name must be at least 2 characters"),
  region:          z.string().min(1, "Please select a region"),
  description:     z.string().min(10, "Description must be at least 10 characters"),
  categories:      z.array(z.string()).min(1, "Select at least one category"),
  latitude:        z.coerce.number().min(-90).max(90).optional().or(z.literal("")),
  longitude:       z.coerce.number().min(-180).max(180).optional().or(z.literal("")),
  bestTimeToVisit: z.string().optional(),
  status:          z.enum(["active", "draft"]),
  isHiddenGem:     z.boolean(),
  images:          z.array(z.string().url("Must be a valid URL")).optional(),
  travelTips:      z.array(
      z.object({ title: z.string().min(1, "Title required"), tip: z.string().min(1, "Tip required") })
  ).optional(),
});

type FormValues = z.infer<typeof schema>;

// ── Types ─────────────────────────────────────────────────────────────────────
type Destination = {
  id: string; name: string; slug: string; region: string;
  categories: string[]; avgRating: number; reviewCount: number;
  isHiddenGem: boolean; status: string; coverImage: string | null;
  images: string[]; travelTips: { title: string; tip: string }[];
  bestTimeToVisit: string; latitude: number; longitude: number;
  description: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORY_FILTER_OPTIONS: DropdownOption[] = [
  { label: "All categories", value: "all"       },
  { label: "Culture",        value: "culture"   },
  { label: "Nature",         value: "nature"    },
  { label: "Adventure",      value: "adventure" },
  { label: "Religious",      value: "religious" },
];

const STATUS_FILTER_OPTIONS: DropdownOption[] = [
  { label: "All status", value: "all"    },
  { label: "Active",     value: "active" },
  { label: "Draft",      value: "draft"  },
];

const REGION_OPTIONS: DropdownOption[] = [
  "Amhara", "Tigray", "Oromia", "Afar",
  "Southern Nations", "Somali", "Addis Ababa", "Dire Dawa",
].map(r => ({ label: r, value: r }));

const STATUS_OPTIONS: DropdownOption[] = [
  { label: "Active", value: "active" },
  { label: "Draft",  value: "draft"  },
];

const CATEGORIES = ["culture", "nature", "adventure", "religious"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1">{msg}</p>;
}

function errorBorder(has: boolean) {
  return has ? "border-red-400 focus:border-red-400" : "";
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DestinationsClient({
                                             destinations, total, hiddenGems,
                                           }: {
  destinations: Destination[]; total: number; hiddenGems: number;
}) {
  const router = useRouter();

  const [search,       setSearch]  = useState("");
  const [catFilter,    setCat]     = useState("all");
  const [statusFilter, setStatus]  = useState("all");
  const [hiddenOnly,   setHidden]  = useState(false);
  const [viewMode,     setView]    = useState<"table" | "grid">("table");
  const [page,         setPage]    = useState(1);
  const [modal,        setModal]   = useState(false);
  const [editing,      setEditing] = useState<Destination | null>(null);
  const [saving,       setSaving]  = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Destination | null>(null);
  const [activeTab,    setActiveTab]    = useState<"basic" | "media" | "tips">("basic");

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
      name: "", region: "", description: "", categories: [],
      latitude: "", longitude: "", bestTimeToVisit: "",
      status: "draft", isHiddenGem: false, images: [], travelTips: [],
    },
  });

  // useFieldArray for images[]
  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({ control, name: "images" as any });

  // useFieldArray for travelTips[]
  const {
    fields: tipFields,
    append: appendTip,
    remove: removeTip,
  } = useFieldArray({ control, name: "travelTips" });

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => destinations.filter(d => {
    const mSearch = !search ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.region.toLowerCase().includes(search.toLowerCase());
    const mCat    = catFilter === "all" || d.categories.includes(catFilter);
    const mStatus = statusFilter === "all" || d.status === statusFilter;
    const mHidden = !hiddenOnly || d.isHiddenGem;
    return mSearch && mCat && mStatus && mHidden;
  }), [destinations, search, catFilter, statusFilter, hiddenOnly]);

  // ── Modal helpers ──────────────────────────────────────────────────────────
  function openNew() {
    setEditing(null);
    setActiveTab("basic");
    reset({
      name: "", region: "", description: "", categories: [],
      latitude: "", longitude: "", bestTimeToVisit: "",
      status: "draft", isHiddenGem: false, images: [], travelTips: [],
    });
    setModal(true);
  }

  function openEdit(d: Destination) {
    setEditing(d);
    setActiveTab("basic");
    reset({
      name:            d.name            ?? "",
      region:          d.region          ?? "",
      description:     d.description     ?? "",
      categories:      d.categories      ?? [],
      latitude:        d.latitude        ?? "",
      longitude:       d.longitude       ?? "",
      bestTimeToVisit: d.bestTimeToVisit ?? "",
      status:          (d.status as "active" | "draft") ?? "draft",
      isHiddenGem:     d.isHiddenGem     ?? false,
      images:          d.images          ?? [],
      travelTips:      d.travelTips      ?? [],
    });
    setModal(true);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function onSubmit(data: FormValues, overrideStatus?: "active" | "draft") {
    const payload = overrideStatus ? { ...data, status: overrideStatus } : data;
    setSaving(overrideStatus ?? "draft");
    try {
      const method = editing ? "PATCH" : "POST";
      const url    = editing
          ? `/api/admin/destinations/${editing.id}`
          : "/api/admin/destinations";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing?.id, ...payload }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? res.statusText ?? "Request failed");
      }
      toast.success(editing ? "Destination updated" : "Destination created");
      setModal(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save destination");
    } finally {
      setSaving("");
    }
  }

  const submitAsDraft   = handleSubmit(d => onSubmit(d, "draft"));
  const submitAsPublish = handleSubmit(d => onSubmit(d, "active"));

  async function deleteDestination() {
    if (!deleteTarget) return;
    await fetch(`/api/admin/destinations/${deleteTarget.id}`, { method: "DELETE" });
    router.refresh();
  }

  async function toggleHiddenGem(id: string, val: boolean) {
    await fetch(`/api/admin/destinations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isHiddenGem: val }),
    });
    router.refresh();
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
      <div className="flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-light text-slate-800" style={{ fontFamily: "'Playfair Display',serif" }}>
              Destinations
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {total.toLocaleString()} destinations · {hiddenGems} hidden gems
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border border-slate-200 rounded-lg overflow-hidden">
              {(["table", "grid"] as const).map(m => (
                  <button
                      key={m}
                      onClick={() => setView(m)}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                          viewMode === m ? "bg-cyan-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"
                      }`}
                  >
                    {m === "table" ? "☰ Table" : "⊞ Grid"}
                  </button>
              ))}
            </div>
            <Btn variant="primary" size="sm" onClick={openNew}>
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 1v10M1 6h10" />
              </svg>
              Add destination
            </Btn>
          </div>
        </div>

        <Card>
          {/* Filters */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-52">
              <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <circle cx="7" cy="7" r="5" /><path d="M12 12l3 3" />
              </svg>
              <input
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400"
                  placeholder="Search destinations…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Dropdown options={CATEGORY_FILTER_OPTIONS} value={catFilter}    onChange={setCat}    width="w-44" />
            <Dropdown options={STATUS_FILTER_OPTIONS}   value={statusFilter} onChange={setStatus} width="w-36" />
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
              <input
                  type="checkbox"
                  className="rounded accent-cyan-600"
                  checked={hiddenOnly}
                  onChange={e => setHidden(e.target.checked)}
              />
              Hidden gems only
            </label>
          </div>

          {/* Table view */}
          {viewMode === "table" && (
              <>
                <Table>
                  <thead>
                  <tr>
                    <Th>Destination</Th><Th>Region</Th><Th>Categories</Th>
                    <Th>Rating</Th><Th>Reviews</Th><Th>Status</Th>
                    <Th>Hidden Gem</Th><Th className="w-24">Actions</Th>
                  </tr>
                  </thead>
                  <tbody>
                  {filtered.length === 0 ? (
                      <tr><td colSpan={8}>
                        <EmptyState
                            icon={<svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 2C7.24 2 5 4.24 5 7c0 4.17 5 11 5 11s5-6.83 5-11c0-2.76-2.24-5-5-5z" /><circle cx="10" cy="7" r="1.5" /></svg>}
                            title="No destinations found"
                        />
                      </td></tr>
                  ) : filtered.map(dest => (
                      <tr key={dest.id} className="hover:bg-slate-50/60 group transition-colors">
                        <Td>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-md bg-cyan-50 flex items-center justify-center text-cyan-500 flex-shrink-0 overflow-hidden">
                              {dest.coverImage
                                  ? <img src={dest.coverImage} alt={dest.name} className="w-full h-full object-cover" />
                                  : <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 2C7.24 2 5 4.24 5 7c0 4.17 5 11 5 11s5-6.83 5-11c0-2.76-2.24-5-5-5z" /><circle cx="10" cy="7" r="1.5" /></svg>
                              }
                            </div>
                            <div>
                              <div className="font-medium text-slate-800 text-sm">{dest.name}</div>
                              <div className="text-xs text-slate-400">
                                {dest.images.length > 0 ? `${dest.images.length} image${dest.images.length !== 1 ? "s" : ""}` : "No images"}
                                {dest.travelTips.length > 0 ? ` · ${dest.travelTips.length} tip${dest.travelTips.length !== 1 ? "s" : ""}` : ""}
                              </div>
                            </div>
                          </div>
                        </Td>
                        <Td className="text-slate-500 text-sm">{dest.region}</Td>
                        <Td>
                          <div className="flex gap-1 flex-wrap">
                            {dest.categories.map(c => (
                                <span key={c} className="text-[10px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-100 rounded-full px-2 py-0.5">
                            {c}
                          </span>
                            ))}
                          </div>
                        </Td>
                        <Td>
                          {dest.avgRating > 0 ? (
                              <span className="flex items-center gap-1 text-sm font-semibold">
                          <span className="text-amber-400">★</span>{dest.avgRating.toFixed(1)}
                        </span>
                          ) : <span className="text-slate-300 text-sm">—</span>}
                        </Td>
                        <Td className="text-slate-500 text-sm">{dest.reviewCount}</Td>
                        <Td><Badge status={dest.status} /></Td>
                        <Td>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="rounded accent-cyan-600 w-4 h-4"
                                checked={dest.isHiddenGem}
                                onChange={e => toggleHiddenGem(dest.id, e.target.checked)}
                            />
                            <span className="text-xs text-slate-500">{dest.isHiddenGem ? "Yes" : "No"}</span>
                          </label>
                        </Td>
                        <Td>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Btn variant="secondary" size="sm" onClick={() => openEdit(dest)}>Edit</Btn>
                            <Btn variant="danger" size="sm" onClick={() => setDeleteTarget(dest)}>
                              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                <path d="M3 4h10M6 4V3h4v1M5 4v9h6V4" />
                              </svg>
                            </Btn>
                          </div>
                        </Td>
                      </tr>
                  ))}
                  </tbody>
                </Table>
                <Pagination total={total} showing={filtered.length} page={page} perPage={20} onPage={setPage} />
              </>
          )}

          {/* Grid view */}
          {viewMode === "grid" && (
              <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map(dest => (
                    <div
                        key={dest.id}
                        onClick={() => openEdit(dest)}
                        className="border border-slate-100 rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="h-28 bg-gradient-to-br from-cyan-50 to-cyan-100 flex items-center justify-center text-cyan-400 relative overflow-hidden">
                        {dest.coverImage
                            ? <img src={dest.coverImage} alt={dest.name} className="absolute inset-0 w-full h-full object-cover" />
                            : <svg className="w-8 h-8" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M10 2C7.24 2 5 4.24 5 7c0 4.17 5 11 5 11s5-6.83 5-11c0-2.76-2.24-5-5-5z" /><circle cx="10" cy="7" r="1.5" /></svg>
                        }
                        {dest.images.length > 0 && (
                            <div className="absolute bottom-1.5 right-1.5 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                              +{dest.images.length}
                            </div>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="font-semibold text-slate-800 text-sm truncate">{dest.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5 mb-2">{dest.region}</div>
                        <div className="flex items-center justify-between">
                          {dest.avgRating > 0 && (
                              <span className="flex items-center gap-1 text-xs font-semibold">
                        <span className="text-amber-400">★</span>{dest.avgRating.toFixed(1)}
                      </span>
                          )}
                          <Badge status={dest.status} />
                        </div>
                      </div>
                    </div>
                ))}
                <div
                    onClick={openNew}
                    className="border-2 border-dashed border-cyan-200 rounded-xl flex flex-col items-center justify-center h-48 cursor-pointer text-cyan-400 hover:bg-cyan-50 transition-colors gap-2"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span className="text-sm font-medium">Add destination</span>
                </div>
              </div>
          )}
        </Card>

        {/* ── Modal ── */}
        <Modal
            open={modal}
            onClose={() => setModal(false)}
            title={editing ? `Edit: ${editing.name}` : "Add destination"}
            wide
            footer={
              <>
                <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
                <Btn variant="ghost" disabled={!!saving} onClick={submitAsDraft}>
                  {saving === "draft" ? "Saving…" : "Save as draft"}
                </Btn>
                <Btn variant="primary" disabled={!!saving} onClick={submitAsPublish}>
                  {saving === "active" ? "Publishing…" : "Publish"}
                </Btn>
              </>
            }
        >
          {/* Tab nav inside modal */}
          <div className="flex border-b border-slate-100 mb-5 -mx-1">
            {(["basic", "media", "tips"] as const).map(tab => (
                <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2.5 text-xs font-semibold capitalize transition-colors border-b-2 -mb-px ${
                        activeTab === tab
                            ? "border-cyan-600 text-cyan-600"
                            : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                >
                  {tab === "basic" ? "Basic info" : tab === "media" ? `Images (${imageFields.length})` : `Travel tips (${tipFields.length})`}
                </button>
            ))}
          </div>

          <form onSubmit={e => e.preventDefault()} className="flex flex-col gap-4">

            {/* ── Tab: Basic info ── */}
            {activeTab === "basic" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Destination name">
                      <input
                          {...register("name")}
                          className={`${inputCls} ${errorBorder(!!errors.name)}`}
                          placeholder="e.g. Lalibela"
                      />
                      <FieldError msg={errors.name?.message} />
                    </FormField>
                    <FormField label="Region">
                      <Controller
                          name="region"
                          control={control}
                          render={({ field }) => (
                              <Dropdown
                                  searchable
                                  options={REGION_OPTIONS}
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="Select region"
                                  width="w-full"
                              />
                          )}
                      />
                      <FieldError msg={errors.region?.message} />
                    </FormField>
                  </div>

                  <FormField label="Description">
                <textarea
                    {...register("description")}
                    className={`${inputCls} min-h-[90px] resize-y ${errorBorder(!!errors.description)}`}
                    placeholder="Rich description…"
                />
                    <FieldError msg={errors.description?.message} />
                  </FormField>

                  <FormField label="Categories">
                    <Controller
                        name="categories"
                        control={control}
                        render={({ field }) => (
                            <div className="flex gap-4 flex-wrap">
                              {CATEGORIES.map(cat => (
                                  <label key={cat} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="rounded accent-cyan-600"
                                        checked={field.value.includes(cat)}
                                        onChange={() => {
                                          const next = field.value.includes(cat)
                                              ? field.value.filter(c => c !== cat)
                                              : [...field.value, cat];
                                          field.onChange(next);
                                        }}
                                    />
                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                  </label>
                              ))}
                            </div>
                        )}
                    />
                    <FieldError msg={errors.categories?.message} />
                  </FormField>

                  <FormField label="Location">
                    <Controller
                        name="latitude"
                        control={control}
                        render={({ field: latField }) => (
                            <Controller
                                name="longitude"
                                control={control}
                                render={({ field: lngField }) => (
                                    <MapPicker
                                        latitude={latField.value ?? ""}
                                        longitude={lngField.value ?? ""}
                                        onChange={(lat, lng) => {
                                          latField.onChange(lat || "");
                                          lngField.onChange(lng || "");
                                        }}
                                    />
                                )}
                            />
                        )}
                    />
                    {(errors.latitude || errors.longitude) && (
                        <p className="text-xs text-red-500 mt-1">Invalid coordinates</p>
                    )}
                  </FormField>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Best time to visit">
                      <input {...register("bestTimeToVisit")} className={inputCls} placeholder="e.g. Oct–Feb" />
                    </FormField>
                    <FormField label="Status">
                      <Controller
                          name="status"
                          control={control}
                          render={({ field }) => (
                              <Dropdown
                                  options={STATUS_OPTIONS}
                                  value={field.value}
                                  onChange={v => field.onChange(v as "active" | "draft")}
                                  width="w-full"
                              />
                          )}
                      />
                    </FormField>
                  </div>

                  <Controller
                      name="isHiddenGem"
                      control={control}
                      render={({ field }) => (
                          <label className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded accent-cyan-600"
                                checked={field.value}
                                onChange={e => field.onChange(e.target.checked)}
                            />
                            Mark as Hidden Gem 💎
                          </label>
                      )}
                  />
                </>
            )}

            {/* ── Tab: Images ── */}
            {activeTab === "media" && (
                <div className="flex flex-col gap-3">
                  <Controller
                      name="images"
                      control={control}
                      render={({ field }) => (
                          <ImageUploader
                              value={field.value ?? []}
                              onChange={field.onChange}
                              folder="destinations"
                              maxImages={10}
                          />
                      )}
                  />
                  {errors.images && (
                      <p className="text-xs text-red-500">
                        {typeof errors.images.message === "string" ? errors.images.message : "Image error"}
                      </p>
                  )}
                </div>
            )}

            {/* ── Tab: Travel tips ── */}
            {activeTab === "tips" && (
                <div className="flex flex-col gap-4">
                  <p className="text-xs text-slate-500">
                    Add practical tips for travelers visiting this destination.
                  </p>

                  {tipFields.length === 0 && (
                      <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center text-slate-400 text-sm">
                        No travel tips yet. Add one below.
                      </div>
                  )}

                  {tipFields.map((field, i) => (
                      <div key={field.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-500">Tip {i + 1}</span>
                          <button
                              type="button"
                              onClick={() => removeTip(i)}
                              className="text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                              <path d="M3 3l10 10M13 3L3 13" />
                            </svg>
                          </button>
                        </div>
                        <input
                            {...register(`travelTips.${i}.title`)}
                            className={`${inputCls} ${errors.travelTips?.[i]?.title ? "border-red-400" : ""}`}
                            placeholder="Tip title (e.g. Best time to visit)"
                        />
                        {errors.travelTips?.[i]?.title && (
                            <p className="text-xs text-red-500">{errors.travelTips[i]?.title?.message}</p>
                        )}
                        <textarea
                            {...register(`travelTips.${i}.tip`)}
                            className={`${inputCls} min-h-[70px] resize-y ${errors.travelTips?.[i]?.tip ? "border-red-400" : ""}`}
                            placeholder="Practical advice for travelers…"
                        />
                        {errors.travelTips?.[i]?.tip && (
                            <p className="text-xs text-red-500">{errors.travelTips[i]?.tip?.message}</p>
                        )}
                      </div>
                  ))}

                  <button
                      type="button"
                      onClick={() => appendTip({ title: "", tip: "" })}
                      className="flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-700 font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M8 2v12M2 8h12" />
                    </svg>
                    Add travel tip
                  </button>
                </div>
            )}

          </form>
        </Modal>

        <DeleteDialog
            open={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={deleteDestination}
            title={`Delete "${deleteTarget?.name}"?`}
            description="This will permanently remove the destination and all associated data."
            requireConfirmText={deleteTarget?.name}
        />
      </div>
  );
}