import type { NextConfig } from "next";

// next.config.ts
const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "firebasestorage.googleapis.com",
            },
        ],
    },
};

export default nextConfig;
