"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge, Btn, Card, Tabs, Pagination, EmptyState } from "@/src/components/admin/ui";

type Video = {
  id: string; caption: string; uploaderId: string; destinationId: string;
  hlsUrl: string | null; thumbnailUrl: string | null;
  durationSeconds: number; viewCount: number; likeCount: number;
  status: string; createdAt: string;
};

function fmtDur(s: number) {
  const m = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, "0");
  return `${m}:${sec}`;
}

function fmtNum(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export default function VideosClient({ videos, total }: { videos: Video[]; total: number }) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [page, setPage]     = useState(1);

  const filtered = useMemo(() =>
    videos.filter(v => filter === "all" || v.status === filter),
  [videos, filter]);

  const totalViews = videos.reduce((s, v) => s + v.viewCount, 0);
  const totalLikes = videos.reduce((s, v) => s + v.likeCount, 0);

  async function removeVideo(id: string) {
    if (!confirm("Remove this video?")) return;
    await fetch(`/api/admin/videos/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: "removed" }),
    });
    router.refresh();
  }

  async function restoreVideo(id: string) {
    await fetch(`/api/admin/videos/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: "active" }),
    });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-light text-slate-800" style={{ fontFamily:"'Playfair Display',serif" }}>
            Videos
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {total} clips · {fmtNum(totalViews)} views · {fmtNum(totalLikes)} likes
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label:"Total videos",  val: total,                   color:"text-cyan-600"   },
          { label:"Total views",   val: fmtNum(totalViews),      color:"text-slate-700"  },
          { label:"Total likes",   val: fmtNum(totalLikes),      color:"text-amber-600"  },
          { label:"Processing",    val: videos.filter(v=>v.status==="processing").length, color:"text-violet-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{s.label}</div>
            <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>

      <Card>
        <Tabs
          tabs={[
            { value: "all",        label: "All"        },
            { value: "active",     label: "Active"     },
            { value: "processing", label: "Processing", count: videos.filter(v=>v.status==="processing").length },
            { value: "removed",    label: "Removed"    },
          ]}
          active={filter}
          onChange={setFilter}
        />

        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                icon={<svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="11" height="10" rx="2"/><path d="M13 8.5l5-3v9l-5-3"/></svg>}
                title="No videos found"
              />
            </div>
          ) : filtered.map(v => (
            <div
              key={v.id}
              className={`rounded-xl border overflow-hidden transition-shadow hover:shadow-md
                ${v.status === "removed"
                  ? "border-red-200 bg-red-50/40"
                  : "border-slate-100 bg-white"}`}
            >
              {/* Thumbnail */}
              <div className="relative h-32 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                {v.thumbnailUrl ? (
                  <img src={v.thumbnailUrl} alt={v.caption} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-8 h-8 text-white/40" viewBox="0 0 36 36" fill="none">
                    <circle cx="18" cy="18" r="17" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M15 12l10 6-10 6V12z" fill="currentColor" opacity=".6"/>
                  </svg>
                )}

                {/* Duration badge */}
                <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-semibold px-1.5 py-0.5 rounded">
                  {fmtDur(v.durationSeconds)}
                </span>

                {/* Status overlay */}
                {v.status === "processing" && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 text-white text-xs font-medium">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing…
                  </div>
                )}
                {v.status === "removed" && (
                  <div className="absolute inset-0 bg-red-900/40 flex items-center justify-center text-white text-xs font-semibold">
                    Removed
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <div className="font-medium text-slate-800 text-xs leading-tight line-clamp-2 mb-1">
                  {v.caption}
                </div>
                <div className="text-[10px] text-slate-400 mb-2">{v.uploaderId} · {v.destinationId}</div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2"/></svg>
                      {fmtNum(v.viewCount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 9l4-5 2 4h4l-3 4-2-3H2z"/></svg>
                      {fmtNum(v.likeCount)}
                    </span>
                  </div>
                  {v.status === "active" ? (
                    <Btn variant="danger" size="sm" onClick={() => removeVideo(v.id)}>
                      Remove
                    </Btn>
                  ) : v.status === "removed" ? (
                    <Btn variant="secondary" size="sm" onClick={() => restoreVideo(v.id)}>
                      Restore
                    </Btn>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Pagination total={total} showing={filtered.length} page={page} perPage={20} onPage={setPage} />
      </Card>
    </div>
  );
}
