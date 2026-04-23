import {
    X,
    Phone,
    Mail,
    MapPin,
    Wallet,
    Clock,
    IndianRupee,
    CheckCircle,
    Loader2,
    AlertCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { api, User, Transaction, UserDashboardStats, API_BASE_URL } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type UserDetailsModalProps = {
    open: boolean;
    onClose: () => void;
    userId: string | number | null;
};

export default function UserDetailsModal({
    open,
    onClose,
    userId,
}: UserDetailsModalProps) {
    const [user, setUser] = useState<User | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<UserDashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && userId) {
            loadUserData();
        } else {
            setUser(null);
            setTransactions([]);
        }
    }, [open, userId]);

    const loadUserData = async () => {
        if (!userId) return;
        setIsLoading(true);
        setError(null);
        try {
            // Fetch user data first - this is critical
            const userData = await api.getUserById(userId);
            setUser(userData);

            // Fetch user stats
            try {
                const statsData = await api.getUserStats(userId);
                setStats(statsData);
            } catch (statsErr) {
                console.error("Failed to load user stats:", statsErr);
            }

            // Then fetch transactions - this is optional/secondary
            try {
                const transactionsData = await api.getTransactions({
                    user: userId,
                    take: 5,
                    _sort: 'date',
                    _order: 'desc'
                });
                setTransactions(transactionsData.slice(0, 5));
            } catch (txErr) {
                console.error("Failed to load transactions:", txErr);
                setTransactions([]);
                // Don't set main error state, just show empty transactions
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load user details");
        } finally {
            setIsLoading(false);
        }
    };

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-lg scale-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-100 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-100">
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b sticky top-0 bg-white z-10">
                    <h2 className="text-sm font-semibold">User Details</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-4 sm:px-6 py-5 space-y-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-2" />
                            <p className="text-sm text-gray-500">Loading user details...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-10 text-red-500">
                            <AlertCircle className="w-8 h-8 mb-2" />
                            <p className="text-sm">{error}</p>
                        </div>
                    ) : user ? (
                        <>
                            {/* User Info */}
                            <div className="flex gap-4">
                                <Avatar className="w-12 h-12 rounded-lg shadow-sm shrink-0">
                                    <AvatarImage
                                        src={user.profilePhotoUrl ? (user.profilePhotoUrl.startsWith('http') ? user.profilePhotoUrl : `${API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL}${user.profilePhotoUrl.startsWith('/') ? user.profilePhotoUrl : '/' + user.profilePhotoUrl}`) : undefined}
                                        alt={user.fullName}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="rounded-lg bg-teal-500 text-white text-lg font-semibold">
                                        {user.initials}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="min-w-0">
                                    <p className="font-semibold text-lg truncate">{user.fullName}</p>
                                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {user.status}
                                    </span>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Member since {user.joinedDate}
                                    </p>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div>
                                <h3 className="text-sm font-semibold mb-3">
                                    Contact Information
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm text-gray-600">
                                    <div className="flex gap-2 min-w-0">
                                        <Phone className="w-4 h-4 mt-0.5 shrink-0" />
                                        <span className="truncate">{user.phone}</span>
                                    </div>
                                    <div className="flex gap-2 min-w-0">
                                        <Mail className="w-4 h-4 mt-0.5 shrink-0" />
                                        <span className="truncate">{user.email || "No email provided"}</span>
                                    </div>
                                    <div className="flex gap-2 min-w-0">
                                        <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                                        <span className="truncate">{user.location.city}, {user.location.state}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Account Statistics */}
                            <div>
                                <h3 className="text-sm font-semibold mb-3">
                                    Account Statistics
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <StatCard
                                        label="Balance"
                                        value={`₹${(stats?.walletBalance ?? user.walletBalance ?? 0).toLocaleString()}`}
                                        icon={<Wallet className="w-4 h-4" />}
                                        bg="bg-teal-50"
                                    />
                                    <StatCard
                                        label="Sessions"
                                        value={(stats?.numberOfSessions ?? user.totalSessions ?? 0).toString()}
                                        icon={<Clock className="w-4 h-4" />}
                                        bg="bg-blue-50"
                                    />
                                    <StatCard
                                        label="Total Spend"
                                        value={`₹${(stats?.totalSpent ?? user.totalSpend ?? 0).toLocaleString()}`}
                                        icon={<IndianRupee className="w-4 h-4" />}
                                        bg="bg-purple-50"
                                    />
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div>
                                <h3 className="text-sm font-semibold mb-3">
                                    Recent Activity
                                </h3>

                                <div className="space-y-3 text-sm">
                                    {transactions.length > 0 ? (
                                        transactions.map(tx => (
                                            <ActivityItem
                                                key={tx.id}
                                                color={tx.type === 'credit' ? 'bg-green-500' : 'bg-blue-500'}
                                                title={tx.type === 'credit' ? 'Wallet Credit' : 'Payment'}
                                                meta={`${tx.method || 'Transaction'} · ₹${tx.amount}`}
                                                time={new Date(tx.date).toLocaleDateString()}
                                            />
                                        ))
                                    ) : (
                                        <p className="text-gray-500 italic">No recent activity.</p>
                                    )}
                                </div>
                            </div>

                            {/* Payment Methods - Hidden as data is not available in backend response */}
                            {/* <div>
                                <h3 className="text-sm font-semibold mb-3">
                                    Payment Methods
                                </h3>
                                <div className="space-y-3">
                                    <p className="text-gray-500 italic text-sm">No payment methods linked.</p>
                                </div>
                            </div> */}
                        </>
                    ) : null}
                </div>
            </div>
        </div>,
        document.body
    );
}

/* ---------- Reusable Components ---------- */

function StatCard({
    label,
    value,
    icon,
    bg,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
    bg: string;
}) {
    return (
        <div className={`rounded-lg p-4 ${bg}`}>
            <div className="flex items-center gap-2 text-xs text-gray-500">
                {icon}
                {label}
            </div>
            <p className="mt-1 text-lg font-semibold">{value}</p>
        </div>
    );
}

function ActivityItem({
    color,
    title,
    meta,
    time,
}: {
    color: string;
    title: string;
    meta: string;
    time: string;
}) {
    return (
        <div className="flex gap-3">
            <span className={`w-2 h-2 rounded-full mt-2 ${color} shrink-0`} />
            <div>
                <p className="font-medium">{title}</p>
                <p className="text-xs text-gray-500">{meta}</p>
                <p className="text-xs text-gray-400">{time}</p>
            </div>
        </div>
    );
}

function PaymentItem({
    title,
    subtitle,
    badge,
    badgeColor,
}: {
    title: string;
    subtitle: string;
    badge: string;
    badgeColor: "green" | "blue";
}) {
    return (
        <div className="flex items-center justify-between border rounded-lg p-4 text-sm">
            <div>
                <p className="font-medium">{title}</p>
                <p className="text-xs text-gray-500">{subtitle}</p>
            </div>

            <span
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
        ${badgeColor === "green"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
            >
                <CheckCircle className="w-3 h-3" />
                {badge}
            </span>
        </div>
    );
}
