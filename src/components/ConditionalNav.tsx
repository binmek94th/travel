"use client";

import { usePathname } from "next/navigation";
import ContentNav from "./ContentNav";

export default function ConditionalNav() {
    const pathname = usePathname();

    const showNav =
        pathname?.startsWith("/destinations") ||
        pathname?.startsWith("/tours") ||
        pathname?.startsWith("/saved") ||
        pathname?.startsWith("/bookings") ||
        pathname?.startsWith("/events") ||
        pathname?.startsWith("/routes") ||
        pathname?.startsWith("/guides") ||
        pathname?.startsWith("/profile") ||
        pathname?.startsWith("/privacy") ||
        pathname?.startsWith("/cookies") ||
        pathname?.startsWith("/terms") ||
        pathname?.startsWith("/settings") ||
        pathname?.startsWith("/contact") ||
        pathname?.startsWith("/cancellation");

    if (!showNav) return null;

    return <ContentNav />;
}