import { useState, useEffect, useCallback, useMemo } from "react";
import { AlertTriangle, Search, Filter, Eye, CheckCircle, XCircle, MoreHorizontal, MessageSquare, Clock, RefreshCw, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, Dispute } from "@/lib/api";
import { toast } from "sonner";
import DisputeDetailsModal from "@/components/disputes/DisputeDetailsModal";
import IssueRefundModal from "@/components/disputes/IssueRefundModal";
import RejectDisputeModal from "@/components/disputes/RejectDisputeModal";
import ChatLogModal from "@/components/disputes/ChatLogModal";

const priorityConfig = {
  high: { label: "High", class: "bg-destructive/15 text-destructive" },
  medium: { label: "Medium", class: "bg-warning/15 text-warning" },
  low: { label: "Low", class: "bg-muted text-muted-foreground" },
};

const statusConfig = {
  open: { label: "Pending", class: "status-pending" },
  resolved: { label: "Resolved", class: "status-approved" },
  rejected: { label: "Rejected", class: "status-rejected" },
};

const ITEMS_PER_PAGE = 10;


export default function Disputes() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isChatLogOpen, setIsChatLogOpen] = useState(false);
  const [internalNote, setInternalNote] = useState("");
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchDisputes = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.getDisputes();
      setDisputes(data);
    } catch (error) {
      console.error("Error fetching disputes:", error);
      toast.error("Failed to load disputes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);



  const handleRefundConfirm = async (refundData: { amount: number, reason: string }) => {
    if (!selectedDispute) return;

    try {
      setIsLoading(true);
      await api.resolveDispute(selectedDispute.id, true, refundData.amount);
      toast.success("Refund issued successfully");
      fetchDisputes();
      setIsRefundModalOpen(false);
      setIsDetailsOpen(false);
    } catch (error) {
      console.error("Error issuing refund:", error);
      toast.error("Failed to issue refund");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectConfirm = async (rejectionData: { reason: string, notes: string }) => {
    if (!selectedDispute) return;

    try {
      setIsLoading(true);
      await api.resolveDispute(selectedDispute.id, false);
      toast.success("Dispute rejected successfully");
      fetchDisputes();
      setIsRejectModalOpen(false);
      setIsDetailsOpen(false);
    } catch (error) {
      console.error("Error rejecting dispute:", error);
      toast.error("Failed to reject dispute");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDisputes = useMemo(() => {
    return disputes.filter(d => {
      const matchesSearch =
        d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.consultant.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || d.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [disputes, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredDisputes.length / ITEMS_PER_PAGE);

  const paginatedDisputes = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDisputes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredDisputes, currentPage]);

  const summary = useMemo(() => {
    return disputes.reduce((acc, d) => {
      acc[d.status]++;
      if (d.status === 'open') {
        acc.totalAtStake += d.amount;
      }
      return acc;
    }, { open: 0, resolved: 0, rejected: 0, totalAtStake: 0 });
  }, [disputes]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Dispute Management</h1>
          <p className="page-description">Handle user complaints and process refunds</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-destructive/15 text-destructive border-0 px-3 py-1.5">
            {summary.open} Open
          </Badge>
          <Badge className="bg-warning/15 text-warning border-0 px-3 py-1.5">
            ₹{summary.totalAtStake.toLocaleString()} at stake
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="border-0 shadow-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-destructive">{summary.open}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Resolved</p>
            <p className="text-2xl font-bold text-success">{summary.resolved}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Rejected</p>
            <p className="text-2xl font-bold text-muted-foreground">{summary.rejected}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by dispute ID, user, or consultant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-muted/50 border-0"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] bg-muted/50 border-0">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={fetchDisputes}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Disputes Table */}
      <Card className="border-0 shadow-card">
        <CardHeader className="pb-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            All Disputes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  {/* <th>Dispute ID</th> */}
                  {/* <th>Session</th> */}
                  <th>User</th>
                  <th>Consultant</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">Loading disputes...</p>
                    </td>
                  </tr>
                ) : paginatedDisputes.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-muted-foreground">
                      No disputes found
                    </td>
                  </tr>
                ) : paginatedDisputes.map((dispute) => (
                  <tr key={dispute.id}>
                    {/* <td className="font-mono text-xs">{dispute.id}</td> */}
                    {/* <td className="font-mono text-xs text-muted-foreground">{dispute.session}</td> */}
                    <td className="font-medium">{dispute.user}</td>
                    <td className="text-muted-foreground">{dispute.consultant}</td>
                    <td>
                      <Badge variant="secondary" className="font-normal">
                        {dispute.category}
                      </Badge>
                    </td>
                    <td className="font-semibold">₹{dispute.amount}</td>
                    <td>
                      <span className={cn("status-badge", statusConfig[dispute.status as keyof typeof statusConfig].class)}>
                        {statusConfig[dispute.status as keyof typeof statusConfig].label}
                      </span>
                    </td>
                    <td className="text-muted-foreground text-sm">{dispute.createdDate}</td>
                    <td className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" onClick={() => {
                            setSelectedDispute(dispute);
                            setIsDetailsOpen(true);
                          }}>
                            <Eye className="h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={() => {
                              setSelectedDispute(dispute);
                              setIsChatLogOpen(true);
                            }}
                          >
                            <MessageSquare className="h-4 w-4" /> View Chat Log
                          </DropdownMenuItem>
                          {(dispute.status === "open" || dispute.status === "in_review") && (
                            <>
                              <DropdownMenuItem
                                className="gap-2 text-success"
                                onClick={() => {
                                  setSelectedDispute(dispute);
                                  setIsRefundModalOpen(true);
                                }}
                              >
                                <CheckCircle className="h-4 w-4" /> Issue Refund
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 text-destructive"
                                onClick={() => {
                                  setSelectedDispute(dispute);
                                  setIsRejectModalOpen(true);
                                }}
                              >
                                <XCircle className="h-4 w-4" /> Reject
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && filteredDisputes.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-muted/50">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{Math.min(filteredDisputes.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)}</span> to{" "}
                <span className="font-medium">{Math.min(filteredDisputes.length, currentPage * ITEMS_PER_PAGE)}</span> of{" "}
                <span className="font-medium">{filteredDisputes.length}</span> disputes
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

      {/* Dispute Details Modal */}
      <DisputeDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        dispute={selectedDispute}
        onAssign={(dispute) => {
          toast.success(`Dispute ${dispute.id} assigned to you`);
        }}
        onAction={(dispute) => {
          if (dispute.status === 'open' || dispute.status === 'in_review') {
            setIsRefundModalOpen(true);
          } else {
            toast.info("No further action required for this dispute");
          }
        }}
      />

      {/* Issue Refund Modal */}
      <IssueRefundModal
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        dispute={selectedDispute}
        onConfirm={handleRefundConfirm}
      />

      {/* Reject Dispute Modal */}
      <RejectDisputeModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        dispute={selectedDispute}
        onConfirm={handleRejectConfirm}
      />

      <ChatLogModal
        isOpen={isChatLogOpen}
        onClose={() => setIsChatLogOpen(false)}
        sessionId={selectedDispute?.session || ""}
      />
    </div>
  );
}
