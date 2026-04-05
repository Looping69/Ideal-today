import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { adminApi } from '@/lib/api/admin';

export type Notification = {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'system';
    read: boolean;
    link?: string;
    created_at: string;
};

type NotificationContextType = {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    sendNotification: (userId: string, notification: Omit<Notification, 'id' | 'user_id' | 'read' | 'created_at'>) => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setLoading(false);
            return;
        }

        // Fetch initial notifications
        const fetchNotifications = async () => {
            try {
                const { data, error } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setNotifications(data || []);
            } catch (error: any) {
                console.error('Error fetching notifications:', error);
                if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
                    // Silent failure for missing table to avoid spamming toasts on every page load
                    // The admin settings page will warn about missing tables
                    console.warn('Notifications table missing. Please run migration.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();

        // Subscribe to realtime changes
        const subscription = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newNotification = payload.new as Notification;
                        setNotifications(prev => [newNotification, ...prev]);
                        toast({
                            title: newNotification.title,
                            description: newNotification.message,
                        });
                    } else if (payload.eventType === 'UPDATE') {
                        setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new as Notification : n));
                    } else if (payload.eventType === 'DELETE') {
                        setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user]);

    const markAsRead = async (id: string) => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

            await adminApi.markNotificationRead({ notificationId: id });
        } catch (error) {
            console.error('Error marking notification as read:', error);
            // Revert on error could be implemented here
        }
    };

    const markAllAsRead = async () => {
        try {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            await adminApi.markAllNotificationsRead();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            setNotifications(prev => prev.filter(n => n.id !== id));
            await adminApi.deleteNotification({ notificationId: id });
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const sendNotification = async (userId: string, notification: Omit<Notification, 'id' | 'user_id' | 'read' | 'created_at'>) => {
        try {
            await adminApi.sendNotification({
                userId,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                link: notification.link,
            });
        } catch (error) {
            console.error('Error sending notification:', error);
            throw error;
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            markAsRead,
            markAllAsRead,
            deleteNotification,
            sendNotification
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
