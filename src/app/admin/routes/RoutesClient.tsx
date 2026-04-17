"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Badge, Btn, Card, Modal, FormField, inputCls, EmptyState,
} from "@/src/components/admin/ui";
import Dropdown, { DropdownOption } from "@/src/components/ui/Dropdown";
import DeleteDialog from "@/src/components/admin/DeleteDialog";

// ── Schema ────────────────────────────────────────────────────────────────────
const stopSchema = z.object({
  destinationId: z.string().min(1, "Select a destination"),
  days:          z.coerce.number().min(1, "At least 1 day"),
  notes:         z.string().optional(),
});

const schema = z.object({
  name:               z.string().min(3, "Name must be at least 3 characters"),
  description:        z.string().min(10, "Description must be at least 10 characters"),
  status:             z.enum(["active", "draft"]),
  stops:              z.array(stopSchema).min(1, "Add at least one stop"),
  recommendedTourIds: z.array(z.string()),
});

type StopValues  = z.infer<typeof stopSchema>;
type FormValues  = z.infer<typeof schema>;

// ── Types ─────────────────────────────────────────────────────────────────────
type Stop = { destinationId: string; days: number; notes?: string };

type Route = {
  id: string; name: string; description: string;
  stops: Stop[]; totalDays: number; status: string;
  recommendedTourIds: string[];
};

type Destination = { id: string; name: string };
type Tour        = { id: string; title: string };

// ── Dropdown options ──────────────────────────────────────────────────────────
const STATUS_OPTIONS: DropdownOption[] = [
  { label: "Active", value: "active" },
  { label: "Draft",  value: "draft"  },
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
export default function RoutesClient({
                                       routes, total, destinations, tours,
                                     }: {
  routes: Route[]; total: number;
  destinations: Destination[]; tours: Tour[];
}) {
  const router = useRouter();

  const [modal,        setModal]        = useState(false);
  const [editing,      setEditing]      = useState<Route | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Route | null>(null);

  const destinationOptions: DropdownOption[] = destinations.map(d => ({
    label: d.name, value: d.id,
  }));

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
      name: "", description: "", status: "draft",
      stops: [{ destinationId: "", days: 1, notes: "" }],
      recommendedTourIds: [],
    },
  });

  // useFieldArray manages the dynamic stops list
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "stops",
  });

  const watchedStops = watch("stops");
  const totalDays    = watchedStops.reduce((sum, s) => sum + (Number(s.days) || 0), 0);
  const selectedTourIds = watch("recommendedTourIds");

  // ── Modal helpers ──────────────────────────────────────────────────────────
  function openNew() {
    setEditing(null);
    reset({
      name: "", description: "", status: "draft",
      stops: [{ destinationId: "", days: 1, notes: "" }],
      recommendedTourIds: [],
    });
    setModal(true);
  }

  function openEdit(r: Route) {
    setEditing(r);
    reset({
      name:               r.name        ?? "",
      description:        r.description ?? "",
      status:             (r.status as "active" | "draft") ?? "draft",
      stops:              r.stops.length
          ? r.stops.map(s => ({ destinationId: s.destinationId, days: s.days ?? 1, notes: s.notes ?? "" }))
          : [{ destinationId: "", days: 1, notes: "" }],
      recommendedTourIds: r.recommendedTourIds ?? [],
    });
    setModal(true);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function onSubmit(data: FormValues) {
    // Derive totalDays from stops sum
    const payload = {
      ...data,
      totalDays: data.stops.reduce((sum, s) => sum + Number(s.days), 0),
    };

    setSaving(true);
    try {
      const method = editing ? "PATCH" : "POST";
      const url    = editing
          ? `/api/admin/routes/${editing.id}`
          : "/api/admin/routes";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? res.statusText ?? "Request failed");
      }

      toast.success(editing ? "Route updated" : "Route created");
      setModal(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save route");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function deleteRoute() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/routes/${deleteTarget.id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed to delete route"); return; }
    toast.success("Route deleted");
    router.refresh();
  }

  // ── Tour toggle helper ────────────────────────────────────────────────────
  function toggleTour(tourId: string, current: string[], onChange: (v: string[]) => void) {
    onChange(
        current.includes(tourId)
            ? current.filter(id => id !== tourId)
            : [...current, tourId],
    );
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
              Travel Routes
            </h2>
            <p className="text-sm text-slate-500 mt-1">{total} curated routes</p>
          </div>
          <Btn variant="primary" size="sm" onClick={openNew}>+ New route</Btn>
        </div>

        {/* Grid */}
        {routes.length === 0 ? (
            <Card>
              <EmptyState
                  icon={
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 10h14M10 3l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  }
                  title="No routes yet"
              />
            </Card>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {routes.map(route => (
                  <Card key={route.id}>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="font-semibold text-slate-800 text-sm leading-tight">{route.name}</div>
                        <Badge status={route.status} />
                      </div>

                      <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">
                        {route.description}
                      </p>

                      {/* Stop chain */}
                      {route.stops.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap mb-4">
                            {route.stops.map((stop, i) => {
                              const destName = destinations.find(d => d.id === stop.destinationId)?.name ?? stop.destinationId;
                              return (
                                  <div key={i} className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-100 px-2 py-0.5 rounded-full">
                            {destName}
                          </span>
                                    {i < route.stops.length - 1 && (
                                        <svg className="w-3 h-3 text-slate-300 flex-shrink-0" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                                          <path d="M2 5h6M6 3l2 2-2 2" />
                                        </svg>
                                    )}
                                  </div>
                              );
                            })}
                          </div>
                      )}

                      {/* Stats + actions */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                        <div className="flex gap-4">
                          {[
                            { label: "Days",  value: route.totalDays            },
                            { label: "Stops", value: route.stops.length         },
                            { label: "Tours", value: route.recommendedTourIds.length },
                          ].map(({ label, value }) => (
                              <div key={label}>
                                <div className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</div>
                                <div className="font-semibold text-slate-700 text-sm">{value}</div>
                              </div>
                          ))}
                        </div>
                        <div className="flex gap-1.5">
                          <Btn variant="ghost" size="sm" onClick={() => openEdit(route)}>Edit</Btn>
                          <Btn variant="danger" size="sm" onClick={() => setDeleteTarget(route)}>
                            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                              <path d="M3 4h10M5 4v9h6V4M6 4V3h4v1" />
                            </svg>
                          </Btn>
                        </div>
                      </div>
                    </div>
                  </Card>
              ))}

              {/* Add tile */}
              <div
                  onClick={openNew}
                  className="border-2 border-dashed border-cyan-200 rounded-xl flex flex-col items-center
              justify-center min-h-[200px] cursor-pointer text-cyan-400 hover:bg-cyan-50 transition-colors gap-2"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span className="text-sm font-medium">Create new route</span>
              </div>
            </div>
        )}

        {/* Modal */}
        <Modal
            open={modal}
            onClose={() => setModal(false)}
            title={editing ? `Edit: ${editing.name}` : "New route"}
            wide
            footer={
              <>
                <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
                <Btn variant="primary" disabled={saving} onClick={handleSubmit(onSubmit)}>
                  {saving ? "Saving…" : "Save route"}
                </Btn>
              </>
            }
        >
          <form onSubmit={e => e.preventDefault()} className="flex flex-col gap-5">

            {/* Basic info */}
            <FormField label="Route name">
              <input
                  {...register("name")}
                  className={`${inputCls} ${errorBorder(!!errors.name)}`}
                  placeholder="e.g. Northern Historic Circuit"
              />
              <FieldError msg={errors.name?.message} />
            </FormField>

            <FormField label="Description">
            <textarea
                {...register("description")}
                className={`${inputCls} min-h-[72px] resize-y ${errorBorder(!!errors.description)}`}
                placeholder="Brief description of the route…"
            />
              <FieldError msg={errors.description?.message} />
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
                          width="w-48"
                      />
                  )}
              />
            </FormField>

            {/* ── Stops ──────────────────────────────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stops</p>
                  {totalDays > 0 && (
                      <p className="text-xs text-slate-400 mt-0.5">{totalDays} total days</p>
                  )}
                </div>
                <Btn
                    variant="secondary"
                    size="sm"
                    onClick={() => append({ destinationId: "", days: 1, notes: "" })}
                >
                  + Add stop
                </Btn>
              </div>

              <FieldError msg={errors.stops?.message ?? (errors.stops?.root as any)?.message} />

              <div className="flex flex-col gap-3">
                {fields.map((field, index) => (
                    <div
                        key={field.id}
                        className="border border-slate-200 rounded-lg p-3 flex flex-col gap-3 bg-slate-50/50"
                    >
                      {/* Stop header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* Drag handle (visual only) */}
                          <div className="flex flex-col gap-0.5 cursor-grab opacity-40">
                            {[0,1,2].map(i => (
                                <div key={i} className="w-3.5 h-px bg-slate-400" />
                            ))}
                          </div>
                          <span className="text-xs font-semibold text-slate-500">
                        Stop {index + 1}
                      </span>
                        </div>
                        <div className="flex gap-1">
                          {/* Move up */}
                          {index > 0 && (
                              <button
                                  type="button"
                                  onClick={() => move(index, index - 1)}
                                  className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:bg-slate-200 transition-colors"
                              >
                                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                  <path d="M6 9V3M3 6l3-3 3 3" />
                                </svg>
                              </button>
                          )}
                          {/* Move down */}
                          {index < fields.length - 1 && (
                              <button
                                  type="button"
                                  onClick={() => move(index, index + 1)}
                                  className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:bg-slate-200 transition-colors"
                              >
                                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                  <path d="M6 3v6M3 6l3 3 3-3" />
                                </svg>
                              </button>
                          )}
                          {/* Remove */}
                          {fields.length > 1 && (
                              <button
                                  type="button"
                                  onClick={() => remove(index)}
                                  className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:bg-red-50 transition-colors"
                              >
                                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                  <path d="M2 2l8 8M10 2L2 10" />
                                </svg>
                              </button>
                          )}
                        </div>
                      </div>

                      {/* Destination + days */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <Controller
                              name={`stops.${index}.destinationId`}
                              control={control}
                              render={({ field }) => (
                                  <Dropdown
                                      searchable
                                      options={destinationOptions}
                                      value={field.value}
                                      onChange={field.onChange}
                                      placeholder="Select destination"
                                      width="w-full"
                                  />
                              )}
                          />
                          <FieldError msg={errors.stops?.[index]?.destinationId?.message} />
                        </div>
                        <div>
                          <input
                              {...register(`stops.${index}.days`)}
                              type="number" min="1"
                              placeholder="Days"
                              className={`${inputCls} ${errorBorder(!!errors.stops?.[index]?.days)}`}
                          />
                          <FieldError msg={errors.stops?.[index]?.days?.message} />
                        </div>
                      </div>

                      {/* Notes */}
                      <input
                          {...register(`stops.${index}.notes`)}
                          className={inputCls}
                          placeholder="Optional notes (e.g. must-see sites, accommodation)…"
                      />
                    </div>
                ))}
              </div>
            </div>

            {/* ── Recommended tours ─────────────────────────────────────────── */}
            {tours.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Recommended tours
                  </p>
                  <Controller
                      name="recommendedTourIds"
                      control={control}
                      render={({ field }) => (
                          <div className="grid grid-cols-1 gap-2">
                            {tours.map(tour => {
                              const checked = field.value.includes(tour.id);
                              return (
                                  <label
                                      key={tour.id}
                                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                            ${checked
                                          ? "border-cyan-200 bg-cyan-50/60"
                                          : "border-slate-200 hover:bg-slate-50"
                                      }`}
                                  >
                                    <input
                                        type="checkbox"
                                        className="rounded accent-cyan-600 w-4 h-4 flex-shrink-0"
                                        checked={checked}
                                        onChange={() => toggleTour(tour.id, field.value, field.onChange)}
                                    />
                                    <span className="text-sm text-slate-700 leading-tight">{tour.title}</span>
                                    {checked && (
                                        <span className="ml-auto text-[10px] font-semibold text-cyan-600 bg-cyan-100 px-2 py-0.5 rounded-full">
                              Selected
                            </span>
                                    )}
                                  </label>
                              );
                            })}
                          </div>
                      )}
                  />
                  {selectedTourIds.length > 0 && (
                      <p className="text-xs text-slate-400 mt-2">
                        {selectedTourIds.length} tour{selectedTourIds.length !== 1 ? "s" : ""} selected
                      </p>
                  )}
                </div>
            )}

          </form>
        </Modal>

        {/* Delete dialog */}
        <DeleteDialog
            open={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={deleteRoute}
            title={`Delete "${deleteTarget?.name}"?`}
            description="This will permanently remove the route and all its stops."
            requireConfirmText={deleteTarget?.name}
        />

      </div>
  );
}