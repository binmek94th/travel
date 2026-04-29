// src/app/guides/[slug]/page.tsx

import { adminDb } from "@/src/lib/firebase-admin";
import { notFound } from "next/navigation";
import GuideDetailClient from "./GuideDetailClient";
import type { Metadata } from "next";
import type { Guide } from "../page";

export const revalidate = 120;

type Props = { params: Promise<{ slug: string }> };

async function getGuide(slug: string): Promise<Guide | null> {
    // Try by slug first
    const bySlug = await adminDb
        .collection("guides")
        .where("slug", "==", slug)
        .where("status", "==", "published")
        .limit(1)
        .get();

    if (!bySlug.empty) {
        const d = bySlug.docs[0];
        return buildGuide(d.id, d.data());
    }

    // Fallback: try by doc ID (in case slug === id)
    const byId = await adminDb.collection("guides").doc(slug).get();
    if (byId.exists && byId.data()?.status === "published") {
        return buildGuide(byId.id, byId.data()!);
    }

    return null;
}

function buildGuide(id: string, data: FirebaseFirestore.DocumentData): Guide {
    return {
        id,
        title:                data.title               ?? "Untitled",
        slug:                 data.slug                ?? id,
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
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const guide    = await getGuide(slug);
    if (!guide) return { title:"Guide not found — Tizitaw Ethiopia" };

    return {
        title:       guide.seoTitle       ?? `${guide.title} — Tizitaw Ethiopia`,
        description: guide.seoDescription ?? guide.body.split(/\s+/).slice(0, 30).join(" "),
        openGraph: {
            title:       guide.seoTitle ?? guide.title,
            description: guide.seoDescription,
            images:      guide.coverImage ? [{ url: guide.coverImage }] : [],
            type:        "article",
        },
    };
}

export default async function GuideDetailPage({ params }: Props) {
    const { slug } = await params;
    const guide    = await getGuide(slug);
    if (!guide) notFound();

    // Fetch related guides (same category, limit 3)
    const relatedGuides: Guide[] = [];
    if (guide.categories.length > 0) {
        const relSnap = await adminDb
            .collection("guides")
            .where("status", "==", "published")
            .where("categories", "array-contains", guide.categories[0])
            .limit(4)
            .get();

        relSnap.docs
            .filter(d => d.id !== guide.id)
            .slice(0, 3)
            .forEach(d => relatedGuides.push(buildGuide(d.id, d.data())));
    }

    return <GuideDetailClient guide={guide} relatedGuides={relatedGuides}/>;
}