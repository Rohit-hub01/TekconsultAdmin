import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, TrendingUp, DollarSign, Star, Loader2 } from 'lucide-react';
import { Category, api, Consultant } from '@/lib/api';

interface CategoryDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: Category;
    onEdit: (category: Category) => void;
}

interface Activity {
    id: string;
    text: string;
    timestamp: string;
    color: string;
}

const CategoryDetailsModal: React.FC<CategoryDetailsModalProps> = ({
    isOpen,
    onClose,
    category,
    onEdit,
}) => {
    const [stats, setStats] = useState({
        consultants: 0,
        activeSessions: 0,
        revenue: 0,
    });
    const [topConsultants, setTopConsultants] = useState<Consultant[]>([]);
    const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Helper function to get initials
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    useEffect(() => {
        if (isOpen && category) {
            const fetchData = async () => {
                setIsLoading(true);
                try {
                    // Fetch Category Stats from the new API
                    const statsData = await api.getCategoryStats(category.id);

                    // Fetch Consultants for this category (to display top consultants)
                    // We can still use the existing logic for top consultants and recent activity, 
                    // or just use the stats for the overview
                    const consultantsData = await api.getConsultants();
                    const categoryConsultants = consultantsData.filter(c => c.category === category.name);

                    // Top Consultants (sorted by rating)
                    const sortedConsultants = [...categoryConsultants]
                        .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
                        .slice(0, 3);

                    // Since we don't have a specific recent activity API for category yet, 
                    // we'll keep a simpler version or fetch last few sessions if possible.
                    // For now, let's just use the stats from the API
                    setStats({
                        consultants: statsData.totalConsultants,
                        activeSessions: statsData.activeSessionsCount,
                        revenue: Math.round(statsData.totalRevenue),
                    });
                    setTopConsultants(sortedConsultants);

                    // We can also fetch some consultations to show recent activity
                    // But to keep it simple and focused on the user's request:
                    setRecentActivity([]);

                } catch (error) {
                    console.error("Failed to fetch category details", error);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchData();
        }
    }, [isOpen, category]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col border border-border animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center z-10 flex-shrink-0">
                    <h2 className="text-lg font-semibold text-gray-900">Category Details</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 hover:[&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-teal-600 mb-2" />
                            <p className="text-sm text-gray-500">Loading details...</p>
                        </div>
                    ) : (
                        <div className="p-6 space-y-6">
                            {/* Category Header */}
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 font-bold text-2xl flex-shrink-0 border border-teal-100">
                                    {getInitials(category.name)}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-900">{category.name}</h3>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${category.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {category.status}
                                        </span>
                                        <span className="text-xs text-gray-400">•</span>
                                        <span className="text-xs text-gray-500">{stats.consultants} Consultants</span>
                                    </div>
                                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{category.description}</p>
                                </div>
                            </div>

                            {/* Category Statistics */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Overview</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                        <div className="flex items-center gap-1.5 text-slate-600 mb-1.5">
                                            <Users size={14} />
                                            <span className="text-xs font-medium">Consultants</span>
                                        </div>
                                        <div className="text-xl font-bold text-gray-900">{stats.consultants}</div>
                                    </div>
                                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                                        <div className="flex items-center gap-1.5 text-blue-600 mb-1.5">
                                            <TrendingUp size={14} />
                                            <span className="text-xs font-medium">Active</span>
                                        </div>
                                        <div className="text-xl font-bold text-gray-900">{stats.activeSessions}</div>
                                    </div>
                                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                                        <div className="flex items-center gap-1.5 text-emerald-600 mb-1.5">
                                            <DollarSign size={14} />
                                            <span className="text-xs font-medium">Revenue</span>
                                        </div>
                                        <div className="text-xl font-bold text-gray-900">₹{stats.revenue.toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Subcategories */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Subcategories</h4>
                                <div className="flex flex-wrap gap-2">
                                    {category.subcategories && category.subcategories.length > 0 ? (
                                        category.subcategories.map((sub, index) => (
                                            <div
                                                key={sub.id || index}
                                                className="px-3 py-1.5 bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-100 flex items-center gap-2"
                                            >
                                                <span>{sub.name}</span>
                                                <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                                                    {sub.consultantCount || 0}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <span className="text-sm text-gray-500 italic">No subcategories defined</span>
                                    )}
                                </div>
                            </div>

                            {/* Top Consultants */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Top Consultants</h4>
                                <div className="space-y-3">
                                    {topConsultants.length > 0 ? (
                                        topConsultants.map((consultant) => (
                                            <div key={consultant.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                                <div
                                                    className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0"
                                                >
                                                    {consultant.initials}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-gray-900 truncate">{consultant.fullName}</div>
                                                    <div className="text-xs text-gray-500">{consultant.totalSessionsCompleted || 0} sessions</div>
                                                </div>
                                                <div className="flex items-center gap-1 text-sm bg-yellow-50 px-2 py-1 rounded-md">
                                                    <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                                    <span className="font-medium text-gray-900">{consultant.averageRating ? consultant.averageRating.toFixed(1) : 'N/A'}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No consultants found in this category yet.</p>
                                    )}
                                </div>
                            </div>

                            {/* Recent Activity */}
                            {recentActivity.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h4>
                                    <div className="relative pl-2.5 ml-2 space-y-6 border-l border-gray-200 py-2">
                                        {recentActivity.map((activity) => (
                                            <div key={activity.id} className="relative pl-4">
                                                <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 ${activity.color} rounded-full ring-4 ring-white`}></div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-gray-900 font-medium">{activity.text}</span>
                                                    <span className="text-xs text-gray-500 mt-0.5">{activity.timestamp}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 z-10 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 bg-gray-50 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        Close
                    </button>
                    <button className="flex-1 px-4 py-2.5 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20"
                        onClick={() => {
                            onEdit(category);
                            onClose();
                        }}
                    >
                        Edit Category
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CategoryDetailsModal;
