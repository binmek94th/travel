// src/hooks/useNotifications.ts

import { useEffect, useRef, useState, useCallback } from "react";
import {
    collection, query, where, orderBy, limit,
    onSnapshot, doc, updateDoc, writeBatch, Timestamp,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";

export type TravelerNotificationType =
    | "booking_confirmed"
    | "booking_cancelled"
    | "booking_reminder"
    | "payment_received"
    | "message"
    | "promo";

export type TravelerNotification = {
    id:         string;
    userId:     string;
    type:       TravelerNotificationType;
    title:      string;
    message:    string;
    bookingId?: string;
    tourId?:    string;
    tourTitle?: string;
    startDate?: string;
    adminNote?: string;
    read:       boolean;
    createdAt:  Timestamp | null;
};

export function useNotifications(userId: string | null | undefined) {
    const [notifications, setNotifications] = useState<TravelerNotification[]>([]);
    const [newToast, setNewToast]           = useState<TravelerNotification | null>(null);
    const prevIdsRef                        = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!userId) return;

        const q = query(
            collection(db, "notifications"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc"),
            limit(40)
        );

        const unsub = onSnapshot(q, snap => {
            const docs: TravelerNotification[] = snap.docs.map(d => ({
                id: d.id,
                ...(d.data() as Omit<TravelerNotification, "id">),
            }));

            // Surface brand-new unread docs as a toast
            docs.forEach(n => {
                if (!n.read && !prevIdsRef.current.has(n.id)) {
                    setNewToast(n);
                }
            });

            prevIdsRef.current = new Set(docs.map(n => n.id));
            setNotifications(docs);
        });

        return () => unsub();
    }, [userId]);

    const markRead = useCallback(async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        await updateDoc(doc(db, "notifications", id), { read: true });
    }, []);

    const markAllRead = useCallback(async () => {
        const unread = notifications.filter(n => !n.read);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        const batch = writeBatch(db);
        unread.forEach(n => batch.update(doc(db, "notifications", n.id), { read: true }));
        await batch.commit();
    }, [notifications]);

    const dismissToast = useCallback(() => setNewToast(null), []);

    return { notifications, newToast, markRead, markAllRead, dismissToast };
}