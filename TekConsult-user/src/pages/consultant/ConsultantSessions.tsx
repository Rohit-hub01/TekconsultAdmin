import { Star, MessageCircle, Phone, Calendar, Clock, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { sessionAPI, type UserSession } from '@/services/api';
import { SessionState } from '@/types/enums';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

// Helper to ensure dates from server (UTC) are parsed correctly in local time
const parseServerDate = (dateStr: string | null | undefined): Date => {
  if (!dateStr) return new Date();
  const normalized = (dateStr.endsWith('Z') || dateStr.includes('+'))
    ? dateStr
    : `${dateStr}Z`;
  return new Date(normalized);
};

const ConsultantSessions = () => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        // Consultants use the same user-history endpoint but it returns their consultant history
        const response = await sessionAPI.getUserHistory((currentPage - 1) * ITEMS_PER_PAGE, ITEMS_PER_PAGE);
        setSessions(response.sessions);
        setTotalPages(response.totalPages);
        setTotalCount(response.totalCount);
      } catch (error) {
        console.error('Failed to fetch session history:', error);
        toast({
          title: "Error",
          description: "Failed to load session history.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [currentPage]);

  // const totalEarnings = sessions.reduce((acc, s) => acc + (s.consultantEarnings || 0), 0);
  // const totalDuration = sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  // const totalMinutes = Math.floor(totalDuration / 60);
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className=" px-6 pt-6 pb-8 rounded-b-[2rem]">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Session History
        </h1>
        <p className="text-muted-foreground mt-1">
          View your past consultations
        </p>
      </div>

      {/* Stats Summary */}
      {/* <div className="px-6 mt-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl p-3 border border-border shadow-card text-center">
            <p className="text-xl font-bold text-foreground">{sessions.length}</p>
            <p className="text-xs text-muted-foreground">Total Sessions</p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border shadow-card text-center">
            <p className="text-xl font-bold text-foreground">
              {totalMinutes} min
            </p>
            <p className="text-xs text-muted-foreground">Total Time</p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border shadow-card text-center">
            <p className="text-xl font-bold text-foreground">
              ₹{totalEarnings.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Earned</p>
          </div>
        </div>
      </div> */}

      {/* Sessions List */}
      <div className="px-6 py-6 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-dashed border-border">
            <p className="text-muted-foreground">No sessions found</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.sessionId}
              className="bg-card rounded-2xl border border-border p-4"
            >
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  {session.mode === 0 ? (
                    <MessageCircle className="w-6 h-6 text-primary" />
                  ) : (
                    <Phone className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{session.userName}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{Math.floor(session.durationSeconds / 60)} min</span>
                    <span>•</span>
                    <span className="capitalize">{session.mode === 0 ? 'chat' : 'voice call'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-success">+₹{session.consultantEarnings}</p>
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      session.state === SessionState.Completed ? 'bg-success/10 text-success' :
                        session.state === SessionState.Rejected ? 'bg-destructive/10 text-destructive' :
                          'bg-primary/10 text-primary'
                    )}
                  >
                    {session.state === SessionState.Completed ? 'completed' :
                      session.state === SessionState.Rejected ? 'rejected' :
                        session.state === SessionState.Active ? 'active' : 'pending'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {parseServerDate(session.startTime).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  at{' '}
                  {parseServerDate(session.startTime).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                {session.rating > 0 && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: session.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
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
    </div>
  );
};

export default ConsultantSessions;
