import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  TrendingUp,
  Users,
  Clock,
  Wallet,
  ToggleLeft,
  ToggleRight,
  MessageCircle,
  Phone,
  Calendar,
  Star,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { consultantAPI, sessionAPI, dashboardAPI, type UserSession, API_BASE_URL } from '@/services/api';
import { SessionState } from '@/types/enums';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import * as signalR from '@microsoft/signalr';
import ProfileCompletionWidget from '@/components/common/ProfileCompletionWidget';

// Helper to ensure dates from server (UTC) are parsed correctly in local time
const parseServerDate = (dateStr: string | null | undefined): Date => {
  if (!dateStr) return new Date();
  const normalized = (dateStr.endsWith('Z') || dateStr.includes('+'))
    ? dateStr
    : `${dateStr}Z`;
  return new Date(normalized);
};

const ConsultantDashboard = () => {
  const { consultant, user } = useAuth();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(consultant?.isOnline ?? true);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const fetchSessions = async (silent = false, requestsOnly = false) => {
    if (!silent) setIsLoading(true);
    try {
      if (requestsOnly) {
        const requests = await sessionAPI.getRequests();
        setSessions(prev => {
          // Keep non-pending sessions (history)
          const history = prev.filter(s => s.state !== SessionState.Pending);
          const all = [...requests, ...history];

          // Remove duplicates based on sessionId
          const uniqueSessions = Array.from(new Map(all.map(s => [s.sessionId, s])).values());

          // Sort by date (newest first)
          return uniqueSessions.sort((a, b) => parseServerDate(b.startTime).getTime() - parseServerDate(a.startTime).getTime());
        });
        return;
      }

      // Fetch sessions (requests and history) and dashboard stats
      const [requests, response, statsData] = await Promise.all([
        sessionAPI.getRequests(),
        sessionAPI.getUserHistory(0, 5),
        dashboardAPI.getAdvisorStats()
      ]);

      const allSessions = [...requests, ...response.sessions];

      // Remove duplicates based on sessionId just in case
      const uniqueSessions = Array.from(new Map(allSessions.map(s => [s.sessionId, s])).values());

      // Sort by date (newest first)
      uniqueSessions.sort((a, b) => parseServerDate(b.startTime).getTime() - parseServerDate(a.startTime).getTime());

      setSessions(uniqueSessions);
      setDashboardStats(statsData);

      // Sync online status from API
      if (statsData && typeof statsData.isOnline === 'boolean') {
        setIsOnline(statsData.isOnline);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (!silent) {
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data',
          variant: 'destructive',
        });
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();

    // Set up polling interval to catch missed requests - ONLY requests
    const pollInterval = setInterval(() => {
      fetchSessions(true, true);
    }, 30000); // Check every 30 seconds

    const initSignalR = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const signalBase = (API_BASE_URL || '').split('/api')[0] || window.location.origin;
      const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${signalBase}/chatHub`, {
          accessTokenFactory: () => token
        })
        .withAutomaticReconnect()
        .build();

      connection.on("NewSessionRequest", (request: any) => {
        console.log("🔔 New Session Request received via SignalR:", request);
        const newSession: UserSession = {
          sessionId: request.sessionId,
          userId: request.userId,
          userName: request.userName || "New Client",
          mode: request.mode || 0,
          startTime: request.startTime || new Date().toISOString(),
          endTime: '',
          durationSeconds: 0,
          totalChargedAmount: 0,
          consultantEarnings: 0,
          state: SessionState.Pending, // Pending
          rating: 0,
          reviewComment: '',
          consultantId: ''
        };
        // Add new session and re-sort
        setSessions(prev => {
          const updated = [newSession, ...prev];
          const unique = Array.from(new Map(updated.map(s => [s.sessionId, s])).values());
          return unique.sort((a, b) => parseServerDate(b.startTime).getTime() - parseServerDate(a.startTime).getTime());
        });

        toast({
          title: "New Session Request",
          description: `${newSession.userName} is requesting a ${newSession.mode === 0 ? 'chat' : 'call'}.`,
        });
      });

      connection.on("SessionEnded", (msg: any) => {
        console.log("🏁 Session Ended:", msg);
        setSessions(prev => prev.filter(s => s.sessionId !== msg.sessionId));
        // Optionally refresh to get updated history
        fetchSessions();
      });

      try {
        await connection.start();
        console.log("✅ Consultant Dashboard connected to SignalR");
        connectionRef.current = connection;
      } catch (err) {
        console.error("SignalR Connection Error: ", err);
      }
    };

    initSignalR();

    return () => {
      clearInterval(pollInterval);
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, []);

  const toggleOnline = async (checked: boolean) => {
    try {
      await dashboardAPI.updateOnlineStatus(checked);
      setIsOnline(checked);
      toast({
        title: checked ? 'You are now Online' : 'You are now Offline',
        description: checked
          ? 'Users can now see you and start sessions'
          : 'You will not receive new session requests',
      });
    } catch (error) {
      console.error('Error updating online status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update online status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAccept = async (sessionId: string, userId: string) => {
    setProcessingId(sessionId);
    try {
      await sessionAPI.accept(sessionId);
      toast({ title: 'Session accepted!' });
      const session = sessions.find(s => s.sessionId === sessionId);
      if (session?.mode === 1) {
        navigate(`/consultant/call/${userId}`, { state: { sessionId } });
      } else {
        navigate(`/consultant/chat/${userId}`, { state: { sessionId } });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept session',
        variant: 'destructive'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (sessionId: string) => {
    setProcessingId(sessionId);
    try {
      await sessionAPI.decline(sessionId);
      toast({ title: 'Session declined' });
      fetchSessions();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to decline session',
        variant: 'destructive'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const stats = [
    {
      icon: TrendingUp,
      label: 'Total Earnings',
      value: '₹' + (dashboardStats?.totalEarnings?.toLocaleString() || '0'),
      color: 'text-white',
      bgColor: 'bg-green-500',
      clickable: false,
    },
    {
      icon: Star,
      label: 'Rating',
      value: dashboardStats?.averageRating?.toFixed(1) || '0.0',
      subtitle: 'Average Rating',
      color: 'text-foreground',
      bgColor: 'bg-card',
      clickable: true,
      path: '/consultant/reviews',
    },
    {
      icon: Users,
      label: 'Sessions',
      value: dashboardStats?.numberOfSessions || '0',
      subtitle: 'Completed',
      color: 'text-foreground',
      bgColor: 'bg-card',
      clickable: true,
      path: '/consultant/sessions',
    },
    {
      icon: Wallet,
      label: 'Available',
      value: '₹' + (dashboardStats?.availableBalance?.toLocaleString() || '0'),
      color: 'text-foreground',
      bgColor: 'bg-card',
      clickable: true,
      path: '/consultant/earnings',
    },
  ];

  const completionPercentage = (() => {
    if (!consultant) return 20; // Default for basic info
    let score = 30; // 30% for basic name/phone
    if (consultant.bio && consultant.bio.length > 5) score += 20;
    if (consultant.category) score += 20;
    if (consultant.experience) score += 15;
    if (consultant.isVerified) score += 15;
    return score;
  })();

  const sessionRequests = sessions.filter(s => s.state === SessionState.Pending);
  const recentSessions = sessions.filter(s => s.state !== SessionState.Pending).slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      {/* Welcome Banner */}
      <div className="px-6 pt-6">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 text-white mb-6 shadow-xl shadow-indigo-500/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />

          <div className="relative z-10 flex-1">
            <h1 className="text-2xl md:text-3xl font-extrabold font-display mb-2 drop-shadow-sm">Welcome back!</h1>
            <p className="text-indigo-100/90 font-medium">You have <span className="text-white font-bold underline decoration-white/30 underline-offset-4">{sessionRequests.length} new</span> session requests</p>
          </div>

          <div className="relative z-10 flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 self-start md:self-auto min-w-[200px] justify-between transition-all hover:bg-white/15">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-100/60 mb-0.5">Availability</span>
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", isOnline ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-white/40")} />
                <span className="text-sm font-bold tracking-tight">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
            <Switch
              checked={isOnline}
              onCheckedChange={toggleOnline}
              className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-white/20 border-0"
            />
          </div>
        </div>
      </div>

      {/* Profile Completion Widget */}
      {completionPercentage < 100 && (
        <div className="px-6 mb-8">
          <ProfileCompletionWidget
            percentage={completionPercentage}
            role="consultant"
          />
        </div>
      )}

      {/* Stats Cards */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(({ icon: Icon, label, value, subtitle, color, bgColor, clickable, path }) => (
            <div
              key={label}
              onClick={() => clickable && path && navigate(path)}
              className={cn(
                'rounded-2xl p-4 border border-border',
                bgColor === 'bg-green-500' ? 'bg-green-500 text-white' : 'bg-card',
                clickable && 'cursor-pointer hover:shadow-lg hover:scale-105 transition-all'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className={cn('text-sm font-medium mb-2', bgColor === 'bg-green-500' ? 'text-purple-100' : 'text-muted-foreground')}>
                    {label}
                  </p>
                  <p className="text-2xl font-bold">{value}</p>
                  {subtitle && <p className={cn('text-xs mt-1', bgColor === 'bg-green-500' ? 'text-purple-100' : 'text-muted-foreground')}>{subtitle}</p>}
                </div>
                <Icon className={cn('w-5 h-5', bgColor === 'bg-green-500' ? 'text-purple-100' : 'text-muted-foreground')} />
              </div>
              {bgColor === 'bg-green-500' && (
                <p className="text-xs text-purple-100">This month:</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Session Requests and Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 pb-8">
        {/* Session Requests */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">Session Requests</h2>
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
              {sessionRequests.length}
            </span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : sessionRequests.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <p className="text-muted-foreground">No pending requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessionRequests.map((request) => (
                <div key={request.sessionId} className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm">
                      {request.profilePhotoUrl ? (
                        <img
                          src={request.profilePhotoUrl.startsWith('http') ? request.profilePhotoUrl : `${API_BASE_URL}${request.profilePhotoUrl}`}
                          alt={request.userName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-primary">{request.userName.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{request.userName}</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        {request.mode === 0 ? 'Chat Session' : 'Voice Call'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Requested: {parseServerDate(request.startTime).toLocaleString('en-IN')}
                      </p>
                      {request.bidAmount !== undefined && request.bidAmount > 0 && (
                        <p className="text-sm font-semibold text-green-600 mt-1">
                          Bid Amount: ₹{request.bidAmount}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-lg h-9"
                      onClick={() => handleAccept(request.sessionId, request.userId)}
                      disabled={processingId === request.sessionId}
                    >
                      {processingId === request.sessionId ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-lg h-9"
                      onClick={() => handleDecline(request.sessionId)}
                      disabled={processingId === request.sessionId}
                    >
                      {processingId === request.sessionId ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <X className="w-4 h-4 mr-2" />
                      )}
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        <div>
          <h2 className="font-display text-lg font-semibold mb-4">Recent Sessions</h2>
          {isLoading ? (
            <div className="flex justify-center py-8 bg-card border border-border rounded-xl">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {recentSessions.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground bg-card border border-border rounded-xl">
                  No recent sessions found
                </p>
              ) : (
                recentSessions.map((session) => (
                  <div key={session.sessionId} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/5 flex items-center justify-center flex-shrink-0 border-2 border-white">
                        {session.profilePhotoUrl ? (
                          <img
                            src={session.profilePhotoUrl.startsWith('http') ? session.profilePhotoUrl : `${API_BASE_URL}${session.profilePhotoUrl}`}
                            alt={session.userName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-semibold text-primary">{session.userName.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{session.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {parseServerDate(session.startTime).toLocaleDateString('en-IN')} • {parseServerDate(session.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-sm">₹{session.consultantEarnings}</p>
                      <span
                        className={cn(
                          'inline-block text-xs px-2 py-1 rounded font-medium',
                          session.state === SessionState.Completed
                            ? 'bg-green-100 text-green-700'
                            : session.state === SessionState.Rejected
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                        )}
                      >
                        {session.state === SessionState.Completed ? 'completed' :
                          session.state === SessionState.Rejected ? 'rejected' : 'active'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultantDashboard;
