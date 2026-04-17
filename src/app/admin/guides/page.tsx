// app/admin/guides/page.tsx
import { fetchCollection, countCollection, fmtDate } from "@/src/lib/firestore-helpers";
import GuidesClient from "./GuidesClient";
export const revalidate = 60;
export default async function GuidesPage() {
  const [guides, total, draftCount] = await Promise.all([
    fetchCollection("guides", { orderBy: ["publishedAt", "desc"], limit: 50 }),
    countCollection("guides"),
    countCollection("guides", [["status", "==", "draft"]]),
  ]);
  const data = guides.map((g: any) => ({
    id:          g.id,
    title:       g.title       ?? "Untitled",
    slug:        g.slug        ?? "",
    category:    g.category    ?? "tips",
    status:      g.status      ?? "draft",
    seoTitle:    g.seoTitle    ?? "",
    seoDescription: g.seoDescription ?? "",
    publishedAt: g.publishedAt ? fmtDate(g.publishedAt) : "—",
  }));
  return <GuidesClient guides={data} total={total} draftCount={draftCount} />;
}
