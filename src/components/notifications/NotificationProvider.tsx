"use client";

import React, { createContext, useContext } from "react";
import { useNotifications, type TravelerNotification } from "@/src/hooks/useNotifications";
import { NotificationToast } from "./NotificationToast";

// ─── Context ──────────────────────────────────────────────────────────────────

type NotificationContextValue = {
    notifications: TravelerNotification[];
    markRead:      (id: string) => Promise<void>;
    markAllRead:   () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue>({
    notifications: [],
    markRead:      async () => {},
    markAllRead:   async () => {},
});

export function useNotificationContext() {
    return useContext(NotificationContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function NotificationProvider({
                                         userId,
                                         children,
                                     }: {
    userId?:  string | null;
    children: React.ReactNode;
}) {
    const { notifications, newToast, markRead, markAllRead, dismissToast } =
        useNotifications(userId);

    function handleViewBooking(n: TravelerNotification) {
        if (n.bookingId) {
            window.location.href = `/bookings/${n.bookingId}`;
        }
    }

    return (
        <NotificationContext.Provider value={{ notifications, markRead, markAllRead }}>
            {children}

            {/* Toast renders outside the normal flow, bottom-right corner */}
            {newToast && (
                <NotificationToast
                    notification={newToast}
                    onDismiss={dismissToast}
                    onView={handleViewBooking}
                />
            )}
        </NotificationContext.Provider>
    );
}