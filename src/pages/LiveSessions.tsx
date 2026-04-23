import { useState, useEffect, useCallback } from "react";
import { Radio, MessageSquare, Phone, Clock, Eye, Search, Filter, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { api, Session } from "@/lib/api";
import { toast } from "sonner";
import { LiveSessionsTable } from "@/components/dashboard/LiveSessionsTable";
import LiveSessionDetailsModal from "@/components/sessions/LiveSessionDetailsModal";

export default function LiveSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modeFilter, setModeFilter] = useState<string>("all");

  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch active sessions from backend
      const data = await api.getActiveSessions();

      // Apply filters client-side as the backend endpoint provides all active sessions
      let filtered = [...data];

      if (statusFilter !== "all") {
        filtered = filtered.filter(s => s.status === statusFilter);
      }

      if (modeFilter !== "all") {
        filtered = filtered.filter(s => s.mode === modeFilter);
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(s =>
          s.id.toLowerCase().includes(query) ||
          s.user.name.toLowerCase().includes(query) ||
          s.user.phone.toLowerCase().includes(query) ||
          s.consultant.name.toLowerCase().includes(query) ||
          s.consultant.category.toLowerCase().includes(query)
        );
      }

      setSessions(filtered);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to load active sessions");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, modeFilter, api]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSessions();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchSessions]);

  const activeCount = sessions.filter((s) => s.status === "active").length;
  const lowBalanceCount = sessions.filter((s) => s.status === "low_balance").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2">
            <Radio className="h-6 w-6 text-success animate-pulse" />
            Live Sessions
          </h1>
          <p className="page-description">Real-time monitoring of active consultations</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-success/15 text-success border-0 px-3 py-1.5">
            {activeCount} Active
          </Badge>
          {lowBalanceCount > 0 && (
            <Badge className="bg-warning/15 text-warning border-0 px-3 py-1.5">
              {lowBalanceCount} Low Balance
            </Badge>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by session ID, user, or consultant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-muted/50 border-0"
              />
            </div>

            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-muted/50 border-0">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="low_balance">Low Balance</SelectItem>
                </SelectContent>
              </Select>

              <Select value={modeFilter} onValueChange={setModeFilter}>
                <SelectTrigger className="w-[120px] bg-muted/50 border-0">
                  <SelectValue placeholder="All Modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="chat">Chat</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => fetchSessions()}
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <div className="space-y-4">
        {isLoading ? (
          <Card className="border-0 shadow-card">
            <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
              <Loader2 className="h-8 w-8 text-accent animate-spin" />
              <p className="text-muted-foreground animate-pulse">Loading live sessions...</p>
            </CardContent>
          </Card>
        ) : (
          <LiveSessionsTable
            initialSessions={sessions}
            title="Active Sessions"
            onViewDetails={(session) => {
              setSelectedSession(session);
              setIsDetailsOpen(true);
            }}
          />
        )}
      </div>

      {/* Info Banner */}
      <Card className="border-0 bg-info/5 shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-info/10 p-2">
              <Eye className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="font-medium text-info">Observation Mode</p>
              <p className="text-sm text-muted-foreground">
                Admins can monitor sessions in real-time but cannot manipulate active sessions.
                Chat transcripts are only accessible for dispute resolution.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      {
        selectedSession && (
          <LiveSessionDetailsModal
            isOpen={isDetailsOpen}
            onClose={() => {
              setIsDetailsOpen(false);
              setSelectedSession(null);
            }}
            session={selectedSession}
          />
        )
      }
    </div >
  );
}
