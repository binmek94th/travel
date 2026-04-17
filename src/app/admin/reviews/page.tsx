// app/admin/reviews/page.tsx
import { fetchCollection, countCollection, fmtDate } from "@/src/lib/firestore-helpers";
import ReviewsClient from "./ReviewsClient";

export const revalidate = 30;

export default async function ReviewsPage() {
  const [reviews, flaggedCount, pendingCount] = await Promise.all([
    fetchCollection("reviews", { orderBy: ["createdAt", "desc"], limit: 50 }),
    countCollection("reviews", [["isFlagged", "==", true]]),
    countCollection("reviews", [["status", "==", "pending"]]),
  ]);

  const data = reviews.map((r: any) => ({
    id:                 r.id,
    authorId:           r.authorId           ?? "—",
    targetId:           r.targetId           ?? "—",
    targetType:         r.targetType         ?? "tour",
    rating:             r.rating             ?? 0,
    title:              r.title              ?? "—",
    body:               r.body               ?? "",
    isVerifiedPurchase: r.isVerifiedPurchase  ?? false,
    isFlagged:          r.isFlagged           ?? false,
    status:             r.status             ?? "published",
    createdAt:          fmtDate(r.createdAt),
  }));

  return <ReviewsClient reviews={data} flaggedCount={flaggedCount} pendingCount={pendingCount} />;
}
