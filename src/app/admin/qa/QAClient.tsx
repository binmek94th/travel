"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge, Btn, Table, Th, Td, Pagination, Card, Tabs, AvatarCell, EmptyState } from "@/src/components/admin/ui";

type QAPost = { id:string; authorId:string; question:string; destinationId:string|null; answerCount:number; isResolved:boolean; createdAt:string };

export default function QAClient({ posts, total, unanswered }: { posts:QAPost[]; total:number; unanswered:number }) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => posts.filter(p =>
    filter === "all" ? true :
    filter === "unanswered" ? p.answerCount === 0 :
    filter === "resolved"   ? p.isResolved :
    !p.isResolved
  ), [posts, filter]);

  async function del(id:string) {
    if (!confirm("Delete this post?")) return;
    await fetch(`/api/admin/qa/${id}`, { method:"DELETE" });
    router.refresh();
  }

  async function resolve(id:string) {
    await fetch(`/api/admin/qa/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ isResolved: true }) });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-light text-slate-800" style={{fontFamily:"'Playfair Display',serif"}}>Q&A Posts</h2>
        <p className="text-sm text-slate-500 mt-1">{total} questions · {unanswered} unanswered</p>
      </div>
      <Card>
        <Tabs tabs={[
          { value:"all", label:"All" },
          { value:"unresolved", label:"Unresolved" },
          { value:"unanswered", label:"Unanswered", count: unanswered },
          { value:"resolved", label:"Resolved" },
        ]} active={filter} onChange={setFilter} />
        <Table>
          <thead><tr><Th>Question</Th><Th>Author</Th><Th>Destination</Th><Th>Answers</Th><Th>Status</Th><Th>Posted</Th><Th className="w-28">Actions</Th></tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7}><EmptyState icon={<svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h12a2 2 0 012 2v7a2 2 0 01-2 2H9l-5 3v-3H4a2 2 0 01-2-2V6a2 2 0 012-2z"/></svg>} title="No posts found" /></td></tr>
            ) : filtered.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/60 group transition-colors">
                <Td className="max-w-[260px]">
                  <div className="text-sm font-medium text-slate-800 truncate">{p.question}</div>
                </Td>
                <Td><AvatarCell name={p.authorId} /></Td>
                <Td className="text-slate-500 text-sm">{p.destinationId ?? "—"}</Td>
                <Td>
                  <span className={`font-semibold text-sm ${p.answerCount === 0 ? "text-amber-600" : "text-slate-700"}`}>
                    {p.answerCount}
                  </span>
                  {p.answerCount === 0 && <span className="text-xs text-amber-500 ml-1">No answers</span>}
                </Td>
                <Td><Badge status={p.isResolved ? "resolved" : "open"} /></Td>
                <Td className="text-slate-400 text-xs">{p.createdAt}</Td>
                <Td>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!p.isResolved && <Btn variant="secondary" size="sm" onClick={() => resolve(p.id)}>Resolve</Btn>}
                    <Btn variant="danger" size="sm" onClick={() => del(p.id)}>
                      <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 4h10M5 4v9h6V4M6 4V3h4v1"/></svg>
                    </Btn>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Pagination total={total} showing={filtered.length} page={page} perPage={20} onPage={setPage} />
      </Card>
    </div>
  );
}
