import { useState, useEffect } from 'react';
import { Bell, CheckCircle2, MessageCircle, Star, Info, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from '@/components/ui/badge';
import { notificationAPI } from '@/services/api';
import { formatDistanceToNow } from 'date-fns';

// Helper to ensure dates from server (UTC) are parsed correctly in local time
const parseServerDate = (dateStr: string | null | undefined): Date => {
    if (!dateStr) return new Date();
    const normalized = (dateStr.endsWith('Z') || dateStr.includes('+'))
        ? dateStr
        : `${dateStr}Z`;
    return new Date(normalized);
};

interface HeaderProps {
    variant: 'user' | 'consultant';
}

const Header = ({ variant }: HeaderProps) => {
    const { user, consultant, refreshAuthenticatedProfile } = useAuth();
    const location = useLocation();
    const currentEntity = variant === 'user' ? user : consultant;

    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const fetchNotifications = async () => {
        try {
            setIsLoading(true);
            const [data, count] = await Promise.all([
                notificationAPI.getMyNotifications(0, 20),
                notificationAPI.getUnreadCount()
            ]);
            setNotifications(data);
            setUnreadCount(count);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Set up interval for refreshing unread count
        const interval = setInterval(() => {
            notificationAPI.getUnreadCount().then(setUnreadCount).catch(console.error);
        }, 60000); // Every minute

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (variant !== 'user') return;
        refreshAuthenticatedProfile();
    }, [variant, location.pathname]);

    const handleMarkAsRead = async (id: string, isRead: boolean) => {
        if (isRead) return;
        try {
            await notificationAPI.markAsRead(id);
            setNotifications(prev => prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationAPI.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const getNotificationIcon = (type: number) => {
        switch (type) {
            case 1: return CheckCircle2; // Success/Approved
            case 2: return Star; // Payment/Rating
            case 3: return Info; // System/Status
            case 4: return MessageCircle; // Chat/Session Request
            default: return Bell;
        }
    };

    const getNotificationColor = (type: number) => {
        switch (type) {
            case 1: return "bg-emerald-500/10 text-emerald-600";
            case 2: return "bg-blue-500/10 text-blue-600";
            case 4: return "bg-primary/10 text-primary";
            default: return "bg-muted text-muted-foreground";
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border shadow-sm">
            <div className="flex h-16 items-center justify-between px-6 lg:px-8">
                {/* Mobile Identity */}
                <div className="flex lg:hidden items-center gap-3">
                    <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground font-bold shadow-purple">
                        T
                    </div>
                </div>

                <div className="flex-1" />

                {/* Right Side Actions */}
                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Notification Popover */}
                    <Popover onOpenChange={(open) => open && fetchNotifications()}>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative group hover:bg-primary/5 hover:text-primary transition-all rounded-xl">
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-destructive rounded-full border-2 border-background animate-pulse" />
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0 rounded-2xl border-border shadow-2xl overflow-hidden" align="end" sideOffset={8}>
                            <div className="flex items-center justify-between p-4 border-b border-border bg-card">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-sm">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-[10px]">
                                            {unreadCount} New
                                        </Badge>
                                    )}
                                </div>
                                {unreadCount > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-[10px] font-bold hover:text-primary"
                                        onClick={handleMarkAllAsRead}
                                    >
                                        Mark all read
                                    </Button>
                                )}
                            </div>
                            <ScrollArea className="h-[350px]">
                                {isLoading && notifications.length === 0 ? (
                                    <div className="flex items-center justify-center h-40">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                    </div>
                                ) : notifications.length > 0 ? (
                                    <div className="divide-y divide-border">
                                        {notifications.map((notification) => {
                                            const Icon = getNotificationIcon(notification.type);
                                            return (
                                                <div
                                                    key={notification.notificationId}
                                                    onClick={() => handleMarkAsRead(notification.notificationId, notification.isRead)}
                                                    className={cn(
                                                        "p-4 flex gap-3 hover:bg-muted/30 transition-colors cursor-pointer group",
                                                        !notification.isRead && "bg-primary/5"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105",
                                                        getNotificationColor(notification.type)
                                                    )}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className={cn("text-sm truncate", !notification.isRead ? "font-bold" : "font-medium")}>
                                                                {notification.title}
                                                            </p>
                                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                                {formatDistanceToNow(parseServerDate(notification.createdAt), { addSuffix: true })}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                                                            {notification.body}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                        <Bell className="w-8 h-8 mb-2 opacity-20" />
                                        <p className="text-xs">No notifications yet</p>
                                    </div>
                                )}
                            </ScrollArea>
                            <div className="p-4 border-t border-border text-center bg-card">
                                {/* <Button variant="ghost" size="sm" className="w-full text-xs font-bold text-primary hover:bg-primary/5">
                                    View all notifications
                                </Button> */}
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* User Profile Summary */}
                    <div className="flex items-center gap-3 pl-4 border-l border-border h-8 ml-1 sm:ml-2">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold leading-none tracking-tight">
                                {currentEntity?.name || 'User'}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-bold opacity-60">
                                {variant}
                            </p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold text-sm shadow-sm transition-transform hover:scale-105 cursor-pointer">
                            {currentEntity?.name?.charAt(0) || 'U'}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
