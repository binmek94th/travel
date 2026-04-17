// app/admin/featured/page.tsx
import { fetchCollection, countCollection, fmtDate } from "@/src/lib/firestore-helpers";
import FeaturedClient from "./FeaturedClient";
export const revalidate = 60;
export default async function FeaturedPage() {
  const [featured, total] = await Promise.all([
    fetchCollection("featured", { orderBy: ["startDate", "desc"] }),
    countCollection("featured"),
  ]);
  const data = featured.map((f: any) => ({
    id:           f.id,
    name:         f.name         ?? "—",
    type:         f.type         ?? "tour",
    targetId:     f.targetId     ?? "—",
    operatorId:   f.operatorId   ?? "—",
    plan:         f.plan         ?? "standard",
    startDate:    fmtDate(f.startDate),
    endDate:      fmtDate(f.endDate),
    endDateRaw:   f.endDate      ?? null,
    startDateRaw: f.startDate    ?? null,
    impressions:  f.impressions  ?? 0,
    clicks:       f.clicks       ?? 0,
    amountPaid:   f.amountPaid   ?? 0,
  }));
  return <FeaturedClient items={data} total={total} />;
}
