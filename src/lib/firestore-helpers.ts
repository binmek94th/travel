import { adminDb } from "./firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

/** Serialize a Firestore document — converts Timestamps to ISO strings */
export function serializeDoc(data: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v instanceof Timestamp) {
      out[k] = v.toDate().toISOString();
    } else if (v && typeof v === "object" && !Array.isArray(v) && "toDate" in v) {
      out[k] = (v as Timestamp).toDate().toISOString();
    } else {
      out[k] = v;
    }
  }
  return out;
}

/** Fetch a collection with optional where clauses and ordering */
export async function fetchCollection(
  col: string,
  opts: {
    where?: [string, FirebaseFirestore.WhereFilterOp, any][];
    orderBy?: [string, "asc" | "desc"];
    limit?: number;
  } = {}
) {
  let q: FirebaseFirestore.Query = adminDb.collection(col);
  if (opts.where) for (const [f, op, v] of opts.where) q = q.where(f, op, v);
  if (opts.orderBy) q = q.orderBy(opts.orderBy[0], opts.orderBy[1]);
  if (opts.limit)   q = q.limit(opts.limit);
  const snap = await q.get();
  return snap.docs.map(d => ({ id: d.id, ...serializeDoc(d.data()) }));
}

/** Count documents in a collection */
export async function countCollection(
    col: string,
    where?: [string, FirebaseFirestore.WhereFilterOp, any][]
) {
  let q: FirebaseFirestore.Query = adminDb.collection(col);
  if (where) for (const [f, op, v] of where) q = q.where(f, op, v);
  const snap = await q.select().get();
  return snap.size;
}

/** Format a date string cleanly */
export function fmtDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch {
    return "—";
  }
}

/** Format large numbers */
export function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
