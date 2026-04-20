import { fetchCollection, countCollection } from "@/src/lib/firestore-helpers";
import DestinationsClient from "./DestinationsClient";

export const revalidate = 60;

export async function generateMetadata({
                                           searchParams,
                                       }: {
    searchParams: Promise<Record<string, string>>;
}) {
    const sp  = await searchParams;
    const cat = sp.category;
    return {
        title:       cat
            ? `${cat.charAt(0).toUpperCase() + cat.slice(1)} Destinations — Tizitaw Ethiopia`
            : "Destinations — Tizitaw Ethiopia",
        description: "Explore Ethiopia's most extraordinary destinations. Filter by region, category, and more.",
        openGraph: {
            title:       "Destinations — Tizitaw Ethiopia",
            description: "Discover Ethiopia's rock-hewn churches, mountains, valleys and more.",
            type:        "website",
        },
    };
}

const PER_PAGE   = 12;
const CATEGORIES = ["culture", "nature", "adventure", "religious"];
const REGIONS    = ["Amhara", "Tigray", "Oromia", "Afar", "Southern Nations", "Somali", "Addis Ababa", "Dire Dawa"];

export default async function DestinationsPage({
                                                   searchParams,
                                               }: {
    searchParams: Promise<Record<string, string>>;
}) {
    const sp         = await searchParams;
    const category   = sp.category || "all";
    const region     = sp.region   || "all";
    const hiddenGems = sp.hidden   === "true";
    const sort       = sp.sort     || "name";
    const page       = Math.max(1, parseInt(sp.page || "1", 10));

    const where: [string, FirebaseFirestore.WhereFilterOp, any][] = [
        ["status", "==", "active"],
    ];
    if (category   !== "all") where.push(["categories",  "array-contains", category]);
    if (region     !== "all") where.push(["region",      "==",             region]);
    if (hiddenGems)           where.push(["isHiddenGem", "==",             true]);

    const orderBy: [string, "asc" | "desc"] =
        sort === "rating"  ? ["avgRating",   "desc"] :
            sort === "reviews" ? ["reviewCount", "desc"] :
                ["name",        "asc"];

    const [allDocs, total] = await Promise.all([
        fetchCollection("destinations", { where, orderBy, limit: page * PER_PAGE }),
        countCollection("destinations", where),
    ]);

    const destinations = allDocs
        .slice((page - 1) * PER_PAGE, page * PER_PAGE)
        .map((d: any) => ({
            id:              d.id,
            name:            d.name            ?? "—",
            slug:            d.slug            ?? d.id,
            region:          d.region          ?? "",
            categories:      d.categories      ?? [],
            avgRating:       d.avgRating       ?? 0,
            reviewCount:     d.reviewCount     ?? 0,
            isHiddenGem:     d.isHiddenGem     ?? false,
            images:      d.images      ?? [],
            description:     d.description     ?? "",
            bestTimeToVisit: d.bestTimeToVisit ?? "",
        }));

    return (
        <DestinationsClient
            destinations={destinations}
            total={total}
            page={page}
            perPage={PER_PAGE}
            category={category}
            region={region}
            hiddenGems={hiddenGems}
            sort={sort}
            categories={CATEGORIES}
            regions={REGIONS}
        />
    );
}