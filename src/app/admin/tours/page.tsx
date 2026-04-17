import { fetchCollection, countCollection } from "@/src/lib/firestore-helpers";
import ToursClient from "./ToursClient";

export const revalidate = 30;

export async function generateMetadata() {
  return { title: "Tours — Tizitaw Admin" };
}

export default async function ToursPage() {
  const [tours, total, pendingCount, operators] = await Promise.all([
    fetchCollection("tours", { orderBy: ["createdAt", "desc"], limit: 50 }),
    countCollection("tours"),
    countCollection("tours", [["status", "==", "pending"]]),
    fetchCollection("users", { where: [["role", "==", "operator"]] }),
  ]);

  const serialized = tours.map((t: any) => ({
    id:             t.id,
    title:          t.title        ?? "—",
    operatorId:     t.operatorId   ?? "",
    priceUSD:       t.priceUSD     ?? 0,
    priceETB:       t.priceETB     ?? 0,
    durationDays:   t.durationDays ?? 0,
    status:         t.status       ?? "draft",
    bookingCount:   t.bookingCount ?? 0,
    avgRating:      t.avgRating    ?? 0,
    isFeatured:     t.isFeatured   ?? false,
    destinationIds: t.destinationIds ?? [],
    categories:     t.categories   ?? [],
  }));

  const serializedOperators = operators.map((o: any) => ({
    uid:  o.id,
    name: o.name ?? o.email ?? o.id,
  }));

  return (
      <ToursClient
          tours={serialized}
          total={total}
          pendingCount={pendingCount}
          operators={serializedOperators}
      />
  );
}