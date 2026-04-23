import { useState, useEffect } from 'react';
import {
  User,
  Star,
  CheckCircle,
  MapPin,
  Globe,
  Briefcase,
  Edit,
  LogOut,
  ChevronRight,
  MessageCircle,
  Phone,
  Save,
  Loader2,
  Tag,
  Calendar,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { userAPI, consultantAPI, API_BASE_URL } from '@/services/api';

const ConsultantProfilePage = () => {
  const { logout, consultant: authConsultant } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditRatesOpen, setIsEditRatesOpen] = useState(false);
  const [chatRate, setChatRate] = useState('0');
  const [callRate, setCallRate] = useState('0');
  const [discountedChatRate, setDiscountedChatRate] = useState<string>('');
  const [isChatDiscountActive, setIsChatDiscountActive] = useState(false);
  const [discountedCallRate, setDiscountedCallRate] = useState<string>('');
  const [isCallDiscountActive, setIsCallDiscountActive] = useState(false);
  const [discountStart, setDiscountStart] = useState<string>('');
  const [discountEnd, setDiscountEnd] = useState<string>('');
  const [isSavingRates, setIsSavingRates] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const data = await userAPI.getUserById(userId);
        setProfileData(data);

        // Bind rates from the flat structure or fallback
        const cRate = data?.chatRatePerMinute ?? authConsultant?.chatRate ?? 0;
        const vRate = data?.callRatePerMinute ?? authConsultant?.callRate ?? 0;
        setChatRate(cRate.toString());
        setCallRate(vRate.toString());

        setDiscountedChatRate(data?.discountedChatRate?.toString() || '');
        setIsChatDiscountActive(data?.isChatDiscountActive || false);
        setDiscountedCallRate(data?.discountedCallRate?.toString() || '');
        setIsCallDiscountActive(data?.isCallDiscountActive || false);

        if (data?.discountStart) setDiscountStart(new Date(data.discountStart).toISOString().split('T')[0]);
        if (data?.discountEnd) setDiscountEnd(new Date(data.discountEnd).toISOString().split('T')[0]);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [authConsultant]);

  const displayName = profileData
    ? `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim()
    : authConsultant?.name || 'Consultant';

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'C';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSaveRates = async () => {
    // Validation
    const chatRateNum = parseFloat(chatRate);
    const callRateNum = parseFloat(callRate);
    const discChatRateNum = discountedChatRate ? parseFloat(discountedChatRate) : undefined;
    const discCallRateNum = discountedCallRate ? parseFloat(discountedCallRate) : undefined;

    if (isNaN(chatRateNum) || chatRateNum < 0) {
      toast({ title: "Invalid Rate", description: "Chat rate must be a positive number", variant: "destructive" });
      return;
    }
    if (isNaN(callRateNum) || callRateNum < 0) {
      toast({ title: "Invalid Rate", description: "Call rate must be a positive number", variant: "destructive" });
      return;
    }

    if (isChatDiscountActive) {
      if (discChatRateNum === undefined || isNaN(discChatRateNum)) {
        toast({ title: "Missing Discount Rate", description: "Please provide a discounted chat rate", variant: "destructive" });
        return;
      }
      if (discChatRateNum >= chatRateNum) {
        toast({ title: "Invalid Discount", description: "Discounted chat rate must be lower than normal rate", variant: "destructive" });
        return;
      }
      if (discChatRateNum < 0) {
        toast({ title: "Invalid Discount", description: "Discounted chat rate cannot be negative", variant: "destructive" });
        return;
      }
    }

    if (isCallDiscountActive) {
      if (discCallRateNum === undefined || isNaN(discCallRateNum)) {
        toast({ title: "Missing Discount Rate", description: "Please provide a discounted call rate", variant: "destructive" });
        return;
      }
      if (discCallRateNum >= callRateNum) {
        toast({ title: "Invalid Discount", description: "Discounted call rate must be lower than normal rate", variant: "destructive" });
        return;
      }
      if (discCallRateNum < 0) {
        toast({ title: "Invalid Discount", description: "Discounted call rate cannot be negative", variant: "destructive" });
        return;
      }
    }

    if (discountStart && discountEnd) {
      const start = new Date(discountStart);
      const end = new Date(discountEnd);
      if (end < start) {
        toast({ title: "Invalid Dates", description: "Discount end date cannot be before start date", variant: "destructive" });
        return;
      }
    }

    setIsSavingRates(true);
    try {
      await consultantAPI.updateRates({
        chatRatePerMinute: chatRateNum,
        callRatePerMinute: callRateNum,
        discountedChatRate: discChatRateNum,
        isChatDiscountActive,
        discountedCallRate: discCallRateNum,
        isCallDiscountActive,
        discountStart: discountStart || undefined,
        discountEnd: discountEnd || undefined
      });

      setIsEditRatesOpen(false);
      toast({
        title: 'Rates Updated',
        description: 'Your new rates will apply to future sessions',
      });

      // Update local profile data to reflect changes
      if (profileData) {
        setProfileData({
          ...profileData,
          chatRatePerMinute: chatRateNum,
          callRatePerMinute: callRateNum,
          discountedChatRate: discChatRateNum ?? null,
          isChatDiscountActive,
          discountedCallRate: discCallRateNum ?? null,
          isCallDiscountActive,
          discountStart: discountStart || null,
          discountEnd: discountEnd || null
        });
      }
    } catch (error: any) {
      console.error('Failed to update rates:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update rates. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSavingRates(false);
    }
  };

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
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-primary-foreground">
            My Profile
          </h1>
          <Button
            onClick={() => navigate('/consultant/edit-profile')}
            className="bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="px-6 -mt-14">
        <div className="bg-card rounded-2xl shadow-card p-6 border border-border">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl shadow-elevated overflow-hidden border-4 border-white bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl">
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
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-success border-2 border-card flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-success-foreground" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <h2 className="font-display text-xl font-bold text-foreground">
                  {displayName}
                </h2>
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <p className="text-muted-foreground text-sm">
                {profileData?.consultantCategory || authConsultant?.subcategory || 'Specialist'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 bg-warning/10 text-warning px-2 py-0.5 rounded-lg">
                  <Star className="w-3.5 h-3.5 fill-warning" />
                  <span className="text-sm font-semibold">{Number(profileData?.averageRating || authConsultant?.rating || 4.9).toFixed(1)}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  ({profileData?.totalReviews || authConsultant?.totalReviews || 120} reviews)
                </span>
              </div>
            </div>
          </div>

          {/* Location if available */}
          {profileData?.address && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{profileData.address.city}, {profileData.address.state}, {profileData.address.country}</span>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
            <div className="text-center">
              <p className="font-bold text-foreground">{profileData?.experienceYears || authConsultant?.experience || 0} yrs</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Experience</p>
            </div>
            <div className="text-center border-x border-border">
              <p className="font-bold text-foreground">{profileData?.totalSessionsCompleted || authConsultant?.totalConsultations || 0}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sessions</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-foreground">
                {profileData?.languages
                  ? (Array.isArray(profileData.languages) ? profileData.languages.length : profileData.languages.split(',').length)
                  : (authConsultant?.languages?.length || 2)}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Languages</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rates & Languages Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 py-6">
        {/* Session Rates */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold">Session Rates</h3>
            <Dialog open={isEditRatesOpen} onOpenChange={setIsEditRatesOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card">
                <DialogHeader>
                  <DialogTitle className="font-display">Edit Session Rates</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-primary" />
                        Chat Rate (₹/min)
                      </label>
                      <Input
                        type="number"
                        value={chatRate}
                        onChange={(e) => setChatRate(e.target.value)}
                        className="h-12 rounded-xl border-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Tag className="w-4 h-4 text-orange-500" />
                        Disc. Chat Rate
                      </label>
                      <Input
                        type="number"
                        placeholder="Optional"
                        value={discountedChatRate}
                        onChange={(e) => setDiscountedChatRate(e.target.value)}
                        className="h-12 rounded-xl border-2"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold">Activate Chat Discount</Label>
                      <p className="text-xs text-muted-foreground">Apply discounted rate for chat</p>
                    </div>
                    <Switch
                      checked={isChatDiscountActive}
                      onCheckedChange={setIsChatDiscountActive}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Phone className="w-4 h-4 text-primary" />
                        Call Rate (₹/min)
                      </label>
                      <Input
                        type="number"
                        value={callRate}
                        onChange={(e) => setCallRate(e.target.value)}
                        className="h-12 rounded-xl border-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Tag className="w-4 h-4 text-orange-500" />
                        Disc. Call Rate
                      </label>
                      <Input
                        type="number"
                        placeholder="Optional"
                        value={discountedCallRate}
                        onChange={(e) => setDiscountedCallRate(e.target.value)}
                        className="h-12 rounded-xl border-2"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold">Activate Call Discount</Label>
                      <p className="text-xs text-muted-foreground">Apply discounted rate for calls</p>
                    </div>
                    <Switch
                      checked={isCallDiscountActive}
                      onCheckedChange={setIsCallDiscountActive}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        Start Date
                      </label>
                      <Input
                        type="date"
                        value={discountStart}
                        onChange={(e) => setDiscountStart(e.target.value)}
                        className="h-12 rounded-xl border-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        End Date
                      </label>
                      <Input
                        type="date"
                        value={discountEnd}
                        onChange={(e) => setDiscountEnd(e.target.value)}
                        className="h-12 rounded-xl border-2"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveRates}
                    disabled={isSavingRates}
                    className="w-full h-12 rounded-xl gradient-primary text-white font-bold mt-4"
                  >
                    {isSavingRates ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {isSavingRates ? 'Saving...' : 'Save Pricing'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-muted/50 rounded-xl text-center relative overflow-hidden">
              <MessageCircle className="w-5 h-5 text-primary mx-auto mb-2" />
              {profileData?.isChatDiscountActive && profileData?.discountedChatRate ? (
                <div className="flex flex-col items-center">
                  <p className="text-xl font-bold text-foreground">₹{profileData.discountedChatRate}</p>
                  <p className="text-[10px] text-muted-foreground line-through">₹{chatRate}</p>
                  <div className="absolute top-0 right-0 bg-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-bl-lg">DISC.</div>
                </div>
              ) : (
                <p className="text-xl font-bold text-foreground">₹{chatRate}</p>
              )}
              <p className="text-[10px] text-muted-foreground uppercase">per minute</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-xl text-center relative overflow-hidden">
              <Phone className="w-5 h-5 text-primary mx-auto mb-2" />
              {profileData?.isCallDiscountActive && profileData?.discountedCallRate ? (
                <div className="flex flex-col items-center">
                  <p className="text-xl font-bold text-foreground">₹{profileData.discountedCallRate}</p>
                  <p className="text-[10px] text-muted-foreground line-through">₹{callRate}</p>
                  <div className="absolute top-0 right-0 bg-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-bl-lg">DISC.</div>
                </div>
              ) : (
                <p className="text-xl font-bold text-foreground">₹{callRate}</p>
              )}
              <p className="text-[10px] text-muted-foreground uppercase">per minute</p>
            </div>
          </div>
        </div>

        {/* Languages & Professional Info */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-card space-y-4">
          <div>
            <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              Languages
            </h3>
            <div className="flex flex-wrap gap-2">
              {profileData?.languages
                ? (Array.isArray(profileData.languages)
                  ? profileData.languages.map((lang: string) => (
                    <Badge key={lang} variant="secondary" className="rounded-lg bg-primary/5 text-primary border-0">
                      {lang}
                    </Badge>
                  ))
                  : profileData.languages.split(',').map((lang: string) => (
                    <Badge key={lang.trim()} variant="secondary" className="rounded-lg bg-primary/5 text-primary border-0">
                      {lang.trim()}
                    </Badge>
                  ))
                )
                : (authConsultant?.languages || ['English', 'Hindi']).map((lang: string) => (
                  <Badge key={lang} variant="secondary" className="rounded-lg bg-primary/5 text-primary border-0">
                    {lang}
                  </Badge>
                ))
              }
            </div>
          </div>
          <div className="pt-4 border-t border-border">
            <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              About me
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {profileData?.bio || authConsultant?.bio || 'Highly experienced expert in my field with a passion for helping others achieve their goals through expert consultation.'}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Options */}
      <div className="px-6 pb-20 space-y-3">
        <button
          onClick={() => navigate('/consultant/bank-details')}
          className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/30 transition-all hover:bg-muted/30 group"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center transition-transform group-hover:scale-110">
            <Briefcase className="w-5 h-5 text-primary" />
          </div>
          <span className="flex-1 text-left font-semibold text-foreground">Bank Details</span>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
        <button
          onClick={() => navigate('/consultant/kyc-documents')}
          className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/30 transition-all hover:bg-muted/30 group"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center transition-transform group-hover:scale-110">
            <CheckCircle className="w-5 h-5 text-primary" />
          </div>
          <span className="flex-1 text-left font-semibold text-foreground">KYC Documents</span>
          <Badge variant="secondary" className="bg-success text-success-foreground border-0 font-bold">
            Verified
          </Badge>
        </button>
        <button
          onClick={() => navigate('/consultant/settings')}
          className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/30 transition-all hover:bg-muted/30 group"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center transition-transform group-hover:scale-110">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <span className="flex-1 text-left font-semibold text-foreground">Settings</span>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-destructive/20 hover:border-destructive/40 transition-all hover:bg-destructive/5 group mt-4"
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

export default ConsultantProfilePage;
