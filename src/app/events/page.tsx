import { fetchCollection, countCollection } from "@/src/lib/firestore-helpers";
import EventsPublicClient from "./EventsPublicClient";

export const revalidate = 60;

export async function generateMetadata() {
    return {
        title: "Events & Festivals — Tizitaw Ethiopia",
        description: "Discover Ethiopia's vibrant festivals, religious ceremonies, and cultural events.",
    };
}

export default async function EventsPage() {
    const [events, total, destinations, tours] = await Promise.all([
        fetchCollection("events", { orderBy: ["startDate", "asc"] }),
        countCollection("events"),
        fetchCollection("destinations", { where: [["status", "==", "active"]] }),
        fetchCollection("tours",        { where: [["status", "==", "active"]] }),
    ]);

    const now      = new Date().toISOString().split("T")[0];
    const serialize = (obj: any) => JSON.parse(JSON.stringify(obj));

    return (
        <EventsPublicClient
            events={serialize(events.map((e: any) => ({
                id: e.id, name: e.name ?? "", type: e.type ?? "",
                destinationId: e.destinationId ?? "",
                startDate: e.startDate ?? "", endDate: e.endDate ?? "",
                description: e.description ?? "", location: e.location ?? "",
                capacity: e.capacity ?? null, images: e.images ?? [],
                isBookable: e.isBookable ?? false, linkedTourId: e.linkedTourId ?? null,
                isPast: e.endDate ? e.endDate < now : false,
            })))}
            total={total}
            destinations={serialize(destinations.map((d: any) => ({
                id: d.id, name: d.name ?? "", region: d.region ?? "", images: d.images ?? [],
            })))}
            tours={serialize(tours.map((t: any) => ({
                id: t.id, title: t.title ?? "", priceUSD: t.priceUSD ?? 0,
                durationDays: t.durationDays ?? 1, images: t.images ?? [],
            })))}
        />
    );
}