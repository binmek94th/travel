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
  title:          z.string().min(3, "Title must be at least 3 characters"),
  category:       z.string().min(1, "Please select a category"),
  slug:           z.string()
      .min(3, "Slug must be at least 3 characters")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"),
  seoDescription: z.string().max(160, "Keep under 160 characters for best SEO").optional(),
  status:         z.enum(["draft", "published"]),
});

type FormValues = z.infer<typeof schema>;

// ── Types ─────────────────────────────────────────────────────────────────────
type Guide = {
  id: string; title: string; slug: string; category: string;
  status: string; seoTitle: string; seoDescription: string; publishedAt: string;
};

// ── Dropdown options ──────────────────────────────────────────────────────────
const CATEGORY_OPTIONS: DropdownOption[] = [
  { label: "Itinerary",    value: "itinerary" },
  { label: "Culture",      value: "culture"   },
  { label: "Travel tips",  value: "tips"      },
  { label: "Food",         value: "food"      },
  { label: "History",      value: "history"   },
];

const STATUS_OPTIONS: DropdownOption[] = [
  { label: "Draft",     value: "draft"     },
  { label: "Published", value: "published" },
];

// ── Category badge colors ─────────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  itinerary: "bg-cyan-50 text-cyan-700 border-cyan-200",
  culture:   "bg-violet-50 text-violet-700 border-violet-200",
  tips:      "bg-amber-50 text-amber-700 border-amber-200",
  food:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  history:   "bg-rose-50 text-rose-700 border-rose-200",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1">{msg}</p>;
}

function errorBorder(hasError: boolean) {
  return hasError ? "border-red-400 focus:border-red-400" : "";
}

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function GuidesClient({
                                       guides, total, draftCount,
                                     }: {
  guides: Guide[]; total: number; draftCount: number;
}) {
  const router = useRouter();

  // filter + pagination
  const [filter, setFilter] = useState("all");
  const [page,   setPage]   = useState(1);

  // modal + delete
  const [modal,        setModal]        = useState(false);
  const [editing,      setEditing]      = useState<Guide | null>(null);
  const [saving,       setSaving]       = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Guide | null>(null);

  const filtered = useMemo(
      () => guides.filter(g => filter === "all" || g.status === filter),
      [guides, filter],
  );

  // ── RHF ───────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "", category: "", slug: "", seoDescription: "", status: "draft",
    },
  });

  const seoDesc = watch("seoDescription") ?? "";

  // ── Modal helpers ──────────────────────────────────────────────────────────
  function openNew() {
    setEditing(null);
    reset({ title: "", category: "", slug: "", seoDescription: "", status: "draft" });
    setModal(true);
  }

  function openEdit(g: Guide) {
    setEditing(g);
    reset({
      title:          g.title          ?? "",
      category:       g.category       ?? "",
      slug:           g.slug           ?? "",
      seoDescription: g.seoDescription ?? "",
      status:         (g.status as "draft" | "published") ?? "draft",
    });
    setModal(true);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function onSubmit(data: FormValues, overrideStatus?: "draft" | "published") {
    const payload = {
      ...data,
      status: overrideStatus ?? data.status,
      ...(overrideStatus === "published" ? { publishedAt: new Date().toISOString() } : {}),
    };

    setSaving(overrideStatus || "draft");
    try {
      const method = editing ? "PATCH" : "POST";
      const url    = editing ? `/api/admin/guides/${editing.id}` : "/api/admin/guides";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? res.statusText ?? "Request failed");
      }

      toast.success(editing ? "Guide updated" : "Guide created");
      setModal(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save guide");
    } finally {
      setSaving("");
    }
  }

  const submitAsDraft   = handleSubmit(d => onSubmit(d, "draft"));
  const submitAsPublish = handleSubmit(d => onSubmit(d, "published"));

  // ── Row actions ────────────────────────────────────────────────────────────
  async function quickPublish(id: string) {
    const res = await fetch(`/api/admin/guides/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: "published", publishedAt: new Date().toISOString() }),
    });
    if (!res.ok) { toast.error("Failed to publish guide"); return; }
    toast.success("Guide published");
    router.refresh();
  }

  async function deleteGuide() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/guides/${deleteTarget.id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed to delete guide"); return; }
    toast.success("Guide deleted");
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
              Guides & Blog
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {total} articles · {draftCount} drafts
            </p>
          </div>
          <Btn variant="primary" size="sm" onClick={openNew}>+ New guide</Btn>
        </div>

        <Card>
          <Tabs
              tabs={[
                { value: "all",       label: "All"       },
                { value: "published", label: "Published" },
                { value: "draft",     label: "Drafts", count: draftCount },
              ]}
              active={filter}
              onChange={setFilter}
          />

          <Table>
            <thead>
            <tr>
              <Th>Title</Th>
              <Th>Category</Th>
              <Th>Status</Th>
              <Th>Published</Th>
              <Th className="w-36">Actions</Th>
            </tr>
            </thead>
            <tbody>
            {filtered.length === 0 ? (
                <tr><td colSpan={5}>
                  <EmptyState
                      icon={<span className="text-2xl">📖</span>}
                      title="No guides yet"
                  />
                </td></tr>
            ) : filtered.map(g => (
                <tr key={g.id} className="hover:bg-slate-50/60 group transition-colors">
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-cyan-50 flex items-center justify-center text-base flex-shrink-0">
                        📖
                      </div>
                      <div>
                        <div className="font-medium text-slate-800 text-sm truncate max-w-[260px]">
                          {g.title}
                        </div>
                        <div className="text-xs text-slate-400">{g.slug}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${CAT_COLORS[g.category] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                    {g.category}
                  </span>
                  </Td>
                  <Td><Badge status={g.status} /></Td>
                  <Td className="text-slate-400 text-xs">{g.publishedAt || "—"}</Td>
                  <Td>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Btn variant="ghost" size="sm" onClick={() => openEdit(g)}>Edit</Btn>
                      {g.status === "draft" && (
                          <Btn variant="primary" size="sm" onClick={() => quickPublish(g.id)}>
                            Publish
                          </Btn>
                      )}
                      <Btn variant="danger" size="sm" onClick={() => setDeleteTarget(g)}>
                        <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M3 4h10M5 4v9h6V4M6 4V3h4v1" />
                        </svg>
                      </Btn>
                    </div>
                  </Td>
                </tr>
            ))}
            </tbody>
          </Table>

          <Pagination total={total} showing={filtered.length} page={page} perPage={20} onPage={setPage} />
        </Card>

        {/* Add / Edit modal */}
        <Modal
            open={modal}
            onClose={() => setModal(false)}
            title={editing ? "Edit guide" : "New guide"}
            wide
            footer={
              <>
                <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
                <Btn variant="ghost" disabled={!!saving} onClick={submitAsDraft}>
                  {saving === "draft" ? "Saving…" : "Save draft"}
                </Btn>
                <Btn variant="primary" disabled={!!saving} onClick={submitAsPublish}>
                  {saving === "published" ? "Publishing…" : "Publish"}
                </Btn>
              </>
            }
        >
          <form onSubmit={e => e.preventDefault()} className="flex flex-col gap-4">

            <FormField label="Title">
              <input
                  {...register("title", {
                    onChange: e => {
                      // Auto-generate slug when creating a new guide
                      if (!editing) setValue("slug", slugify(e.target.value), { shouldValidate: true });
                    },
                  })}
                  className={`${inputCls} ${errorBorder(!!errors.title)}`}
                  placeholder="Guide title…"
              />
              <FieldError msg={errors.title?.message} />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Category">
                <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                        <Dropdown
                            options={CATEGORY_OPTIONS}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select category"
                            width="w-full"
                        />
                    )}
                />
                <FieldError msg={errors.category?.message} />
              </FormField>

              <FormField label="Slug">
                <input
                    {...register("slug")}
                    className={`${inputCls} ${errorBorder(!!errors.slug)} font-mono text-sm`}
                    placeholder="url-friendly-slug"
                />
                <FieldError msg={errors.slug?.message} />
              </FormField>
            </div>

            <FormField label="Status">
              <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                      <Dropdown
                          options={STATUS_OPTIONS}
                          value={field.value}
                          onChange={v => field.onChange(v as "draft" | "published")}
                          width="w-48"
                      />
                  )}
              />
            </FormField>

            <FormField label="SEO description">
            <textarea
                {...register("seoDescription")}
                className={`${inputCls} min-h-[64px] resize-y ${errorBorder(!!errors.seoDescription)}`}
                placeholder="Meta description for search engines…"
            />
              {/* Live character counter — turns red at 160 */}
              <div className="flex items-center justify-between mt-1">
                <FieldError msg={errors.seoDescription?.message} />
                <span className={`text-xs ml-auto tabular-nums ${seoDesc.length > 160 ? "text-red-500" : "text-slate-400"}`}>
                {seoDesc.length}/160
              </span>
              </div>
            </FormField>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-400 text-center">
              Rich text editor (Tiptap / Lexical) renders here
            </div>

          </form>
        </Modal>

        {/* Delete dialog */}
        <DeleteDialog
            open={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={deleteGuide}
            title={`Delete "${deleteTarget?.title}"?`}
            description="This will permanently remove the guide and its content."
            requireConfirmText={deleteTarget?.title}
        />

      </div>
  );
}