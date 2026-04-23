import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  UserCheck,
  Radio,
  IndianRupee,
  Wallet,
  AlertTriangle,
  TrendingUp,
  Activity,
  Loader2,
} from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { SessionsChart } from "@/components/dashboard/SessionsChart";
import { LiveSessionsTable } from "@/components/dashboard/LiveSessionsTable";
import { TopConsultantsTable } from "@/components/dashboard/TopConsultantsTable";
import { PendingActionsCard } from "@/components/dashboard/PendingActionsCard";
import { api, User, Consultant, Category, Session, Transaction, Withdrawal, Dispute, API_BASE_URL } from "@/lib/api";
import { toast } from "sonner";
import LiveSessionDetailsModal from "@/components/sessions/LiveSessionDetailsModal";

// Dashboard DTOs from new API
interface DashboardStats {
  totalUsers: number;
  totalConsultants: number;
  activeSessions: number;
  totalCategories: number;
  totalTransactionValue: number;
  totalDisputes: number;
  resolvedDisputes: number;
  pendingDisputes: number;
}

interface DashboardRevenueData {
  dates: string[];
  revenue: number[];
  totalRevenue: number;
}

interface DashboardSessionMetrics {
  totalSessions: number;
  completedSessions: number;
  ongoingSessions: number;
  cancelledSessions: number;
  averageSessionDuration: number;
  averageSessionRating: number;
}

interface DashboardConsultantStats {
  totalConsultants: number;
  activeConsultants: number;
  totalSessions: number;
  averageRating: number;
  topPerformers: any[];
}

export default function Dashboard() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<DashboardRevenueData | null>(null);
  const [sessionMetrics, setSessionMetrics] = useState<DashboardSessionMetrics | null>(null);
  const [consultantStats, setConsultantStats] = useState<DashboardConsultantStats | null>(null);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  // Keep existing states for compatibility with child components
  const [users, setUsers] = useState<User[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch new dashboard data from new endpoints
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      };

      const [statsResponse, revenueResponse, sessionResponse, consultantResponse, categoryDataRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/dashboard/stats`, { headers }),
        fetch(`${API_BASE_URL}/api/dashboard/revenue-chart?days=30`, { headers }),
        fetch(`${API_BASE_URL}/api/dashboard/session-metrics`, { headers }),
        fetch(`${API_BASE_URL}/api/dashboard/consultant-stats`, { headers }),
        api.getSessionsByCategory(14)
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setDashboardStats(statsData.data);
      }

      if (revenueResponse.ok) {
        const revenueDataResponse = await revenueResponse.json();
        setRevenueData(revenueDataResponse.data);
      }

      if (sessionResponse.ok) {
        const sessionMetricsData = await sessionResponse.json();
        setSessionMetrics(sessionMetricsData.data);
      }

      if (consultantResponse.ok) {
        const consultantStatsData = await consultantResponse.json();
        setConsultantStats(consultantStatsData.data);
      }

      setCategoryData(categoryDataRes || []);

      // Also fetch additional data for table components
      const [u, c, cat, s, t, w, d] = await Promise.all([
        api.getUsersFromBackend(0, 1000),
        api.getConsultantsFromBackend(0, 1000),
        api.getCategories(),
        api.getSessions(),
        api.getTransactions(),
        api.getWithdrawals(),
        api.getDisputes()
      ]);
      setUsers(u);
      setConsultants(c);
      setCategories(cat);
      setSessions(s);
      setTransactions(t);
      setWithdrawals(w);
      setDisputes(d);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const metrics = useMemo(() => {
    if (!dashboardStats || !sessionMetrics) {
      return {
        totalUsers: 0,
        totalConsultants: 0,
        onlineConsultants: 0,
        activeSessionsCount: 0,
        todayGmv: 0,
        monthlyGmv: 0,
        pendingWithdrawalsAmount: 0,
        pendingWithdrawalsCount: 0,
        openDisputesCount: 0,
        atStakeAmount: 0,
        pendingApplicationsCount: 0,
        failedTransactionsCount: 0
      };
    }

    // Use data from new dashboard API endpoints
    const pendingWithdrawalsAmount = withdrawals
      .filter(w => w.status === 'requested')
      .reduce((acc, w) => acc + w.requestedAmount, 0);

    const atStakeAmount = disputes
      .filter(d => d.status === 'open')
      .reduce((acc, d) => acc + d.amount, 0);

    return {
      totalUsers: dashboardStats.totalUsers,
      totalConsultants: dashboardStats.totalConsultants,
      onlineConsultants: consultantStats?.activeConsultants ?? 0,
      activeSessionsCount: dashboardStats.activeSessions,
      todayGmv: revenueData?.revenue[revenueData.revenue.length - 1] ?? 0,
      monthlyGmv: revenueData?.totalRevenue ?? 0,
      pendingWithdrawalsAmount,
      pendingWithdrawalsCount: withdrawals.filter(w => w.status === 'requested').length,
      openDisputesCount: dashboardStats.pendingDisputes,
      atStakeAmount,
      pendingApplicationsCount: consultants.filter(c => c.status === 'Pending').length,
      failedTransactionsCount: transactions.filter(t => t.status === 'failed').length
    };
  }, [dashboardStats, sessionMetrics, revenueData, consultantStats, consultants, transactions, withdrawals, disputes]);

  const formatCurrency = (amt: number) => {
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)}Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)}L`;
    return `₹${amt.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-accent" />
          <p className="text-muted-foreground animate-pulse">Loading platform metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Real-time overview of TekConsult platform metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Users"
          value={metrics.totalUsers.toLocaleString()}
          change={{ value: "12.5%", positive: true }}
          icon={Users}
          variant="default"
        />
        <KPICard
          title="Total Consultants"
          value={metrics.totalConsultants.toLocaleString()}
          change={{ value: "8.2%", positive: true }}
          icon={UserCheck}
          variant="accent"
        />
        <KPICard
          title="Online Now"
          value={metrics.onlineConsultants.toString()}
          subtitle="consultants"
          icon={Activity}
          variant="success"
        />
        <KPICard
          title="Active Sessions"
          value={metrics.activeSessionsCount.toString()}
          subtitle="in progress"
          icon={Radio}
          variant="info"
        />
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Today's GMV"
          value={formatCurrency(metrics.todayGmv)}
          change={{ value: "15.3%", positive: true }}
          icon={IndianRupee}
          variant="success"
        />
        <KPICard
          title="Monthly GMV"
          value={formatCurrency(metrics.monthlyGmv)}
          change={{ value: "22.1%", positive: true }}
          icon={TrendingUp}
          variant="accent"
        />
        <KPICard
          title="Pending Withdrawals"
          value={formatCurrency(metrics.pendingWithdrawalsAmount)}
          subtitle={`${metrics.pendingWithdrawalsCount} requests`}
          icon={Wallet}
          variant="warning"
        />
        <KPICard
          title="Open Disputes"
          value={metrics.openDisputesCount.toString()}
          subtitle={`₹${metrics.atStakeAmount.toLocaleString()} at stake`}
          icon={AlertTriangle}
          variant="warning"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueChart transactions={transactions} />
        <SessionsChart categoryData={categoryData} />
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LiveSessionsTable
            initialSessions={sessions}
            onViewDetails={(session) => {
              setSelectedSession(session);
              setIsDetailsOpen(true);
            }}
          />
        </div>
        <div className="space-y-6">
          <TopConsultantsTable consultants={consultants} />
        </div>
      </div>

      {/* Pending Actions */}
      <PendingActionsCard metrics={metrics} />

      {/* Details Modal */}
      {selectedSession && (
        <LiveSessionDetailsModal
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedSession(null);
          }}
          session={selectedSession}
        />
      )}
    </div>
  );
}
