import { fetchCollection, countCollection } from "@/src/lib/firestore-helpers";
import EventsClient from "./EventsClient";

export const revalidate = 30;

export async function generateMetadata() {
  return { title: "Events — Tizitaw Admin" };
}

export default async function EventsPage() {
  const [events, total, destinations, tours] = await Promise.all([
    fetchCollection("events",       { orderBy: ["startDate", "asc"] }),
    countCollection("events"),
    fetchCollection("destinations", { where: [["status", "==", "active"]] }),
    fetchCollection("tours",        { where: [["status", "==", "active"]] }),
  ]);

  const serializedEvents = events.map((e: any) => ({
    id:            e.id,
    name:          e.name          ?? "—",
    type:          e.type          ?? "festival",
    destinationId: e.destinationId ?? "",
    startDate:     e.startDate     ?? "",
    endDate:       e.endDate       ?? "",
    isBookable:    e.isBookable    ?? false,
    linkedTourId:  e.linkedTourId  ?? null,
    description:   e.description   ?? "",
  }));

  const serializedDestinations = destinations.map((d: any) => ({
    id: d.id, name: d.name ?? d.id,
  }));

  const serializedTours = tours.map((t: any) => ({
    id: t.id, title: t.title ?? t.id,
  }));

  return (
      <EventsClient
          events={serializedEvents}
          total={total}
          destinations={serializedDestinations}
          tours={serializedTours}
      />
  );
}