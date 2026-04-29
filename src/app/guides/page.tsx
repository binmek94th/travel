// src/app/guides/page.tsx

import { adminDb } from "@/src/lib/firebase-admin";
import GuidesClient from "./GuidesClient";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
    title:       "Guides & Blog — Tizitaw Ethiopia",
    description: "Travel guides, cultural insights and stories to help you explore Ethiopia deeply.",
};

export type Guide = {
    id:                   string;
    title:                string;
    slug:                 string;
    body:                 string;
    coverImage?:          string;
    categories:           string[];
    relatedDestinationIds:string[];
    seoTitle?:            string;
    seoDescription?:      string;
    status:               string;
    publishedAt?:         string;
    createdAt?:           string;
};

export default async function GuidesPage() {
    const snap = await adminDb
        .collection("guides")
        .where("status", "==", "published")
        .orderBy("publishedAt", "desc")
        .limit(60)
        .get();

    const guides: Guide[] = snap.docs.map(d => {
        const data = d.data();
        return {
            id:                   d.id,
            title:                data.title               ?? "Untitled",
            slug:                 data.slug                ?? d.id,
            body:                 data.body                ?? "",
            coverImage:           data.coverImage          ?? null,
            categories:           data.categories          ?? [],
            relatedDestinationIds:data.relatedDestinationIds ?? [],
            seoTitle:             data.seoTitle,
            seoDescription:       data.seoDescription,
            status:               data.status              ?? "draft",
            publishedAt:          data.publishedAt?.toDate?.()?.toISOString() ?? null,
            createdAt:            data.createdAt?.toDate?.()?.toISOString()   ?? null,
        };
    });

    return <GuidesClient guides={guides} />;
}