import { useState, useEffect, useCallback } from "react";

import { Bell, Plus, Send, Users, UserCheck, Search, Filter, MoreHorizontal, Eye, Edit2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Notification, NotificationTemplate } from "@/lib/api/types";


// Mock data for templates as requested to be static
const templates = [
    { id: 1, name: "Welcome Message", type: "system", lastUsed: "2024-01-10" },
    { id: 2, name: "Payment Confirmation", type: "transactional", lastUsed: "2024-01-15" },
    { id: 3, name: "Promotional Offer", type: "promotional", lastUsed: "2024-01-01" },
    { id: 4, name: "Session Reminder", type: "system", lastUsed: "2024-01-14" },
];


const audienceConfig = {
    all_users: { label: "All Users", icon: Users },
    consultants: { label: "Consultants", icon: UserCheck },
    targeted: { label: "Targeted", icon: Users },
};

const statusConfig = {
    sent: { label: "Sent", class: "status-approved" },
    scheduled: { label: "Scheduled", class: "status-pending" },
    draft: { label: "Draft", class: "bg-muted text-muted-foreground" },
};

const typeConfig: Record<number, { label: string, variant: "default" | "secondary" | "destructive" | "outline" }> = {
    1: { label: "Signup", variant: "default" },
    2: { label: "Withdrawal Req", variant: "outline" },
    3: { label: "Dispute", variant: "destructive" },
    4: { label: "Session Req", variant: "secondary" },
    5: { label: "Message", variant: "secondary" },
    6: { label: "Withdrawal App", variant: "default" },
    8: { label: "Low Balance", variant: "destructive" },
    12: { label: "KYC Upload", variant: "outline" },
    13: { label: "KYC Update", variant: "default" },
    14: { label: "Review", variant: "default" },
};

export default function Notifications() {
    const [searchQuery, setSearchQuery] = useState("");
    const [notificationsData, setNotificationsData] = useState<Notification[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const notifs = await api.getNotifications({ skip: 0, take: 50 });
            setNotificationsData(notifs);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
            toast({
                title: "Error",
                description: "Failed to load notifications history.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);


    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredNotifications = notificationsData.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.body || "").toLowerCase().includes(searchQuery.toLowerCase())
    );


    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="page-header mb-0">
                    <h1 className="page-title">Notification Manager</h1>
                    <p className="page-description">Send broadcasts and manage notification templates</p>
                </div>
                <Button className="gap-2 bg-accent hover:bg-accent/90">
                    <Plus className="h-4 w-4" />
                    New Notification
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <Card className="border-0 shadow-card">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Sent Today</p>
                        <p className="text-2xl font-bold">
                            {notificationsData.filter(n => new Date(n.createdAt).toDateString() === new Date().toDateString()).length}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-card">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Total Sent</p>
                        <p className="text-2xl font-bold text-success">{notificationsData.length}</p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-card">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Opened</p>
                        <p className="text-2xl font-bold text-info">{notificationsData.filter(n => n.isRead).length}</p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-card">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Open Rate</p>
                        <p className="text-2xl font-bold">
                            {notificationsData.length > 0
                                ? ((notificationsData.filter(n => n.isRead).length / notificationsData.length) * 100).toFixed(1)
                                : 0}%
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="history" className="space-y-4">
                <TabsList className="bg-muted/50">
                    <TabsTrigger value="history">Notification History</TabsTrigger>
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                </TabsList>

                <TabsContent value="history" className="space-y-4">
                    {/* Filters */}
                    <Card className="border-0 shadow-card">
                        <CardContent className="p-4">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="relative flex-1 min-w-[240px]">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search notifications..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 bg-muted/50 border-0"
                                    />
                                </div>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Filter className="h-4 w-4" />
                                    Filters
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notifications Table */}
                    <Card className="border-0 shadow-card">
                        <CardHeader className="pb-0">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Bell className="h-5 w-5 text-accent" />
                                Recent Notifications
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 pt-4">
                            <div className="overflow-x-auto">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Audience</th>
                                            <th>Type</th>
                                            <th>Status</th>
                                            <th>Delivered</th>
                                            <th>Opened</th>
                                            <th>Date</th>
                                            <th className="text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan={8} className="py-10 text-center">
                                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                                    <p className="text-sm text-muted-foreground mt-2">Loading notifications...</p>
                                                </td>
                                            </tr>
                                        ) : filteredNotifications.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="py-10 text-center text-muted-foreground">
                                                    No notifications found.
                                                </td>
                                            </tr>
                                        ) : filteredNotifications.map((notification) => {

                                            // Format date
                                            const displayDate = notification.createdAt
                                                ? new Date(notification.createdAt).toLocaleString('en-US', {
                                                    month: 'short', day: 'numeric', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })
                                                : "N/A";

                                            return (
                                                <tr key={notification.id}>
                                                    <td>
                                                        <div>
                                                            <p className="font-medium">{notification.title}</p>
                                                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                                {notification.body || "No content"}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="flex items-center gap-1.5">
                                                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-sm">{notification.userName || "All Users"}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <Badge variant={typeConfig[notification.type]?.variant || "secondary"} className="font-normal capitalize">
                                                            {typeConfig[notification.type]?.label || "Notification"}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <span className={cn("status-badge", notification.isRead ? "status-approved" : "status-pending")}>
                                                            {notification.isRead ? "Read" : "Unread"}
                                                        </span>
                                                    </td>
                                                    <td>1</td>
                                                    <td>
                                                        <span className="text-info">{notification.isRead ? "1" : "0"}</span>
                                                    </td>
                                                    <td className="text-muted-foreground text-sm">
                                                        {displayDate}
                                                    </td>


                                                    <td className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem className="gap-2">
                                                                    <Eye className="h-4 w-4" /> View Details
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className="gap-2">
                                                                    <Send className="h-4 w-4" /> Resend
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="templates" className="space-y-4">
                    <Card className="border-0 shadow-card">
                        <CardHeader className="flex-row items-center justify-between pb-2">
                            <CardTitle className="text-base font-semibold">Message Templates</CardTitle>
                            <Button size="sm" className="gap-2">
                                <Plus className="h-4 w-4" />
                                Create Template
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0 pt-4">
                            <div className="divide-y divide-border">
                                {isLoading ? (
                                    <div className="p-8 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                    </div>
                                ) : templates.map((template) => (

                                    <div key={template.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="rounded-lg bg-accent/10 p-2.5">
                                                <Bell className="h-5 w-5 text-accent" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{template.name}</p>
                                                <p className="text-xs text-muted-foreground capitalize">
                                                    {template.type} • Last used: {template.lastUsed}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}