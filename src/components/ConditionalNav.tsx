"use client";

import { usePathname } from "next/navigation";
import ContentNav from "./ContentNav";

export default function ConditionalNav() {
    const pathname = usePathname();

    const showNav =
        pathname?.startsWith("/destinations") ||
        pathname?.startsWith("/tours") ||
        pathname?.startsWith("/saved") ||
        pathname?.startsWith("/bookings");

    if (!showNav) return null;

    return <ContentNav />;
}