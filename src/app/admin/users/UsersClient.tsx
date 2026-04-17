"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Badge, Btn, Table, Th, Td, AvatarCell, Pagination,
  Card, Tabs, Modal, FormField, inputCls, EmptyState,
} from "@/src/components/admin/ui";
import Dropdown, { DropdownOption } from "@/src/components/ui/Dropdown";
import DeleteDialog from "@/src/components/admin/DeleteDialog";
import NationalityDropdown, {NATIONALITY_OPTIONS} from "@/src/components/ui/NationalityDropdown";

// ── Schema ────────────────────────────────────────────────────────────────────
const editSchema = z.object({
  role:        z.enum(["traveler", "operator", "admin"]),
  emailVerified:  z.boolean(),
  nationality: z.string().optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

// ── Types ─────────────────────────────────────────────────────────────────────
type User = {
  id: string; displayName: string; email: string;
  role: string; emailVerified: boolean; nationality: string;
  photoURL: string | null; createdAt: string;
};

// ── Dropdown options ──────────────────────────────────────────────────────────
const ROLE_TABS = [
  { value: "all",      label: "All"       },
  { value: "traveler", label: "Travelers" },
  { value: "operator", label: "Operators" },
  { value: "admin",    label: "Admins"    },
];

const ROLE_FILTER_OPTIONS: DropdownOption[] = [
  { label: "All roles", value: "all"      },
  { label: "Traveler",  value: "traveler" },
  { label: "Operator",  value: "operator" },
  { label: "Admin",     value: "admin"    },
];

const ROLE_OPTIONS: DropdownOption[] = [
  { label: "Traveler", value: "traveler" },
  { label: "Operator", value: "operator" },
  { label: "Admin",    value: "admin"    },
];

// ── Inline role dropdown (table cell) ─────────────────────────────────────────
// Separate small dropdown just for the role cell — not full Dropdown component
// since it needs to be compact and inline
function RoleCell({ user, onPatch }: { user: User; onPatch: (id: string, body: Record<string, any>) => Promise<void> }) {
  const [open, setOpen]       = useState(false);
  const [saving, setSaving]   = useState(false);

  async function pick(role: string) {
    setOpen(false);
    if (role === user.role) return;
    setSaving(true);
    await onPatch(user.id, { role });
    setSaving(false);
  }

  const colors: Record<string, string> = {
    traveler: "bg-slate-100 text-slate-600 border-slate-200",
    operator: "bg-cyan-50 text-cyan-700 border-cyan-200",
    admin:    "bg-violet-50 text-violet-700 border-violet-200",
  };

  return (
      <div className="relative inline-block">
        <button
            type="button"
            onClick={() => setOpen(o => !o)}
            disabled={saving}
            className={`text-xs font-semibold px-2 py-0.5 rounded-full border cursor-pointer
          transition-opacity ${saving ? "opacity-50" : ""}
          ${colors[user.role] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}
        >
          {saving ? "…" : user.role}
          <span className="ml-1 opacity-50">▾</span>
        </button>

        {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute top-[calc(100%+4px)] left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden min-w-[120px]">
                {ROLE_OPTIONS.map(o => (
                    <button
                        key={o.value}
                        type="button"
                        onClick={() => pick(o.value)}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors
                  ${o.value === user.role
                            ? "text-cyan-600 font-medium bg-cyan-600/5"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      {o.label}
                    </button>
                ))}
              </div>
            </>
        )}
      </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1">{msg}</p>;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function UsersClient({
                                      users, total, currentPage, perPage,
                                    }: {
  users: User[]; total: number; currentPage: number; perPage: number;
}) {
  const router = useRouter();

  const [selected,     setSelected]     = useState<string[]>([]);
  const [editUser,     setEditUser]     = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [roleFilter,   setRole]         = useState("all");
  const [search,       setSearch]       = useState("");
  const [saving,       setSaving]       = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);


  console.log(users)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { role: "traveler", emailVerified: false, nationality: "" },
  });

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() =>
          users.filter(u => {
            const mRole   = roleFilter === "all" || u.role === roleFilter;
            const mSearch = !search ||
                u.displayName.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase());
            return mRole && mSearch;
          }),
      [users, roleFilter, search]);

  const allSelected = filtered.length > 0 && selected.length === filtered.length;

  // ── API helpers ────────────────────────────────────────────────────────────
  async function patchUser(id: string, body: Record<string, any>) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      throw new Error(b?.error ?? "Failed to update user");
    }
    router.refresh();
  }

  async function deleteUser() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete user");
    router.refresh();
  }

  async function bulkDelete() {
    if (!selected.length) return;
    setBulkDeleting(true);
    try {
      await Promise.all(
          selected.map(id =>
              fetch(`/api/admin/users/${id}`, { method: "DELETE" })
          )
      );
      toast.success(`${selected.length} user${selected.length !== 1 ? "s" : ""} deleted`);
      setSelected([]);
      router.refresh();
    } catch {
      toast.error("Some deletions failed");
    } finally {
      setBulkDeleting(false);
    }
  }

  // ── Modal helpers ──────────────────────────────────────────────────────────
  function openEdit(user: User) {
    setEditUser(user);
    reset({
      role:        user.role as "traveler" | "operator" | "admin",
      emailVerified:  user.emailVerified,
      nationality: user.nationality ?? "",
    });
  }

  async function onSubmit(data: EditFormValues) {
    if (!editUser) return;
    setSaving(true);
    try {
      await patchUser(editUser.id, data);
      toast.success("User updated");
      setEditUser(null);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
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
              Users
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {total.toLocaleString()} members across all roles
            </p>
          </div>
          <div className="flex gap-2">
            <Btn variant="ghost" size="sm">Export CSV</Btn>
            <Btn variant="primary" size="sm">
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 1v10M1 6h10" />
              </svg>
              Invite user
            </Btn>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total",     val: total,                                       color: "text-cyan-600"    },
            { label: "Travelers", val: users.filter(u => u.role === "traveler").length, color: "text-slate-700" },
            { label: "Operators", val: users.filter(u => u.role === "operator").length, color: "text-slate-700" },
            { label: "Email Verified",  val: users.filter(u => u.emailVerified).length,       color: "text-emerald-600" },
          ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{s.label}</div>
                <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.val.toLocaleString()}</div>
              </div>
          ))}
        </div>

        <Card>
          <Tabs tabs={ROLE_TABS} active={roleFilter} onChange={setRole} />

          {/* Filter bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-52">
                <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <circle cx="7" cy="7" r="5" /><path d="M12 12l3 3" />
                </svg>
                <input
                    className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
                    placeholder="Search name or email…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Dropdown
                  options={ROLE_FILTER_OPTIONS}
                  value={roleFilter}
                  onChange={setRole}
                  width="w-36"
              />
            </div>

            {selected.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{selected.length} selected</span>
                  <Btn
                      variant="danger"
                      size="sm"
                      disabled={bulkDeleting}
                      onClick={bulkDelete}
                  >
                    {bulkDeleting ? "Deleting…" : "Delete selected"}
                  </Btn>
                </div>
            )}
          </div>

          {/* Table */}
          <Table>
            <thead>
            <tr>
              <Th className="w-10">
                <input
                    type="checkbox"
                    className="rounded accent-cyan-600"
                    checked={allSelected}
                    onChange={e => setSelected(e.target.checked ? filtered.map(u => u.id) : [])}
                />
              </Th>
              <Th>User</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Nationality</Th>
              <Th>Joined</Th>
              <Th className="w-28">Actions</Th>
            </tr>
            </thead>
            <tbody>
            {filtered.length === 0 ? (
                <tr><td colSpan={7}>
                  <EmptyState
                      icon={
                        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <circle cx="8" cy="6" r="3" />
                          <path d="M2 18c0-3.31 2.69-6 6-6s6 2.69 6 6" />
                        </svg>
                      }
                      title="No users found"
                      text="Try adjusting your search or filters."
                  />
                </td></tr>
            ) : filtered.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/60 group transition-colors">
                  <Td>
                    <input
                        type="checkbox"
                        className="rounded accent-cyan-600"
                        checked={selected.includes(user.id)}
                        onChange={e => setSelected(prev =>
                            e.target.checked
                                ? [...prev, user.id]
                                : prev.filter(id => id !== user.id)
                        )}
                    />
                  </Td>
                  <Td>
                    <AvatarCell
                        name={user.displayName}
                        sub={user.email}
                        photoURL={user.photoURL}
                    />
                  </Td>
                  <Td>
                    <RoleCell user={user} onPatch={patchUser} />
                  </Td>
                  <Td>
                    <Badge status={user.emailVerified ? "verified" : "unverified"} />
                  </Td>
                  <Td className="text-slate-500 text-sm">{user.nationality || "—"}</Td>
                  <Td className="text-slate-400 text-xs">{user.createdAt}</Td>
                  <Td>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Btn variant="ghost" size="sm" onClick={() => openEdit(user)}>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" />
                        </svg>
                      </Btn>
                      <Btn variant="danger" size="sm" onClick={() => setDeleteTarget(user)}>
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

          <Pagination
              total={total}
              showing={filtered.length}
              page={currentPage}
              perPage={perPage}
              onPage={p => router.push(`?page=${p}`)}
          />
        </Card>

        {/* Edit modal */}
        <Modal
            open={!!editUser}
            onClose={() => setEditUser(null)}
            title={editUser?.displayName ?? "Edit user"}
            footer={
              <>
                <Btn variant="ghost" onClick={() => setEditUser(null)}>Cancel</Btn>
                <Btn variant="primary" disabled={saving} onClick={handleSubmit(onSubmit)}>
                  {saving ? "Saving…" : "Save changes"}
                </Btn>
              </>
            }
        >
          {editUser && (
              <form onSubmit={e => e.preventDefault()} className="flex flex-col gap-4">

                {/* Avatar header */}
                <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-700 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                    {editUser.displayName[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">{editUser.displayName}</div>
                    <div className="text-sm text-slate-500">{editUser.email}</div>
                    <div className="mt-1">
                      <Badge status={editUser.emailVerified ? "verified" : "unverified"} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Role">
                    <Controller
                        name="role"
                        control={control}
                        render={({ field }) => (
                            <Dropdown
                                options={ROLE_OPTIONS}
                                value={field.value}
                                onChange={v => field.onChange(v as "traveler" | "operator" | "admin")}
                                width="w-full"
                            />
                        )}
                    />
                    <FieldError msg={errors.role?.message} />
                  </FormField>

                  <FormField label="Nationality">
                    <Controller
                        name="nationality"
                        control={control}
                        render={({ field }) => (
                            <NationalityDropdown
                                value={field.value ?? ""}
                                onChange={field.onChange}
                            />
                        )}
                    />
                  </FormField>
                </div>

                <FormField label="Verified">
                  <Controller
                      name="emailVerified"
                      control={control}
                      render={({ field }) => (
                          <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-600">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded accent-cyan-600"
                                checked={field.value}
                                onChange={e => field.onChange(e.target.checked)}
                            />
                            Email address confirmed
                          </label>
                      )}
                  />
                </FormField>

                <FormField label="UID">
                  <input
                      className={`${inputCls} font-mono text-xs text-slate-400`}
                      value={editUser.id}
                      readOnly
                  />
                </FormField>

                <p className="text-xs text-slate-400">Joined {editUser.createdAt}</p>
              </form>
          )}
        </Modal>

        {/* Delete dialog */}
        <DeleteDialog
            open={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={deleteUser}
            title={`Delete "${deleteTarget?.displayName}"?`}
            description="This permanently deletes the user from Firebase Auth and Firestore. This cannot be undone."
            requireConfirmText={deleteTarget?.displayName}
        />

      </div>
  );
}