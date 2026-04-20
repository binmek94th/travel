import { fetchCollection, countCollection } from "@/src/lib/firestore-helpers";
import ToursPublicClient from "./ToursPublicClient";

export const revalidate = 60;

export async function generateMetadata({
                                           searchParams,
                                       }: {
    searchParams: Promise<Record<string, string>>;
}) {
    const sp = await searchParams;
    return {
        title:       "Tours — Tizitaw Ethiopia",
        description: "Browse curated Ethiopia tours. Filter by duration, price, category and more.",
        openGraph: { title: "Tours — Tizitaw Ethiopia", type: "website" },
    };
}

const PER_PAGE  = 12;
const DURATIONS = ["1-3", "4-7", "8+"];
const CATEGORIES = ["culture", "nature", "adventure", "religious"];

export default async function ToursPage({
                                            searchParams,
                                        }: {
    searchParams: Promise<Record<string, string>>;
}) {
    const sp       = await searchParams;
    const category = sp.category || "all";
    const duration = sp.duration || "all";
    const maxPrice = parseInt(sp.maxPrice || "0", 10);
    const sort     = sp.sort     || "featured";
    const page     = Math.max(1, parseInt(sp.page || "1", 10));

    const where: [string, FirebaseFirestore.WhereFilterOp, any][] = [
        ["status", "==", "active"],
    ];
    if (category !== "all") where.push(["categories", "array-contains", category]);

    const orderBy: [string, "asc" | "desc"] =
        sort === "price_asc"  ? ["priceUSD",    "asc"]  :
            sort === "price_desc" ? ["priceUSD",    "desc"] :
                sort === "rating"     ? ["avgRating",   "desc"] :
                    sort === "duration"   ? ["durationDays","asc"]  :
                        ["isFeatured",  "desc"];

    const [allDocs, total] = await Promise.all([
        fetchCollection("tours", { where, orderBy, limit: page * PER_PAGE }),
        countCollection("tours", where),
    ]);

    // Apply duration + price filters in memory (Firestore compound index limitations)
    const filtered = allDocs.filter((t: any) => {
        if (duration === "1-3" && t.durationDays > 3)  return false;
        if (duration === "4-7" && (t.durationDays < 4 || t.durationDays > 7)) return false;
        if (duration === "8+"  && t.durationDays < 8)  return false;
        if (maxPrice > 0 && t.priceUSD > maxPrice)     return false;
        return true;
    });

    const tours = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((t: any) => ({
        id:           t.id,
        title:        t.title        ?? "—",
        slug:         t.slug         ?? t.id,
        operatorId:   t.operatorId   ?? "",
        priceUSD:     t.priceUSD     ?? 0,
        priceETB:     t.priceETB     ?? 0,
        durationDays: t.durationDays ?? 0,
        avgRating:    t.avgRating    ?? 0,
        reviewCount:  t.reviewCount  ?? 0,
        bookingCount: t.bookingCount ?? 0,
        isFeatured:   t.isFeatured   ?? false,
        categories:   t.categories   ?? [],
        images:   t.images   ?? [],
        description:  t.description  ?? "",
    }));

    return (
        <ToursPublicClient
            tours={tours}
            total={filtered.length}
            page={page}
            perPage={PER_PAGE}
            category={category}
            duration={duration}
            maxPrice={maxPrice}
            sort={sort}
            categories={CATEGORIES}
            durations={DURATIONS}
        />
    );
}