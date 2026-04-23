import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Settings,
  Phone,
  Mail,
  Calendar,
  Star,
  ChevronRight,
  Wallet,
  History,
  Heart,
  HelpCircle,
  LogOut,
  Edit2,
  Loader2,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { userAPI, dashboardAPI, API_BASE_URL } from '@/services/api';
import { toast } from '@/hooks/use-toast';

const UserProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfileAndStats = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      setIsLoading(true);
      try {
        const [profile, stats, activityLogs] = await Promise.all([
          userAPI.getUserById(userId),
          dashboardAPI.getUserStats(),
          userAPI.getRecentActivities()
        ]);
        setProfileData(profile);
        setUserStats(stats);
        setActivities(activityLogs);
      } catch (error) {
        console.error('Failed to fetch profile or stats:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data and statistics.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileAndStats();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = profileData
    ? `${profileData.firstName} ${profileData.lastName || ''}`.trim()
    : user?.name || 'User';

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2) || 'U';

  const statsGroups = [
    { label: 'Sessions', value: userStats?.numberOfSessions || profileData?.totalSessionsCompleted || '0' },
    { label: 'Total Spent', value: `₹${userStats?.totalSpent || 0}` },
    { label: 'Wallet Balance', value: `₹${userStats?.walletBalance || user?.walletBalance || 0}` },
  ];

  const quickActions = [
    { icon: Wallet, label: 'Wallet', sub: 'Manage your balance', color: 'bg-indigo-100 text-indigo-600', path: '/user/wallet' },
    { icon: History, label: 'Session History', sub: 'View past sessions', color: 'bg-blue-100 text-blue-600', path: '/user/sessions' },
    //{ icon: Heart, label: 'Favorites', sub: 'Saved consultants', color: 'bg-pink-100 text-pink-600', path: '/user/explore' },
    { icon: Settings, label: 'Settings', sub: 'Account preferences', color: 'bg-slate-100 text-slate-600', path: '/user/settings' },
  ];


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-primary px-6 pt-6 pb-20 rounded-b-[2rem]">
        <div className="flex items-center gap-4">
          {/* <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/20 rounded-full transition-colors text-white">
            <ArrowLeft className="w-6 h-6" />
          </button> */}
          <h1 className="font-display text-2xl font-bold text-white">My Profile</h1>
        </div>
      </div>

      {/* Profile Info Card */}
      <div className="px-6 -mt-14">
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-2xl shadow-elevated overflow-hidden border-4 border-white bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-3xl">
                {profileData?.profilePhotoUrl ? (
                  <img
                    src={profileData.profilePhotoUrl.startsWith('http') || profileData.profilePhotoUrl.startsWith('data:')
                      ? profileData.profilePhotoUrl
                      : `${API_BASE_URL}${profileData.profilePhotoUrl}`}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground truncate ">{displayName}</h2>
                  <p className="text-muted-foreground text-sm font-medium">
                    Member since {profileData?.createdOn ? new Date(profileData.createdOn).getFullYear() : '2025'}
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/user/edit-profile')}
                  className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg px-4 py-2 text-sm whitespace-nowrap"
                >
                  Edit Profile
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  <span>+{profileData?.countryCode || '91'} {profileData?.phoneNumber || user?.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <span className="truncate">{profileData?.email || user?.email || 'Not provided'}</span>
                </div>
                {profileData?.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground sm:col-span-2">
                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <span className="truncate">
                      {profileData.address.city}, {profileData.address.state}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mt-8 pt-6 border-t border-border">
            {statsGroups.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <h3 className="font-display text-lg font-semibold mb-4">Account</h3>
          <div className="space-y-2">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => navigate(action.path)}
                className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-all group"
              >
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", action.color)}>
                  <action.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-foreground text-sm">{action.label}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {/* Recent Activity */}
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
            <h3 className="font-display text-lg font-semibold mb-4">Activity</h3>
            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.map((activity, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground leading-tight truncate">{activity.message}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">No recent activity</p>
              )}
            </div>
          </div>

          {/* Help */}
          {/* <button className="w-full flex items-center gap-4 p-4 bg-card rounded-2xl border border-border hover:border-primary/30 transition-all hover:bg-muted/30 group shadow-card">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center transition-transform group-hover:scale-110">
              <HelpCircle className="w-5 h-5" />
            </div>
            <span className="flex-1 text-left font-semibold text-foreground">Help Center</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button> */}
        </div>
      </div>

      {/* Logout */}
      <div className="px-6 pb-20">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-destructive/20 hover:border-destructive/40 transition-all hover:bg-destructive/5 group shadow-card"
        >
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center transition-transform group-hover:scale-110">
            <LogOut className="w-5 h-5 text-destructive" />
          </div>
          <span className="flex-1 text-left font-semibold text-destructive">Logout</span>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
