"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge, Btn, Card, Tabs, Pagination, EmptyState } from "@/src/components/admin/ui";

type Review = {
  id: string; authorId: string; targetId: string; targetType: string;
  rating: number; title: string; body: string;
  isVerifiedPurchase: boolean; isFlagged: boolean;
  status: string; createdAt: string;
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`text-sm ${i <= rating ? "text-amber-400" : "text-slate-200"}`}>★</span>
      ))}
    </span>
  );
}

export default function ReviewsClient({
  reviews, flaggedCount, pendingCount,
}: {
  reviews: Review[]; flaggedCount: number; pendingCount: number;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [page, setPage]     = useState(1);

  const filtered = useMemo(() => reviews.filter(r =>
    filter === "all"      ? true :
    filter === "flagged"  ? r.isFlagged :
    filter === "pending"  ? r.status === "pending" :
    r.status === filter
  ), [reviews, filter]);

  async function moderateReview(id: string, action: "approve" | "flag" | "unflag" | "delete") {
    const body =
      action === "approve" ? { status: "published" } :
      action === "flag"    ? { isFlagged: true }     :
      action === "unflag"  ? { isFlagged: false }    :
      null;

    if (action === "delete") {
      if (!confirm("Permanently delete this review?")) return;
      await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    } else {
      await fetch(`/api/admin/reviews/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-light text-slate-800" style={{ fontFamily:"'Playfair Display',serif" }}>
            Reviews
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {reviews.length} total · {flaggedCount} flagged · {pendingCount} pending
          </p>
        </div>
      </div>

      <Card>
        <Tabs
          tabs={[
            { value: "all",       label: "All" },
            { value: "published", label: "Published" },
            { value: "pending",   label: "Pending",  count: pendingCount },
            { value: "flagged",   label: "Flagged",  count: flaggedCount },
          ]}
          active={filter}
          onChange={setFilter}
        />

        <div className="p-5 flex flex-col gap-3">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 2l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 14.27l-4.77 2.51.91-5.32L2.27 7.62l5.34-.78L10 2z"/></svg>}
              title="No reviews in this category"
            />
          ) : filtered.map(review => (
            <div
              key={review.id}
              className={`rounded-xl border p-4 transition-colors ${
                review.isFlagged
                  ? "border-red-200 bg-red-50/40"
                  : "border-slate-100 bg-white"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {review.authorId[0]?.toUpperCase()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800 text-sm">{review.authorId}</span>
                    <Stars rating={review.rating} />
                    <span className="text-xs text-slate-400">
                      on{" "}
                      <span className="text-cyan-600 font-medium">{review.targetId}</span>
                      {" "}({review.targetType})
                    </span>
                    {review.isVerifiedPurchase && (
                      <Badge status="verified" />
                    )}
                    {review.isFlagged && <Badge status="flagged" />}
                    <Badge status={review.status} />
                  </div>

                  <div className="font-semibold text-slate-700 text-sm mt-2">{review.title}</div>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed line-clamp-3">
                    {review.body}
                  </p>
                  <div className="text-xs text-slate-400 mt-2">{review.createdAt}</div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {review.status === "pending" && (
                    <Btn variant="primary" size="sm" onClick={() => moderateReview(review.id, "approve")}>
                      Approve
                    </Btn>
                  )}
                  {review.isFlagged ? (
                    <Btn variant="secondary" size="sm" onClick={() => moderateReview(review.id, "unflag")}>
                      Clear flag
                    </Btn>
                  ) : (
                    <Btn variant="ghost" size="sm" onClick={() => moderateReview(review.id, "flag")}>
                      Flag
                    </Btn>
                  )}
                  <Btn variant="danger" size="sm" onClick={() => moderateReview(review.id, "delete")}>
                    Delete
                  </Btn>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Pagination
          total={reviews.length}
          showing={filtered.length}
          page={page}
          perPage={20}
          onPage={setPage}
        />
      </Card>
    </div>
  );
}
