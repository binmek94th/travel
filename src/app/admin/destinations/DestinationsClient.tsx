"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Badge, Btn, Table, Th, Td, Pagination,
  Card, Modal, FormField, inputCls, EmptyState,
} from "@/src/components/admin/ui";
import Dropdown, { DropdownOption } from "@/src/components/ui/Dropdown";
import DeleteDialog from "@/src/components/admin/DeleteDialog";

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
});

type FormValues = z.infer<typeof schema>;

// ── Types ─────────────────────────────────────────────────────────────────────
type Destination = {
  id: string; name: string; slug: string; region: string;
  categories: string[]; avgRating: number; reviewCount: number;
  isHiddenGem: boolean; status: string; coverImage: string | null;
  bestTimeToVisit: string;
  latitude: number;
  longitude: number;
  description: string;
};

// ── Dropdown option lists ─────────────────────────────────────────────────────
const CATEGORY_FILTER_OPTIONS: DropdownOption[] = [
  { label: "All categories", value: "all" },
  { label: "Culture",        value: "culture" },
  { label: "Nature",         value: "nature" },
  { label: "Adventure",      value: "adventure" },
  { label: "Religious",      value: "religious" },
];

const STATUS_FILTER_OPTIONS: DropdownOption[] = [
  { label: "All status", value: "all" },
  { label: "Active",     value: "active" },
  { label: "Draft",      value: "draft" },
];

const REGION_OPTIONS: DropdownOption[] = [
  "Amhara", "Tigray", "Oromia", "Afar",
  "Southern Nations", "Somali", "Addis Ababa", "Dire Dawa",
].map(r => ({ label: r, value: r }));

const STATUS_OPTIONS: DropdownOption[] = [
  { label: "Active", value: "active" },
  { label: "Draft",  value: "draft" },
];

const CATEGORIES = ["culture", "nature", "adventure", "religious"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1">{msg}</p>;
}

function errorBorder(hasError: boolean) {
  return hasError ? "border-red-400 focus:border-red-400 focus:ring-red-400/10" : "";
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DestinationsClient({
                                             destinations, total, hiddenGems,
                                           }: {
  destinations: Destination[]; total: number; hiddenGems: number;
}) {
  const router = useRouter();

  // filter state (not part of the form)
  const [search,       setSearch]  = useState("");
  const [catFilter,    setCat]     = useState("all");
  const [statusFilter, setStatus]  = useState("all");
  const [hiddenOnly,   setHidden]  = useState(false);
  const [viewMode,     setView]    = useState<"table" | "grid">("table");
  const [page,         setPage]    = useState(1);

  // modal state
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState<Destination | null>(null);
  const [saving,  setSaving]  = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Destination | null>(null);

  // ── React Hook Form ──────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:            "",
      region:          "",
      description:     "",
      categories:      [],
      latitude:        "",
      longitude:       "",
      bestTimeToVisit: "",
      status:          "draft",
      isHiddenGem:     false,
    },
  });

  // ── Filtering ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => destinations.filter(d => {
    const mSearch = !search ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.region.toLowerCase().includes(search.toLowerCase());
    const mCat    = catFilter === "all" || d.categories.includes(catFilter);
    const mStatus = statusFilter === "all" || d.status === statusFilter;
    const mHidden = !hiddenOnly || d.isHiddenGem;
    return mSearch && mCat && mStatus && mHidden;
  }), [destinations, search, catFilter, statusFilter, hiddenOnly]);

  async function deleteDestination() {
    if (!deleteTarget) return;
    await fetch(`/api/admin/destinations/${deleteTarget.id}`, { method: "DELETE" });
    router.refresh();
  }

  // ── Modal open helpers ───────────────────────────────────────────────────────
  function openNew() {
    setEditing(null);
    reset({
      name: "", region: "", description: "", categories: [],
      latitude: "", longitude: "", bestTimeToVisit: "",
      status: "draft", isHiddenGem: false,
    });
    setModal(true);
  }

  function openEdit(d: Destination) {
    console.log(d)
    setEditing(d);
    reset({
      name:            d.name            ?? "",
      region:          d.region          ?? "",
      description:     d.description ??  "",
      categories:      d.categories      ?? [],
      latitude:        d.latitude  ?? "",
      longitude:       d.longitude ?? "",
      bestTimeToVisit: d.bestTimeToVisit ?? "",
      status:          (d.status as "active" | "draft") ?? "draft",
      isHiddenGem:     d.isHiddenGem     ?? false,
    });
    setModal(true);
  }


  async function onSubmit(data: FormValues, overrideStatus?: "active" | "draft") {
    const payload = overrideStatus ? { ...data, status: overrideStatus } : data;
    setSaving(overrideStatus || "draft");
    try {
      const method = editing ? "PATCH" : "POST";
      const url    = editing
          ? `/api/admin/destinations/${editing.id}`
          : "/api/admin/destinations";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({id: editing?.id, ...payload}),
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

  // Footer buttons each call handleSubmit so validation always runs first.
  const submitAsDraft   = handleSubmit(d => onSubmit(d, "draft"));
  const submitAsPublish = handleSubmit(d => onSubmit(d, "active"));

  async function toggleHiddenGem(id: string, val: boolean) {
    await fetch(`/api/admin/destinations/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ isHiddenGem: val }),
    });
    router.refresh();
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
      <div className="flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2
                className="text-2xl font-light text-slate-800"
                style={{ fontFamily: "'Playfair Display',serif" }}
            >
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
                      className={`px-3 py-1.5 text-xs font-medium transition-colors
                  ${viewMode === m
                          ? "bg-cyan-600 text-white"
                          : "bg-white text-slate-500 hover:bg-slate-50"}`}
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
                            <div className="w-8 h-8 rounded-md bg-cyan-50 flex items-center justify-center text-cyan-500 flex-shrink-0">
                              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M10 2C7.24 2 5 4.24 5 7c0 4.17 5 11 5 11s5-6.83 5-11c0-2.76-2.24-5-5-5z" />
                                <circle cx="10" cy="7" r="1.5" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium text-slate-800 text-sm">{dest.name}</div>
                              {dest.coverImage && <div className="text-xs text-slate-400">Has cover photo</div>}
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
                          <span className="text-amber-400">★</span>
                                {dest.avgRating.toFixed(1)}
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
                      <div className="h-28 bg-gradient-to-br from-cyan-50 to-cyan-100 flex items-center justify-center text-cyan-400">
                        <svg className="w-8 h-8" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
                          <path d="M10 2C7.24 2 5 4.24 5 7c0 4.17 5 11 5 11s5-6.83 5-11c0-2.76-2.24-5-5-5z" />
                          <circle cx="10" cy="7" r="1.5" />
                        </svg>
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
                    className="border-2 border-dashed border-cyan-200 rounded-xl flex flex-col items-center
                justify-center h-48 cursor-pointer text-cyan-400 hover:bg-cyan-50 transition-colors gap-2"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span className="text-sm font-medium">Add destination</span>
                </div>
              </div>
          )}
        </Card>

        {/* Modal */}
        <Modal
            open={modal}
            onClose={() => setModal(false)}
            title={editing ? `Edit: ${editing.name}` : "Add destination"}
            wide
            footer={
              <>
                <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
                <Btn variant="ghost" disabled={!!saving} onClick={submitAsDraft}>
                  {saving === "draft" ? "Saving as draft" : "Save as draft"}
                </Btn>
                <Btn variant="primary" disabled={!!saving} onClick={submitAsPublish}>
                  {saving === "active" ? "Publishing…" : "Publish"}
                </Btn>
              </>
            }
        >
          {/* The form tag is here so Enter key works and semantics are correct,  */}
          {/* but submission is driven by the footer buttons via handleSubmit.    */}
          <form onSubmit={e => e.preventDefault()} className="flex flex-col gap-4">

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
                {/* Controller bridges the uncontrolled Dropdown into RHF */}
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

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Latitude">
                <input
                    {...register("latitude")}
                    type="number" step="any"
                    className={`${inputCls} ${errorBorder(!!errors.latitude)}`}
                    placeholder="e.g. 12.0319"
                />
                <FieldError msg={errors.latitude?.message} />
              </FormField>
              <FormField label="Longitude">
                <input
                    {...register("longitude")}
                    type="number" step="any"
                    className={`${inputCls} ${errorBorder(!!errors.longitude)}`}
                    placeholder="e.g. 39.0473"
                />
                <FieldError msg={errors.longitude?.message} />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Best time to visit">
                <input
                    {...register("bestTimeToVisit")}
                    className={inputCls}
                    placeholder="e.g. Oct–Feb"
                />
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

            <FormField label="Cover image">
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-5 text-center text-slate-400 text-sm cursor-pointer hover:bg-slate-50 transition-colors">
                📷 Drop image here or click to upload
                <div className="text-xs mt-1">JPG, PNG, WebP · max 10MB</div>
              </div>
            </FormField>

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