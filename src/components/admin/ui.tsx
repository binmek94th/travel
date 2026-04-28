import { type ReactNode } from "react";

/* ── Status badge ── */
const BADGE_VARIANTS: Record<string, string> = {
  active:    "bg-green-50 text-green-700 border border-green-200",
  confirmed: "bg-green-50 text-green-700 border border-green-200",
  completed: "bg-green-50 text-green-700 border border-green-200",
  published: "bg-green-50 text-green-700 border border-green-200",

  pending:     "bg-yellow-50 text-yellow-800 border border-yellow-200",
  processing:  "bg-yellow-50 text-yellow-800 border border-yellow-200",
  paid:        "bg-blue-50  text-blue-700  border border-blue-200",
  upcoming:    "bg-blue-50  text-blue-700  border border-blue-200",

  draft:     "bg-slate-100 text-slate-600 border border-slate-200",
  archived:  "bg-slate-100 text-slate-600 border border-slate-200",
  expired:   "bg-slate-100 text-slate-600 border border-slate-200",
  removed:   "bg-slate-100 text-slate-600 border border-slate-200",
  open:      "bg-slate-100 text-slate-600 border border-slate-200",

  cancelled: "bg-red-50  text-red-700  border border-red-200",
  blocked:   "bg-red-50  text-red-700  border border-red-200",
  flagged:   "bg-red-50  text-red-700  border border-red-200",
  refunded:  "bg-red-50  text-red-700  border border-red-200",
  failed:    "bg-red-50  text-red-700  border border-red-200",
  removed_v: "bg-red-50  text-red-700  border border-red-200",

  verified:   "bg-cyan-50  text-cyan-700  border border-cyan-200",
  live:       "bg-cyan-50  text-cyan-700  border border-cyan-200",
  succeeded:  "bg-cyan-50  text-cyan-700  border border-cyan-200",
  unverified: "bg-slate-100 text-slate-500 border border-slate-200",

  premium:  "bg-amber-50 text-amber-700 border border-amber-200",
  standard: "bg-slate-100 text-slate-600 border border-slate-200",
};

export function Badge({ status }: { status: string }) {
  const cls = BADGE_VARIANTS[status.toLowerCase()] ?? "bg-slate-100 text-slate-600 border border-slate-200";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

/* ── Button ── */
type BtnVariant = "primary" | "secondary" | "ghost" | "danger";

const BTN: Record<BtnVariant, string> = {
  primary:   "bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm",
  secondary: "bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200",
  ghost:     "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200",
  danger:    "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200",
};

export function Btn({
  variant = "primary",
  size = "md",
  onClick,
  disabled,
  type = "button",
  children,
  className = "",
}: {
  variant?: BtnVariant;
  size?: "sm" | "md";
  onClick?: any;
  disabled?: boolean;
  type?: "button" | "submit";
  children: ReactNode;
  className?: string;
}) {
  const sz = size === "sm" ? "px-3 py-1.5 text-xs gap-1" : "px-4 py-2 text-sm gap-1.5";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center rounded-lg font-medium transition-all duration-150
        disabled:opacity-40 disabled:cursor-not-allowed ${BTN[variant]} ${sz} ${className}`}
    >
      {children}
    </button>
  );
}

/* ── Table wrapper ── */
export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  );
}

export function Th({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <th className={`bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wide
      px-4 py-2.5 text-left border-b border-slate-100 whitespace-nowrap ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, className = "", onClick }: { children: ReactNode; className?: string; onClick?: any }) {
  return (
    <td onClick={onClick} className={`px-4 py-3 border-b border-slate-50 align-middle ${className}`}>
      {children}
    </td>
  );
}

/* ── Avatar cell ── */
export function AvatarCell({
  name,
  sub,
  photoURL,
  square = false,
}: {
  name: string;
  sub?: string;
  photoURL?: string | null;
  square?: boolean;
}) {
  const initial = (name?.[0] ?? "?").toUpperCase();
  return (
    <div className="flex items-center gap-2.5">
      <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center
        text-xs font-semibold text-white bg-gradient-to-br from-cyan-500 to-cyan-700
        overflow-hidden ${square ? "rounded-md" : "rounded-full"}`}>
        {photoURL
          ? <img src={photoURL} alt={name} className="w-full h-full object-cover" />
          : initial}
      </div>
      <div>
        <div className="font-medium text-slate-800 text-sm leading-tight">{name}</div>
        {sub && <div className="text-xs text-slate-400 leading-tight">{sub}</div>}
      </div>
    </div>
  );
}

/* ── Pagination ── */
export function Pagination({
  total,
  showing,
  page,
  perPage,
  onPage,
}: {
  total: number;
  showing: number;
  page: number;
  perPage: number;
  onPage: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / perPage);
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-500 flex-wrap gap-2">
      <span>Showing {showing} of {total?.toLocaleString()}</span>
      <div className="flex items-center gap-1">
        {pages.map(p => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`w-7 h-7 rounded-md text-xs font-medium transition-colors
              ${page === p
                ? "bg-cyan-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
          >
            {p}
          </button>
        ))}
        {totalPages > 5 && <span className="px-1">…</span>}
      </div>
    </div>
  );
}

/* ── Card ── */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-xl border border-slate-100 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 gap-3 flex-wrap">
      <div>
        <div className="font-semibold text-slate-800 text-sm">{title}</div>
        {subtitle && <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>}
      </div>
      {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
    </div>
  );
}

/* ── Stat card ── */
export function StatCard({
  label,
  value,
  delta,
  up,
  gradient,
}: {
  label: string;
  value: string | number;
  delta?: string;
  up?: boolean;
  gradient: string;
}) {
  return (
    <div className={`${gradient} rounded-xl p-5 text-white relative overflow-hidden`}>
      <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/[0.06]" />
      <div className="text-xs font-semibold uppercase tracking-widest opacity-75">{label}</div>
      <div className="text-3xl font-bold mt-2 mb-1 tracking-tight">{value}</div>
      {delta && (
        <div className="text-xs opacity-70">
          {up !== undefined && (up ? "↑ " : "↓ ")}{delta}
        </div>
      )}
    </div>
  );
}

/* ── Tabs ── */
export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { value: string; label: string; count?: number }[];
  active: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex border-b border-slate-100 px-4">
      {tabs.map(t => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap
            ${active === t.value
              ? "border-cyan-600 text-cyan-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
        >
          {t.label}
          {t.count !== undefined && t.count > 0 && (
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold
              ${active === t.value ? "bg-cyan-600 text-white" : "bg-slate-200 text-slate-600"}`}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ── Empty state ── */
export function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3 text-center text-slate-500">
      <div className="w-12 h-12 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-500">
        {icon}
      </div>
      <div className="font-semibold text-slate-600 text-sm">{title}</div>
      {text && <div className="text-xs max-w-xs leading-relaxed">{text}</div>}
    </div>
  );
}

/* ── Modal ── */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto
          animate-in slide-in-from-bottom-4 duration-200 ${wide ? "max-w-2xl" : "max-w-lg"}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center
              text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">{footer}</div>
        )}
      </div>
    </div>
  );
}

/* ── Form fields ── */
export function FormField({
  label,
  children,
    hint: string,
}: {
  label: string;
  children: ReactNode;
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
      {children}
      <label className={"text-xs text-green-500"}></label>
    </div>
  );
}

export const inputCls =
  "w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm " +
  "outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all placeholder:text-slate-300";

export const selectCls =
  "px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm " +
  "outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all cursor-pointer";

/* ── Loading spinner ── */
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-2 border-cyan-200 border-t-cyan-600 rounded-full animate-spin" />
    </div>
  );
}
