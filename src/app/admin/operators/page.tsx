// ── Operators page ──────────────────────────────────────────
// app/admin/operators/page.tsx
import { fetchCollection, countCollection, fmtDate } from "@/src/lib/firestore-helpers";
import OperatorsClient from "./OperatorsClient";
export const revalidate = 30;
export default async function OperatorsPage() {
  const [operators, total, pendingCount] = await Promise.all([
    fetchCollection("operators", { orderBy: ["createdAt", "desc"] }),
    countCollection("operators"),
    countCollection("operators", [["isVerified", "==", false]]),
  ]);
  const data = operators.map((o: any) => ({
    id:            o.id,
    businessName:  o.businessName   ?? "—",
    email:         o.email          ?? "—",
    licenseNumber: o.licenseNumber  ?? "PENDING",
    isVerified:    o.isVerified     ?? false,
    tourCount:     o.tourCount      ?? 0,
    avgRating:     o.avgRating      ?? 0,
    revenueTotal:  o.revenueTotal   ?? 0,
    createdAt:     fmtDate(o.createdAt),
    featuredUntil: o.featuredUntil  ? fmtDate(o.featuredUntil) : null,
  }));
  return <OperatorsClient operators={data} total={total} pendingCount={pendingCount} />;
}
