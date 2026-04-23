import { Bell, Check, Trash2, Clock, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export function NotificationDropdown() {
    const navigate = useNavigate();
    const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 relative text-muted-foreground hover:text-foreground transition-colors">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full p-0 text-[10px] bg-destructive border-0 flex items-center justify-center animate-in zoom-in duration-300">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[380px] p-0 shadow-2xl border-border bg-card">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAllAsRead()}
                            className="h-8 px-2 text-xs text-primary hover:text-primary/80 hover:bg-primary/5"
                        >
                            Mark all as read
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground space-y-2">
                            <div className="p-3 rounded-full bg-muted/50">
                                <Bell className="h-6 w-6 opacity-20" />
                            </div>
                            <p className="text-sm font-medium">No notifications yet</p>
                            <p className="text-xs">We'll notify you when something happens</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "flex flex-col p-4 border-b border-border/50 transition-colors hover:bg-accent/5 cursor-pointer relative",
                                        !notification.isRead && "bg-primary/5"
                                    )}
                                    onClick={() => !notification.isRead && markAsRead(notification.id)}
                                >
                                    {!notification.isRead && (
                                        <Circle className="h-2 w-2 absolute right-4 top-4 fill-primary text-primary" />
                                    )}
                                    <div className="flex flex-col gap-1 pr-4">
                                        <p className={cn(
                                            "text-sm font-medium leading-none",
                                            !notification.isRead ? "text-foreground" : "text-muted-foreground"
                                        )}>
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                                            {notification.body}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Clock className="h-3 w-3 text-muted-foreground/50" />
                                            <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="p-2 border-t bg-muted/30">
                    <Button
                        variant="ghost"
                        className="w-full h-9 text-xs font-medium text-muted-foreground hover:text-foreground"
                        onClick={() => navigate("/notifications")}
                    >
                        View all notifications
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
