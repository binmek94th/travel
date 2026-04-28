// src/components/providers/ClientProviders.tsx
"use client";

import { useAuth } from "@/src/lib/useAuth";
import { NotificationProvider } from "@/src/components/notifications/NotificationProvider";

export function ClientProviders({ children }: { children: React.ReactNode }) {
    const { user, authLoading } = useAuth();
    
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-6 h-6 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <NotificationProvider userId={user?.uid ?? null}>
            {children}
        </NotificationProvider>
    );
}