import UsersClient from "@/src/app/admin/users/UsersClient";
import {countCollection, fetchCollection, fmtDate} from "@/src/lib/firestore-helpers";

export default async function UsersPage({
                                          searchParams,
                                        }: {
  searchParams: Promise<{ role?: string; page?: string }>;
}) {
  const { role, page } = await searchParams;

  const resolvedRole = role ?? "all";
  const resolvedPage = Number(page ?? 1);
  const perPage = 20;

  const whereClause =
      resolvedRole !== "all"
          ? [["role", "==", resolvedRole] as [string, FirebaseFirestore.WhereFilterOp, any]]
          : undefined;

  const [users, total] = await Promise.all([
    fetchCollection("users", {
      where: whereClause,
      orderBy: ["createdAt", "desc"],
      limit: perPage,
    }),
    countCollection("users", whereClause),
  ]);

  const serialized = users.map((u: any) => ({
    id: u.id,
    displayName: u.displayName ?? "—",
    email: u.email ?? "—",
    role: u.role ?? "traveler",
    emailVerified: u.emailVerified ?? false,
    nationality: u.nationality ?? "—",
    photoURL: u.photoURL ?? null,
    createdAt: fmtDate(u.createdAt),
  }));

  return (
      <UsersClient
          users={serialized}
          total={total}
          currentPage={resolvedPage}
          perPage={perPage}
      />
  );
}