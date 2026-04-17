// ── Videos ─────────────────────────────────────────────────
// app/admin/videos/page.tsx
import { fetchCollection, countCollection, fmtDate } from "@/src/lib/firestore-helpers";
import VideosClient from "./VideosClient";
export const revalidate = 30;
export default async function VideosPage() {
  const [videos, total] = await Promise.all([
    fetchCollection("videos", { orderBy: ["createdAt", "desc"], limit: 50 }),
    countCollection("videos"),
  ]);
  const data = videos.map((v: any) => ({
    id:              v.id,
    caption:         v.caption         ?? "—",
    uploaderId:      v.uploaderId      ?? "—",
    destinationId:   v.destinationId   ?? "—",
    hlsUrl:          v.hlsUrl          ?? null,
    thumbnailUrl:    v.thumbnailUrl     ?? null,
    durationSeconds: v.durationSeconds  ?? 0,
    viewCount:       v.viewCount        ?? 0,
    likeCount:       v.likeCount        ?? 0,
    status:          v.status           ?? "processing",
    createdAt:       fmtDate(v.createdAt),
  }));
  return <VideosClient videos={data} total={total} />;
}
