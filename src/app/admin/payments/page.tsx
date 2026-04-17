import { fetchCollection, countCollection, fmtDate } from "@/src/lib/firestore-helpers";
import PaymentsClient from "./PaymentsClient";
export const revalidate = 30;
export default async function PaymentsPage() {
  const [payments, total] = await Promise.all([
    fetchCollection("payments", { orderBy: ["createdAt", "desc"], limit: 50 }),
    countCollection("payments"),
  ]);
  const data = payments.map((p: any) => ({
    id:           p.id,
    bookingId:    p.bookingId      ?? "—",
    amount:       p.amount         ?? 0,
    currency:     p.currency       ?? "USD",
    provider:     p.provider       ?? "stripe",
    status:       p.status         ?? "pending",
    providerTxId: p.providerTxId   ?? "—",
    webhookVerified: p.webhookVerified ?? false,
    createdAt:    fmtDate(p.createdAt),
  }));

  const totalUSD = data
    .filter((p: any) => p.currency === "USD" && p.status === "succeeded")
    .reduce((s: number, p: any) => s + p.amount, 0);

  return <PaymentsClient payments={data} total={total} totalUSD={totalUSD} />;
}
