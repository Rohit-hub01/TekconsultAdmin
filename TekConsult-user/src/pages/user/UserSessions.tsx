import { useState, useEffect } from 'react';
import { Star, MessageCircle, Phone, Calendar, Loader2, Clock, MoreVertical, Flag, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { sessionAPI, UserSession, API_BASE_URL, disputeAPI } from '@/services/api';
import { SessionState } from '@/types/enums';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// Helper to ensure dates from server (UTC) are parsed correctly in local time
const parseServerDate = (dateStr: string | null | undefined): Date => {
  if (!dateStr) return new Date();
  const normalized = (dateStr.endsWith('Z') || dateStr.includes('+'))
    ? dateStr
    : `${dateStr}Z`;
  return new Date(normalized);
};

interface FormattedSession {
  id: string;
  consultantId: string;
  consultantName: string;
  consultantAvatar: string;
  type: 'chat' | 'call';
  status: 'active' | 'completed' | 'paused' | 'cancelled' | 'rejected';
  startTime: Date;
  duration: number;
  amount: number;
  rating?: number;
  specialization?: string[];
  isDisputed?: boolean;
}

const UserSessions = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<FormattedSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<FormattedSession | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [timeFilter, setTimeFilter] = useState('30days');
  const { user, consultant } = useAuth();
  const ITEMS_PER_PAGE = 10;

  // Generate years from joining date to current year
  const getYearOptions = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    const joinDateStr = user?.joiningDate || consultant?.joiningDate;
    const startYear = joinDateStr ? new Date(joinDateStr).getFullYear() : currentYear;

    for (let year = currentYear; year >= startYear; year--) {
      years.push(year);
    }
    return years;
  };

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);
      try {
        let status: SessionState | undefined;
        if (activeTab === 'completed') status = SessionState.Completed;
        if (activeTab === 'rejected') status = SessionState.Rejected;

        let startDate: string | undefined;
        let endDate: string | undefined;

        if (timeFilter !== 'all') {
          const now = new Date();
          if (timeFilter === '30days') {
            const date = new Date();
            date.setDate(date.getDate() - 30);
            startDate = date.toISOString();
          } else if (timeFilter === '3months') {
            const date = new Date();
            date.setMonth(date.getMonth() - 3);
            startDate = date.toISOString();
          } else if (timeFilter.startsWith('year-')) {
            const year = parseInt(timeFilter.split('-')[1]);
            const startOfYear = new Date(year, 0, 1);
            const endOfYear = new Date(year, 11, 31, 23, 59, 59);
            startDate = startOfYear.toISOString();
            endDate = endOfYear.toISOString();
          }
        }

        const response = await sessionAPI.getUserHistory(
          (currentPage - 1) * ITEMS_PER_PAGE,
          ITEMS_PER_PAGE,
          status,
          startDate,
          endDate
        );

        setTotalPages(response.totalPages);
        setHasMore(response.currentPage < response.totalPages);

        const formattedSessions: FormattedSession[] = response.sessions.map((session: UserSession) => ({
          id: session.sessionId,
          consultantId: session.userId,
          consultantName: session.userName,
          consultantAvatar: session.profilePhotoUrl
            ? (session.profilePhotoUrl.startsWith('http') ? session.profilePhotoUrl : `${API_BASE_URL}${session.profilePhotoUrl}`)
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(session.userName)}&background=random`,
          type: session.mode === 0 ? 'chat' : 'call',
          status: session.state === SessionState.Completed ? 'completed' :
            session.state === SessionState.Rejected ? 'rejected' :
              session.state === SessionState.Active ? 'active' : 'active',
          startTime: parseServerDate(session.startTime),
          duration: Math.ceil((session.durationSeconds || 0) / 60),
          amount: session.totalChargedAmount,
          rating: session.rating || 0,
          specialization: ['Consultation'],
          isDisputed: session.isDisputed
        }));
        setSessions(formattedSessions);
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
        toast({
          title: "Error",
          description: "Failed to load session history.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSessions();
  }, [currentPage, activeTab, timeFilter]);

  const handleTimeFilterChange = (value: string) => {
    setTimeFilter(value);
    setCurrentPage(1);
    setSessions([]);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1);
    setSessions([]);
  };

  const handleRaiseDispute = (session: FormattedSession) => {
    setSelectedSession(session);
    setDisputeModalOpen(true);
  };

  const renderSessions = (list: FormattedSession[], emptyMessage: string) => {
    if (list.length === 0) {
      return (
        <div className="py-16 text-center border border-dashed border-border/60 rounded-2xl bg-muted/20">
          <p className="text-base font-medium text-foreground">No history found</p>
          <p className="text-sm text-muted-foreground mt-1">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {list.map((session) => <SessionCard key={session.id} session={session} />)}
      </div>
    );
  };

  const submitDispute = async () => {
    if (!disputeReason || !disputeDescription) {
      toast({
        title: "Missing Information",
        description: "Please select a reason and provide a description.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (!selectedSession) return;

      const fullDescription = `Reason: ${disputeReason}\nDescription: ${disputeDescription}`;

      await disputeAPI.raiseDispute(
        selectedSession.id,
        fullDescription,
        selectedSession.amount // Default to requesting full refund
      );

      toast({
        title: "Dispute Raised",
        description: `Your dispute for session with ${selectedSession.consultantName} has been recorded. Our team will review it shortly.`,
      });

      // Update local state to hide the dispute button immediately
      setSessions(prev => prev.map(s => s.id === selectedSession.id ? { ...s, isDisputed: true } : s));

      setDisputeModalOpen(false);
      setDisputeReason('');
      setDisputeDescription('');
    } catch (error: any) {
      console.error('Failed to raise dispute:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to raise dispute. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const SessionCard = ({ session }: { session: FormattedSession }) => (
    <div className="bg-card rounded-[1.5rem] border border-border/60 p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-4">
          <img
            src={session.consultantAvatar}
            alt={session.consultantName}
            className="w-14 h-14 rounded-full object-cover border-2 border-background shadow-sm"
          />
          <div>
            <h3 className="font-bold text-lg text-foreground">{session.consultantName}</h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {session.specialization?.map((tag, i) => (
                <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded-full uppercase tracking-wide">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-lg">
            <Star className="w-3.5 h-3.5 fill-amber-700" />
            <span className="text-xs font-bold">{session.rating?.toFixed(1) || '0.0'}</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-border/60">
              {!session.isDisputed && (
                <DropdownMenuItem onClick={() => handleRaiseDispute(session)} className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive py-2.5">
                  <Flag className="w-4 h-4 text-destructive" />
                  <span>Raise Dispute</span>
                </DropdownMenuItem>
              )}
              {session.isDisputed && (
                <div className="px-3 py-2.5 text-xs text-muted-foreground flex items-center gap-2">
                  <Flag className="w-3.5 h-3.5" />
                  <span>Dispute already raised</span>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-2 mb-5 pl-[4.5rem] -mt-2">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{session.startTime.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{session.startTime.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">Duration: <span className="font-medium text-foreground">{session.duration} min</span></span>
          <span className="text-muted-foreground">Cost: <span className="font-bold text-primary">₹{session.amount}</span></span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border/60">
        <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center">
          {session.type === 'call' ? <Phone className="w-5 h-5 text-primary" /> : <MessageCircle className="w-5 h-5 text-primary" />}
        </div>
        <div className="flex gap-2 mr-auto ml-4">
          <div className={cn(
            "px-4 py-1.5 rounded-full text-sm font-medium border",
            session.status === 'completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
              (session.status === 'cancelled' || session.status === 'rejected') ? "bg-red-50 text-red-600 border-red-100" :
                "bg-blue-50 text-blue-600 border-blue-100"
          )}>
            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
          </div>
          {session.isDisputed && (
            <div className="px-4 py-1.5 rounded-full text-sm font-medium border bg-amber-50 text-amber-600 border-amber-100 flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5" />
              Disputed
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!session.isDisputed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRaiseDispute(session)}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-full h-9 w-9"
              title="Raise Dispute"
            >
              <Flag className="w-4 h-4" />
            </Button>
          )}

          {session.status !== 'rejected' && session.status !== 'cancelled' ? (
            <Button
              variant="outline"
              className="border-primary/20 text-primary hover:bg-primary/5 hover:text-primary h-9 rounded-xl px-4 text-xs font-semibold"
              onClick={() => navigate(`/user/consultant/${session.consultantId}`)}
            >
              Book Again
            </Button>
          ) : (
            null
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-2">
      <div className="px-6 pt-8 pb-4">
        <h1 className="font-display text-3xl font-bold text-foreground mb-1">History</h1>
        <p className="text-muted-foreground text-sm">Your session history will appear here</p>
      </div>

      <div className="px-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div className="bg-muted/40 p-1.5 rounded-full inline-flex">
                <TabsList className="bg-transparent h-auto p-0 gap-1">
                  <TabsTrigger value="all" className="rounded-full px-6 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium transition-all">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="rounded-full px-6 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium transition-all">
                    Completed
                  </TabsTrigger>
                  <TabsTrigger value="rejected" className="rounded-full px-6 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium transition-all">
                    Cancelled
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="w-full sm:w-48">
                <Select value={timeFilter} onValueChange={handleTimeFilterChange}>
                  <SelectTrigger className="rounded-full border-border/60 bg-muted/40 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/60">
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="3months">Last 3 Months</SelectItem>
                    {getYearOptions().map(year => (
                      <SelectItem key={year} value={`year-${year}`}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value="all" className="mt-0">
              {renderSessions(sessions, 'No session history is available for this filter.')}
            </TabsContent>
            <TabsContent value="completed" className="mt-0">
              {renderSessions(
                sessions.filter(s => s.status === 'completed'),
                'No completed sessions found.'
              )}
            </TabsContent>
            <TabsContent value="rejected" className="mt-0">
              {renderSessions(
                sessions.filter(s => s.status === 'rejected'),
                'No cancelled sessions found.'
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>



      {/* Pagination Controls */}
      {!isLoading && sessions.length > 0 && totalPages > 1 && (
        <div className="flex justify-end items-center gap-2 py-8 px-6 bg-background">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || isLoading}
            className="text-muted-foreground hover:text-primary transition-colors gap-1 h-9 px-3"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex items-center justify-center min-w-[100px] text-sm font-medium text-foreground">
            Page {currentPage} of {totalPages}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || isLoading}
            className="text-muted-foreground hover:text-primary transition-colors gap-1 h-9 px-3"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      <Dialog open={disputeModalOpen} onOpenChange={setDisputeModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem] gap-6">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold flex items-center gap-2">
              <Flag className="w-6 h-6 text-destructive" />
              Raise a Dispute
            </DialogTitle>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-6">
              <div className="bg-muted/50 p-4 rounded-2xl border border-border/60">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold text-foreground">Session with {selectedSession.consultantName}</p>
                  <span className="text-xs text-primary font-bold">₹{selectedSession.amount}</span>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{selectedSession.startTime.toLocaleDateString('en-IN')}</span>
                  <span>{selectedSession.type === 'chat' ? 'Chat' : 'Call'}</span>
                  <span>{selectedSession.duration} mins</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Dispute Reason</label>
                <Select value={disputeReason} onValueChange={setDisputeReason}>
                  <SelectTrigger className="h-12 rounded-xl border-border/60">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-lg border-border/60">
                    <SelectItem value="technical">Technical Issue</SelectItem>
                    <SelectItem value="quality">Poor quality</SelectItem>
                    <SelectItem value="behavior">Inappropriate behavior</SelectItem>
                    <SelectItem value="billing">Incorrect billing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Description</label>
                <Textarea
                  placeholder="Detail the issue..."
                  className="min-h-[120px] rounded-2xl border-border/60 resize-none p-4"
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-3">
            <Button variant="ghost" onClick={() => setDisputeModalOpen(false)} className="rounded-xl h-12 flex-1 font-semibold">
              Cancel
            </Button>
            <Button className="rounded-xl h-12 flex-1 gradient-primary text-white font-bold shadow-lg shadow-primary/20" onClick={submitDispute} disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : "Submit Dispute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserSessions;
