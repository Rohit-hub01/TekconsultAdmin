import { useState, useEffect, useCallback, useMemo } from "react";
import { ArrowDownToLine, Search, Filter, CheckCircle, XCircle, Clock, Eye, MoreHorizontal, Download, History, RefreshCw, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
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
import { api, Withdrawal, BackendWithdrawal } from "@/lib/api";
import { toast } from "sonner";
import { exportToCSV, ExportColumn } from "@/lib/export";
import WithdrawalRequestModal, { WithdrawalRequest } from "@/components/withdrawals/WithdrawalRequestModal";

import ApproveWithdrawalModal, { WithdrawalData } from "@/components/withdrawals/ApproveWithdrawalModal";
import WithdrawalApprovedModal from "@/components/withdrawals/WithdrawalApprovedModal";

const auditLogs = [
  { id: 1, action: "Approved Payout", target: "WTH-004", actor: "System", time: "2 hours ago" },
  { id: 3, action: "Rejected Request", target: "WTH-002", actor: "Admin Rahul", time: "1 day ago" },
];

const statusConfig = {
  requested: { label: "Requested", class: "status-pending", icon: Clock },
  approved: { label: "Approved", class: "status-info", icon: CheckCircle },
  paid: { label: "Paid", class: "status-approved", icon: CheckCircle },
  failed: { label: "Failed", class: "status-rejected", icon: XCircle },
};

const ITEMS_PER_PAGE = 10;

export default function Withdrawals() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedWithdrawalRequest, setSelectedWithdrawalRequest] = useState<WithdrawalRequest | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedApproveData, setSelectedApproveData] = useState<WithdrawalData | null>(null);
  const [isApprovedSuccessModalOpen, setIsApprovedSuccessModalOpen] = useState(false);
  const [approvedAmount, setApprovedAmount] = useState<number | undefined>(undefined);

  const fetchWithdrawals = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.getWithdrawals({
        _sort: 'requestedDate',
        _order: 'desc'
      });
      setWithdrawals(data);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      toast.error("Failed to load withdrawal requests");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const handleApproveWithdrawal = async (requestId: string) => {
    try {
      await api.processWithdrawal(requestId, true);
      toast.success('Withdrawal approved successfully');
      fetchWithdrawals();
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      toast.error('Failed to approve withdrawal');
      throw error;
    }
  };

  const handleRejectWithdrawal = async (requestId: string) => {
    try {
      await api.processWithdrawal(requestId, false);
      toast.success('Withdrawal rejected successfully');
      fetchWithdrawals();
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      toast.error('Failed to reject withdrawal');
      throw error;
    }
  };

  const handleViewDetails = async (withdrawal: Withdrawal) => {
    try {
      setIsLoading(true);
      const withdrawalRequest = await api.getWithdrawalDetails(withdrawal.id);
      setSelectedWithdrawalRequest(withdrawalRequest);
      setIsRequestModalOpen(true);
    } catch (error) {
      console.error("Error fetching withdrawal details:", error);
      toast.error("Failed to load withdrawal details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestModalApprove = () => {
    if (!selectedWithdrawalRequest) return;

    // Transform data for approval modal
    const approveData: WithdrawalData = {
      consultant: selectedWithdrawalRequest.consultant.name,
      amountRequested: selectedWithdrawalRequest.amounts.withdrawalAmount,
      bankAccount: `${selectedWithdrawalRequest.bankAccount.bankName} - ${selectedWithdrawalRequest.bankAccount.accountNumber}`,
      netPayable: selectedWithdrawalRequest.amounts.netPayable,
      platformFeeAndTDS: `Platform Fee: ₹${selectedWithdrawalRequest.amounts.platformFee.toLocaleString()} | TDS: ₹${selectedWithdrawalRequest.amounts.tds.toLocaleString()}`
    };

    setSelectedApproveData(approveData);
    setIsRequestModalOpen(false);
    setIsApproveModalOpen(true);
  };

  const confirmApproval = async (notes: string) => {
    if (selectedWithdrawalRequest) {
      try {
        const amount = selectedWithdrawalRequest.amounts.withdrawalAmount;
        await handleApproveWithdrawal(selectedWithdrawalRequest.requestId);
        setIsApproveModalOpen(false);

        setApprovedAmount(amount);
        setIsApprovedSuccessModalOpen(true);

        setSelectedWithdrawalRequest(null);
        setSelectedApproveData(null);
      } catch (error) {
        // Error already handled in handleApproveWithdrawal
      }
    }
  };

  const handleExport = () => {
    const columns: ExportColumn<Withdrawal>[] = [
      { header: "Request ID", key: "id" },
      { header: "Consultant", key: "consultant" },
      { header: "Amount (₹)", key: "requestedAmount" },
      { header: "Available Balance (₹)", key: "availableBalance" },
      { header: "Bank Details", key: "bankDetails" },
      { header: "Status", key: "status", transform: (val) => val.toUpperCase() },
      { header: "Requested Date", key: "requestedDate" },
    ];

    exportToCSV(filteredWithdrawals, columns, "withdrawal_requests");
    toast.success("CSV export started");
  };

  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter(w => {
      const matchesSearch =
        w.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.consultant.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || w.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [withdrawals, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredWithdrawals.length / ITEMS_PER_PAGE);

  const paginatedWithdrawals = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredWithdrawals.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredWithdrawals, currentPage]);

  const summary = useMemo(() => {
    return withdrawals.reduce((acc, w) => {
      acc[w.status]++;
      if (w.status === 'requested' || w.status === 'approved') {
        acc.pendingAmount += w.requestedAmount;
      }
      return acc;
    }, { requested: 0, approved: 0, paid: 0, failed: 0, pendingAmount: 0 });
  }, [withdrawals]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Withdrawal Management</h1>
          <p className="page-description">Process consultant payout requests</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Badge className="bg-warning/15 text-warning border-0 px-3 py-1.5">
            ₹{summary.pendingAmount.toLocaleString()} Pending
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="border-0 shadow-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Requested</p>
            <p className="text-2xl font-bold text-warning">{summary.requested}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold text-info">{summary.approved}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Paid</p>
            <p className="text-2xl font-bold text-success">{summary.paid}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Failed</p>
            <p className="text-2xl font-bold text-destructive">{summary.failed}</p>
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
                placeholder="Search by consultant or request ID..."
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
                <SelectItem value="requested">Requested</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={fetchWithdrawals}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawals Table */}
      <Card className="border-0 shadow-card">
        <CardHeader className="pb-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ArrowDownToLine className="h-5 w-5 text-accent" />
            Withdrawal Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  {/* <th>Request ID</th> */}
                  <th>Consultant</th>
                  <th>Amount</th>
                  <th>Available Balance</th>
                  <th>Bank Details</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">Loading withdrawals...</p>
                    </td>
                  </tr>
                ) : paginatedWithdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground">
                      No withdrawal requests found
                    </td>
                  </tr>
                ) : paginatedWithdrawals.map((request) => {
                  const config = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.requested;
                  const StatusIcon = config.icon;
                  return (
                    <tr key={request.id}>
                      {/* <td className="font-mono text-xs">{request.id}</td> */}
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {request.consultant.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{request.consultant}</span>
                        </div>
                      </td>
                      <td className="font-semibold">₹{request.requestedAmount.toLocaleString()}</td>
                      <td className="text-muted-foreground">₹{request.availableBalance.toLocaleString()}</td>
                      <td className="font-mono text-sm">{request.bankDetails}</td>
                      <td>
                        <span className={cn("status-badge", config.class)}>
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </span>
                      </td>
                      <td className="text-muted-foreground text-sm">{request.requestedDate}</td>
                      <td className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => handleViewDetails(request)}
                            >
                              <Eye className="h-4 w-4" /> View Details
                            </DropdownMenuItem>

                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && filteredWithdrawals.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-muted/50">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{Math.min(filteredWithdrawals.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)}</span> to{" "}
                <span className="font-medium">{Math.min(filteredWithdrawals.length, currentPage * ITEMS_PER_PAGE)}</span> of{" "}
                <span className="font-medium">{filteredWithdrawals.length}</span> requests
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
                      // Show current page, first, last, and neighbors
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

      {/* Request Details Modal */}
      {selectedWithdrawalRequest && (
        <WithdrawalRequestModal
          isOpen={isRequestModalOpen}
          onClose={() => {
            setIsRequestModalOpen(false);
            setSelectedWithdrawalRequest(null);
          }}
          onApprove={handleRequestModalApprove}
          onReject={async () => {
            if (selectedWithdrawalRequest) {
              try {
                await handleRejectWithdrawal(selectedWithdrawalRequest.requestId);
                setIsRequestModalOpen(false);
                setSelectedWithdrawalRequest(null);
              } catch (error) {
                // Error already handled in handleRejectWithdrawal
              }
            }
          }}
          data={selectedWithdrawalRequest}
        />
      )}

      {/* Approve Confirmation Modal */}
      {selectedApproveData && (
        <ApproveWithdrawalModal
          isOpen={isApproveModalOpen}
          onClose={() => {
            setIsApproveModalOpen(false);
            setSelectedApproveData(null);
            setSelectedWithdrawalRequest(null);
          }}
          onApprove={confirmApproval}
          withdrawalData={selectedApproveData}
        />
      )}

      {/* Success Modal */}
      <WithdrawalApprovedModal
        isOpen={isApprovedSuccessModalOpen}
        onClose={() => setIsApprovedSuccessModalOpen(false)}
        amount={approvedAmount}
      />
    </div>
  );
}
