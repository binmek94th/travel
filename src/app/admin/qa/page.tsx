// app/admin/qa/page.tsx
import { fetchCollection, countCollection, fmtDate } from "@/src/lib/firestore-helpers";
import QAClient from "./QAClient";
export const revalidate = 30;
export default async function QAPage() {
  const [posts, total, unanswered] = await Promise.all([
    fetchCollection("qa_posts", { orderBy: ["createdAt", "desc"], limit: 50 }),
    countCollection("qa_posts"),
    countCollection("qa_posts", [["answerCount", "==", 0]]),
  ]);
  const data = posts.map((p: any) => ({
    id:          p.id,
    authorId:    p.authorId    ?? "—",
    question:    p.question    ?? "—",
    destinationId: p.destinationId ?? null,
    answerCount: p.answerCount ?? 0,
    isResolved:  p.isResolved  ?? false,
    createdAt:   fmtDate(p.createdAt),
  }));
  return <QAClient posts={data} total={total} unanswered={unanswered} />;
}
