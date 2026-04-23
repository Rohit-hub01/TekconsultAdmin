import { useState, useEffect, useCallback } from "react";
import { getMyNotifications, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/api/backendService";
import { notificationSignalRService } from "@/lib/notifications";
import { Notification } from "@/lib/api/types";
import { useToast } from "./use-toast";

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getMyNotifications(0, 50);
            setNotifications(data);
            const count = await getUnreadNotificationCount();
            setUnreadCount(count);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();

        notificationSignalRService.startConnection();

        const unsubscribe = notificationSignalRService.onNotificationReceived((notification: Notification) => {
            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);

            toast({
                title: notification.title,
                description: notification.body,
            });
        });

        return () => {
            unsubscribe();
        };
    }, [fetchNotifications, toast]);

    const markAsRead = async (id: string) => {
        try {
            const success = await markNotificationAsRead(id);
            if (success) {
                setNotifications((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const success = await markAllNotificationsAsRead();
            if (success) {
                setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error);
        }
    };

    return {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        refresh: fetchNotifications,
    };
}
