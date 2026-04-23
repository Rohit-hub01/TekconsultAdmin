import { useState, useEffect, useCallback } from "react";
import { Search, Filter, UserCheck, Clock, XCircle, CheckCircle, MoreHorizontal, Eye, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useNavigate } from "react-router-dom";
import { api, getConsultantsFromBackend, type Consultant, API_BASE_URL } from "@/lib/api";
import { ApproveConsultantModal } from "@/components/consultants/ApproveConsultantModal";
import { SuspendConsultantModal } from "@/components/consultants/SuspendConsultantModal";
import { ConsultantDetailsModal } from "@/components/consultants/ConsultantDetailsModal";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";


const statusConfig = {
  Pending: { label: "Pending", class: "status-pending", icon: Clock },
  Approved: { label: "Approved", class: "status-approved", icon: CheckCircle },
  Rejected: { label: "Rejected", class: "status-rejected", icon: XCircle },
  Suspended: { label: "Suspended", class: "status-rejected", icon: XCircle },
};

import { RejectConsultantModal } from "@/components/consultants/RejectConsultantModal";
import ReactivateConsultantModal from "@/components/consultants/ReactivateConsultantModal";

export default function Consultants() {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchConsultants = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch from backend API
      const data = await getConsultantsFromBackend(0, 100);

      // Apply client-side filtering
      let filtered = data;

      // Filter by status
      if (statusFilter !== "all") {
        filtered = filtered.filter(c => c.status === statusFilter);
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(c =>
          c.fullName.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.category.toLowerCase().includes(query)
        );
      }

      setConsultants(filtered);
    } catch (err) {
      setError("Failed to load consultants.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchConsultants();
  }, [fetchConsultants]);

  const handleUpdateStatus = async (id: string | number, status: Consultant['status']) => {
    // Optimistic Update
    const previousConsultants = [...consultants];
    setConsultants(prev => prev.map(c => c.id === id ? { ...c, status } : c));

    try {
      await api.updateConsultantStatus(id, status);
      toast({ title: "Status Updated", description: `Consultant marked as ${status}.` });
    } catch (err) {
      // Revert on error
      setConsultants(previousConsultants);
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    }
  };

  const handleRejectConsultant = async (reason: string) => {
    if (!selectedConsultant) return;

    setIsRejecting(true);
    try {
      await api.updateConsultantStatus(selectedConsultant.id, 'Rejected', reason);

      // Update local state
      setConsultants(prev => prev.map(c =>
        c.id === selectedConsultant.id ? { ...c, status: 'Rejected' as const } : c
      ));

      toast({
        title: "Consultant Rejected",
        description: `${selectedConsultant.fullName} has been rejected.`
      });
      setIsRejectModalOpen(false);
    } catch (error) {
      console.error("Rejection failed", error);
      toast({
        title: "Rejection Failed",
        description: "Could not reject the consultant. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const handleReactivateConsultant = async (data: { reason: string; checklist: any }) => {
    if (!selectedConsultant) return;

    setIsReactivating(true);
    try {
      await api.updateConsultantStatus(selectedConsultant.id, 'Approved', data.reason);

      // Update local state
      setConsultants(prev => prev.map(c =>
        c.id === selectedConsultant.id ? { ...c, status: 'Approved' as const } : c
      ));

      toast({
        title: "Consultant Reactivated",
        description: `${selectedConsultant.fullName} has been reactivated successfully.`
      });
      setIsReactivateModalOpen(false);
    } catch (error) {
      console.error("Reactivation failed", error);
      toast({
        title: "Reactivation Failed",
        description: "Could not reactivate the consultant. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsReactivating(false);
    }
  };

  const pendingCount = consultants.filter((c) => c.status === "Pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Consultant Management</h1>
          <p className="page-description">Review applications and manage consultant profiles</p>
        </div>
        {!isLoading && pendingCount > 0 && (
          <Badge className="bg-warning/15 text-warning border-0 px-3 py-1.5 animate-in fade-in slide-in-from-right-2">
            {pendingCount} Pending Applications
          </Badge>
        )}
      </div>

      <Card className="border-0 shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or category..."
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
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => fetchConsultants()}>
              <Filter className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-card min-h-[400px]">
        <CardHeader className="pb-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-accent" />
            All Consultants
            {!isLoading && (
              <Badge variant="secondary" className="ml-2">
                {consultants.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-4 relative">
          {isLoading && consultants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Loading consultants...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-destructive">
              <AlertCircle className="h-8 w-8 mb-4" />
              <p>{error}</p>
              <Button variant="outline" className="mt-4" onClick={() => fetchConsultants()}>Retry</Button>
            </div>
          ) : consultants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <UserCheck className="h-8 w-8 mb-4 opacity-20" />
              <p>No consultants found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto transition-opacity duration-300" style={{ opacity: isLoading ? 0.6 : 1 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Consultant</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Rates</th>
                    <th>Performance</th>
                    <th>Applied</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {consultants.map((consultant) => {
                    const config = statusConfig[consultant.status] || statusConfig.Pending;
                    const StatusIcon = config.icon;
                    return (
                      <tr key={consultant.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="h-10 w-10 border-2 border-muted">
                                <AvatarImage
                                  src={consultant.profilePhotoUrl ? (consultant.profilePhotoUrl.startsWith('http') ? consultant.profilePhotoUrl : `${API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL}${consultant.profilePhotoUrl.startsWith('/') ? consultant.profilePhotoUrl : '/' + consultant.profilePhotoUrl}`) : undefined}
                                  alt={consultant.fullName}
                                  className="object-cover"
                                />
                                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                  {consultant.initials}
                                </AvatarFallback>
                              </Avatar>
                              {consultant.isOnline && (
                                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-success" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{consultant.fullName}</p>
                              <p className="text-xs text-muted-foreground">{consultant.email}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge variant="secondary" className="font-normal">
                            {consultant.category}
                          </Badge>
                        </td>
                        <td>
                          <span className={cn("status-badge", config.class)}>
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </span>
                        </td>
                        <td>
                          <div className="text-sm">
                            <p>Chat: ₹{consultant.rates.chatPerMinute}/min</p>
                            <p className="text-muted-foreground">Call: ₹{consultant.rates.callPerMinute}/min</p>
                          </div>
                        </td>
                        <td>
                          <div className="text-sm">
                            <p className="font-medium flex items-center gap-1">
                              <span className="text-warning">⭐</span> {consultant.averageRating ? consultant.averageRating.toFixed(1) : 'New'}
                            </p>
                            {/* <p className="text-muted-foreground">{consultant.totalSessionsCompleted} sessions</p> */}
                          </div>
                        </td>
                        <td className="text-muted-foreground text-sm">{consultant.appliedDate}</td>
                        <td className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="gap-2 focus:bg-teal-50 focus:text-teal-600 cursor-pointer"
                                onClick={() => {
                                  setSelectedConsultant(consultant);
                                  setIsDetailsModalOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" /> View Profile
                              </DropdownMenuItem>
                              {consultant.status === "Pending" && (
                                <>
                                  <DropdownMenuItem
                                    className="gap-2 text-success"
                                    onClick={() => {
                                      setSelectedConsultant(consultant);
                                      setIsApproveModalOpen(true);
                                    }}
                                  >
                                    <CheckCircle className="h-4 w-4" /> Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="gap-2 text-destructive"
                                    onClick={() => {
                                      setSelectedConsultant(consultant);
                                      setIsRejectModalOpen(true);
                                    }}
                                  >
                                    <XCircle className="h-4 w-4" /> Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              {consultant.status === "Approved" && (
                                <DropdownMenuItem className="gap-2 text-destructive" onClick={() => {
                                  setSelectedConsultant(consultant);
                                  setIsSuspendModalOpen(true);
                                }}>
                                  <XCircle className="h-4 w-4" /> Suspend
                                </DropdownMenuItem>
                              )}
                              {consultant.status === "Suspended" && (
                                <DropdownMenuItem
                                  className="gap-2 text-success"
                                  onClick={() => {
                                    setSelectedConsultant(consultant);
                                    setIsReactivateModalOpen(true);
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4" /> Reactivate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <ApproveConsultantModal
        isOpen={isApproveModalOpen}
        onOpenChange={setIsApproveModalOpen}
        consultant={selectedConsultant ? {
          id: selectedConsultant.id,
          name: selectedConsultant.fullName,
          email: selectedConsultant.email,
          category: selectedConsultant.category,
          appliedDate: selectedConsultant.appliedDate
        } : null}
        onSuccess={() => {
          fetchConsultants();
        }}
      />
      <SuspendConsultantModal
        isOpen={isSuspendModalOpen}
        onOpenChange={setIsSuspendModalOpen}
        consultant={selectedConsultant ? {
          id: selectedConsultant.id,
          name: selectedConsultant.fullName,
          email: selectedConsultant.email,
          initials: selectedConsultant.initials,
          category: selectedConsultant.category,
          appliedDate: selectedConsultant.appliedDate
        } : null}
        onSuccess={() => {
          fetchConsultants();
        }}
      />
      <RejectConsultantModal
        open={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onReject={handleRejectConsultant}
        consultant={selectedConsultant ? {
          id: selectedConsultant.id,
          name: selectedConsultant.fullName,
          email: selectedConsultant.email,
          initials: selectedConsultant.initials,
          category: selectedConsultant.category
        } : null}
        isSubmitting={isRejecting}
      />
      <ReactivateConsultantModal
        open={isReactivateModalOpen}
        onClose={() => setIsReactivateModalOpen(false)}
        onReactivate={handleReactivateConsultant}
        consultant={selectedConsultant ? {
          id: selectedConsultant.id,
          name: selectedConsultant.fullName,
          email: selectedConsultant.email,
          initials: selectedConsultant.initials,
          category: selectedConsultant.category,
          suspensionDate: selectedConsultant.suspensionDuration // Assuming duration or we can fetch audit log if needed, simplifying for now
        } : null}
        isSubmitting={isReactivating}
      />
      <ConsultantDetailsModal
        isOpen={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        consultantId={selectedConsultant?.id || null}
      />
    </div>
  );
}
