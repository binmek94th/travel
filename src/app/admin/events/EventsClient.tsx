"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Btn, Table, Th, Td, Pagination, Card, Modal,
  FormField, inputCls, EmptyState,
} from "@/src/components/admin/ui";
import Dropdown, { DropdownOption } from "@/src/components/ui/Dropdown";
import DeleteDialog from "@/src/components/admin/DeleteDialog";
import DatePicker from "@/src/components/ui/DatePicker";

// ── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  name:          z.string().min(2, "Name must be at least 2 characters"),
  type:          z.string().min(1, "Please select a type"),
  destinationId: z.string().min(1, "Please select a destination"),
  startDate:     z.string().min(1, "Start date is required"),
  endDate:       z.string().min(1, "End date is required"),
  description:   z.string().min(10, "Description must be at least 10 characters"),
  isBookable:    z.boolean(),
  linkedTourId:  z.string().nullable(),
}).refine(d => d.endDate >= d.startDate, {
  message: "End date must be on or after start date",
  path:    ["endDate"],
});

type FormValues = z.infer<typeof schema>;

// ── Types ─────────────────────────────────────────────────────────────────────
type Event = {
  id: string; name: string; type: string; destinationId: string;
  startDate: string; endDate: string; isBookable: boolean;
  linkedTourId: string | null; description: string;
};

type Destination = { id: string; name: string };
type Tour        = { id: string; title: string };

// ── Constants ─────────────────────────────────────────────────────────────────
const TYPE_OPTIONS: DropdownOption[] = [
  { label: "Festival",  value: "festival"  },
  { label: "Religious", value: "religious" },
  { label: "Food",      value: "food"      },
  { label: "Ceremony",  value: "ceremony"  },
];

const TYPE_FILTER_OPTIONS: DropdownOption[] = [
  { label: "All types", value: "all" },
  ...TYPE_OPTIONS,
];

const TYPE_COLORS: Record<string, string> = {
  religious: "bg-violet-50 text-violet-700 border-violet-200",
  festival:  "bg-cyan-50 text-cyan-700 border-cyan-200",
  food:      "bg-amber-50 text-amber-700 border-amber-200",
  ceremony:  "bg-emerald-50 text-emerald-700 border-emerald-200",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1">{msg}</p>;
}

function errorBorder(has: boolean) {
  return has ? "border-red-400 focus:border-red-400" : "";
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

type Props = {
  events: Event[];
  total: number;
  destinations: Destination[];
  tours: Tour[];
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function EventsClient({
                                       events, total, destinations, tours,
                                     }: Props) {
  const router = useRouter();

  // filter + pagination
  const [typeFilter,   setTypeFilter]   = useState("all");
  const [page,         setPage]         = useState(1);

  // modal + delete
  const [modal,        setModal]        = useState(false);
  const [editing,      setEditing]      = useState<Event | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);



  const tourOptions: DropdownOption[] = useMemo(() => [
    { label: "No linked tour", value: "" },
    ...(tours ?? []).map(t => ({
      label: t.title,
      value: t.id,
    })),
  ], [tours]);

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() =>
          events?.filter(e => typeFilter === "all" || e.type === typeFilter),
      [events, typeFilter],
  );

  const bookableCount = events?.filter(e => e.isBookable).length;

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
      name: "", type: "", destinationId: "",
      startDate: "", endDate: "",
      description: "", isBookable: false, linkedTourId: null,
    },
  });

  const isBookable = watch("isBookable");

  if (!destinations || destinations.length === 0) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-sm">
            <h2 className="text-lg font-semibold text-slate-800">
              No destinations found
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              Create a destination first before adding events.
            </p>

            <div className="mt-5">
              <Btn
                  variant="primary"
                  onClick={() => router.push("/admin/destinations")}
              >
                Go to destinations
              </Btn>
            </div>
          </div>
        </div>
    );
  }

  const destinationOptions: DropdownOption[] = useMemo(() =>
          destinations?.map(d => ({ label: d.name, value: d.id })),
      [destinations],
  );

  // ── Modal helpers ──────────────────────────────────────────────────────────
  function openNew() {
    setEditing(null);
    reset({
      name: "", type: "", destinationId: "",
      startDate: "", endDate: "",
      description: "", isBookable: false, linkedTourId: null,
    });
    setModal(true);
  }

  function openEdit(ev: Event) {
    setEditing(ev);
    reset({
      name:          ev.name          ?? "",
      type:          ev.type          ?? "",
      destinationId: ev.destinationId ?? "",
      startDate:     ev.startDate     ?? "",
      endDate:       ev.endDate       ?? "",
      description:   ev.description   ?? "",
      isBookable:    ev.isBookable     ?? false,
      linkedTourId:  ev.linkedTourId  ?? null,
    });
    setModal(true);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function onSubmit(data: FormValues) {
    // Convert empty string back to null for linkedTourId
    const payload = {
      ...data,
      linkedTourId: data.linkedTourId || null,
    };

    setSaving(true);
    try {
      const method = editing ? "PATCH" : "POST";
      const url    = editing
          ? `/api/admin/events/${editing.id}`
          : "/api/admin/events";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? res.statusText ?? "Request failed");
      }

      toast.success(editing ? "Event updated" : "Event created");
      setModal(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save event");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function deleteEvent() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/events/${deleteTarget.id}`, {
      method: "DELETE",
    });
    if (!res.ok) { toast.error("Failed to delete event"); return; }
    toast.success("Event deleted");
    router.refresh();
  }

  // ── Toggle bookable inline ────────────────────────────────────────────────
  async function toggleBookable(id: string, val: boolean) {
    const res = await fetch(`/api/admin/events/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ isBookable: val }),
    });
    if (!res.ok) { toast.error("Failed to update"); return; }
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
              Events
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {total} events · {bookableCount} bookable
            </p>
          </div>
          <Btn variant="primary" size="sm" onClick={openNew}>+ Add event</Btn>
        </div>

        <Card>
          {/* Filter bar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 flex-wrap">
            <p className="text-sm font-medium text-slate-600 mr-1">
              Festivals, ceremonies &amp; cultural experiences
            </p>
            <div className="ml-auto">
              <Dropdown
                  options={TYPE_FILTER_OPTIONS}
                  value={typeFilter}
                  onChange={setTypeFilter}
                  width="w-36"
              />
            </div>
          </div>

          <Table>
            <thead>
            <tr>
              <Th>Event</Th><Th>Type</Th><Th>Destination</Th>
              <Th>Date(s)</Th><Th>Bookable</Th><Th>Linked tour</Th>
              <Th className="w-24">Actions</Th>
            </tr>
            </thead>
            <tbody>
            {filtered?.length === 0 ? (
                <tr><td colSpan={7}>
                  <EmptyState
                      icon={<span className="text-2xl">🎉</span>}
                      title="No events yet"
                  />
                </td></tr>
            ) : filtered?.map(ev => {
              const destName = destinations.find(d => d.id === ev.destinationId)?.name ?? ev.destinationId;
              const tourTitle = tours.find(t => t.id === ev.linkedTourId)?.title ?? null;
              return (
                  <tr key={ev.id} className="hover:bg-slate-50/60 group transition-colors">
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-md bg-cyan-50 flex items-center justify-center text-base flex-shrink-0">
                          🎉
                        </div>
                        <div className="font-medium text-slate-800 text-sm">{ev.name}</div>
                      </div>
                    </Td>
                    <Td>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${TYPE_COLORS[ev.type] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {ev.type}
                    </span>
                    </Td>
                    <Td className="text-slate-500 text-sm">{destName}</Td>
                    <Td>
                      <div className="text-xs text-slate-600">{formatDate(ev.startDate)}</div>
                      {ev.endDate !== ev.startDate && (
                          <div className="text-xs text-slate-400">→ {formatDate(ev.endDate)}</div>
                      )}
                    </Td>
                    <Td>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            className="rounded accent-cyan-600 w-4 h-4"
                            checked={ev.isBookable}
                            onChange={e => toggleBookable(ev.id, e.target.checked)}
                        />
                        <span className="text-xs text-slate-500">{ev.isBookable ? "Yes" : "No"}</span>
                      </label>
                    </Td>
                    <Td className="text-xs">
                      {tourTitle
                          ? <span className="text-cyan-600 font-medium">{tourTitle}</span>
                          : <span className="text-slate-300">—</span>
                      }
                    </Td>
                    <Td>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Btn variant="ghost" size="sm" onClick={() => openEdit(ev)}>Edit</Btn>
                        <Btn variant="danger" size="sm" onClick={() => setDeleteTarget(ev)}>
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

          <Pagination total={total} showing={filtered?.length} page={page} perPage={20} onPage={setPage} />
        </Card>

        {/* Modal */}
        <Modal
            open={modal}
            onClose={() => setModal(false)}
            title={editing ? `Edit: ${editing.name}` : "Add event"}
            wide
            footer={
              <>
                <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
                <Btn variant="primary" disabled={saving} onClick={handleSubmit(onSubmit)}>
                  {saving ? "Saving…" : "Save event"}
                </Btn>
              </>
            }
        >
          <form onSubmit={e => e.preventDefault()} className="flex flex-col gap-4">

            <FormField label="Event name">
              <input
                  {...register("name")}
                  className={`${inputCls} ${errorBorder(!!errors.name)}`}
                  placeholder="e.g. Timkat Festival"
              />
              <FieldError msg={errors.name?.message} />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Type">
                <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                        <Dropdown
                            options={TYPE_OPTIONS}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select type"
                            width="w-full"
                        />
                    )}
                />
                <FieldError msg={errors.type?.message} />
              </FormField>

              <FormField label="Destination">
                <Controller
                    name="destinationId"
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
                <FieldError msg={errors.destinationId?.message} />
              </FormField>
            </div>

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
                            minDate={watch("startDate") || undefined}  
                            hasError={!!errors.endDate}
                        />
                    )}
                />
                <FieldError msg={errors.endDate?.message} />
              </FormField>
            </div>

            <FormField label="Description">
            <textarea
                {...register("description")}
                className={`${inputCls} min-h-[72px] resize-y ${errorBorder(!!errors.description)}`}
                placeholder="Describe the event…"
            />
              <FieldError msg={errors.description?.message} />
            </FormField>

            {/* Bookable toggle */}
            <Controller
                name="isBookable"
                control={control}
                render={({ field }) => (
                    <label className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer">
                      <input
                          type="checkbox"
                          className="w-4 h-4 rounded accent-cyan-600"
                          checked={field.value}
                          onChange={e => field.onChange(e.target.checked)}
                      />
                      Allow booking via linked tour
                    </label>
                )}
            />

            {/* Linked tour — only shown when bookable */}
            {isBookable && (
                <FormField label="Linked tour">
                  <Controller
                      name="linkedTourId"
                      control={control}
                      render={({ field }) => (
                          <Dropdown
                              searchable
                              options={tourOptions}
                              value={field.value ?? ""}
                              onChange={v => field.onChange(v || null)}
                              placeholder="Select a tour"
                              width="w-full"
                          />
                      )}
                  />
                  <FieldError msg={errors.linkedTourId?.message} />
                </FormField>
            )}

          </form>
        </Modal>

        {/* Delete dialog */}
        <DeleteDialog
            open={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={deleteEvent}
            title={`Delete "${deleteTarget?.name}"?`}
            description="This will permanently remove the event."
            requireConfirmText={deleteTarget?.name}
        />

      </div>
  );
}