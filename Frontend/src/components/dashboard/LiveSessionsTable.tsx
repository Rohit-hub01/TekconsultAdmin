import { Radio, MessageSquare, Phone, Clock, Eye, AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Session } from "@/lib/api";

interface LiveSessionsTableProps {
  initialSessions: Session[];
  onViewDetails?: (session: Session) => void;
  title?: string;
  showFilters?: boolean;
}

const ITEMS_PER_PAGE = 10;

export function LiveSessionsTable({
  initialSessions,
  onViewDetails,
  title = "Live Sessions"
}: LiveSessionsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const activeSessions = initialSessions.filter(s => s.status === 'active' || s.status === 'low_balance');

  useEffect(() => {
    setCurrentPage(1);
  }, [initialSessions]);

  const totalPages = Math.ceil(activeSessions.length / ITEMS_PER_PAGE);

  const paginatedSessions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return activeSessions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [activeSessions, currentPage]);

  return (
    <Card className="border-0 shadow-card">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Radio className="h-4 w-4 text-success animate-pulse" />
            {title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">Real-time session monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-success/10 text-success border-0">
            {activeSessions.length} Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                {/* <th>Session ID</th> */}
                <th>User</th>
                <th>Consultant</th>
                <th>Mode</th>
                <th>Duration</th>
                {/* <th>Rate</th> */}
                <th>Billed</th>
                {/* <th>Balance</th> */}
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSessions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-muted-foreground">
                    No active sessions found
                  </td>
                </tr>
              ) : paginatedSessions.map((session) => (
                <tr key={session.id}>
                  {/* <td className="font-mono text-xs">{session.id.slice(0, 8)}</td> */}
                  <td>
                    <div>
                      <p className="font-medium">{session.user.name}</p>
                      <p className="text-xs text-muted-foreground">{session.user.phone}</p>
                    </div>
                  </td>
                  <td>
                    <div>
                      <p className="font-medium">{session.consultant.name}</p>
                      <p className="text-xs text-muted-foreground">{session.consultant.category}</p>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      {session.mode === "chat" ? (
                        <MessageSquare className="h-4 w-4 text-info" />
                      ) : (
                        <Phone className="h-4 w-4 text-accent" />
                      )}
                      <span className="capitalize">{session.mode}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono">{session.duration}</span>
                    </div>
                  </td>
                  {/* <td className="font-medium">₹{session.rate}/min</td> */}
                  <td className="font-semibold text-accent">₹{session.billed.toFixed(2)}</td>
                  {/* <td>
                    <span className={cn(
                      "font-medium",
                      session.walletBalance < 200 ? "text-warning" : "text-foreground"
                    )}>
                      ₹{session.walletBalance}
                    </span>
                  </td> */}
                  <td>
                    <span className={cn(
                      "status-badge",
                      session.status === "active" ? "status-active" : "status-pending"
                    )}>
                      {session.status === "low_balance" && <AlertCircle className="h-3 w-3" />}
                      {session.status === "active" ? "Active" : "Low Balance"}
                    </span>
                  </td>
                  <td className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 h-8 px-2 hover:bg-accent/10 hover:text-accent"
                      onClick={() => onViewDetails?.(session)}
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {activeSessions.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-muted/50">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{Math.min(activeSessions.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)}</span> to{" "}
              <span className="font-medium">{Math.min(activeSessions.length, currentPage * ITEMS_PER_PAGE)}</span> of{" "}
              <span className="font-medium">{activeSessions.length}</span> sessions
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .map((page, index, array) => {
                    const showEllipsis = index > 0 && page - array[index - 1] > 1;
                    return (
                      <div key={page} className="flex items-center gap-1">
                        {showEllipsis && <span className="px-2 text-muted-foreground">...</span>}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "h-8 w-8 p-0",
                            currentPage === page && "bg-primary text-primary-foreground"
                          )}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      </div>
                    );
                  })}
              </div>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
