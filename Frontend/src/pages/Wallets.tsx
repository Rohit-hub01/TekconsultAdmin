import { useState, useEffect, useCallback, useMemo } from "react";
import { Wallet, Search, Filter, ArrowUpRight, ArrowDownLeft, RefreshCcw, RefreshCw, AlertCircle, Download, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { api, Transaction } from "@/lib/api";
import { toast } from "sonner";
import { exportToCSV, ExportColumn } from "@/lib/export";

const typeConfig = {
  credit: { label: "Credit", icon: ArrowDownLeft, color: "text-success" },
  debit: { label: "Debit", icon: ArrowUpRight, color: "text-foreground" },
  refund: { label: "Refund", icon: RefreshCcw, color: "text-info" },
};

const ITEMS_PER_PAGE = 10;

export default function Wallets() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userPage, setUserPage] = useState(1);
  const [consultantPage, setConsultantPage] = useState(1);

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.getTransactions({
        _sort: 'date',
        _order: 'desc'
      });
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    setUserPage(1);
    setConsultantPage(1);
  }, [searchQuery, typeFilter]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      const matchesSearch =
        txn.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (txn.user?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (txn.consultant?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      const matchesType = typeFilter === "all" || txn.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [transactions, searchQuery, typeFilter]);

  const userTransactions = useMemo(() =>
    filteredTransactions.filter(txn => !!txn.user),
    [filteredTransactions]);

  const consultantEarnings = useMemo(() =>
    filteredTransactions.filter(txn => !!txn.consultant),
    [filteredTransactions]);

  const paginatedUserTransactions = useMemo(() => {
    const startIndex = (userPage - 1) * ITEMS_PER_PAGE;
    return userTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [userTransactions, userPage]);

  const paginatedConsultantEarnings = useMemo(() => {
    const startIndex = (consultantPage - 1) * ITEMS_PER_PAGE;
    return consultantEarnings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [consultantEarnings, consultantPage]);

  const userTotalPages = Math.ceil(userTransactions.length / ITEMS_PER_PAGE);
  const consultantTotalPages = Math.ceil(consultantEarnings.length / ITEMS_PER_PAGE);

  const summary = useMemo(() => {
    return transactions.reduce((acc, txn) => {
      if (txn.status === 'failed') acc.failed++;
      else if (txn.type === 'credit' && txn.user) acc.recharges += txn.amount;
      else if (txn.type === 'debit') acc.deductions += txn.amount;
      else if (txn.type === 'refund') acc.refunds += txn.amount;
      return acc;
    }, { recharges: 0, deductions: 0, refunds: 0, failed: 0 });
  }, [transactions]);

  const formatCurrency = (amt: number) => {
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)}L`;
    return `₹${amt.toLocaleString()}`;
  };

  const [activeTab, setActiveTab] = useState("users");

  const handleExport = () => {
    if (activeTab === "users") {
      const columns: ExportColumn<Transaction>[] = [
        { header: "Transaction ID", key: "id" },
        { header: "User", key: "user" },
        { header: "Type", key: "type", transform: (val) => val.toUpperCase() },
        { header: "Amount (₹)", key: "amount" },
        { header: "Method", key: "method" },
        { header: "Status", key: "status", transform: (val) => val.toUpperCase() },
        { header: "Date", key: "date" },
      ];
      exportToCSV(userTransactions, columns, "user_transactions");
    } else {
      const columns: ExportColumn<Transaction>[] = [
        { header: "Earning ID", key: "id" },
        { header: "Consultant", key: "consultant" },
        { header: "Session ID", key: "session" },
        { header: "Gross (₹)", key: "gross" },
        { header: "Commission (₹)", key: "commission" },
        { header: "Net Earning (₹)", key: "net" },
        { header: "Status", key: "status", transform: (val) => val.toUpperCase() },
        { header: "Date", key: "date" },
      ];
      exportToCSV(consultantEarnings, columns, "consultant_earnings");
    }
    toast.success(`${activeTab === 'users' ? 'User transactions' : 'Consultant earnings'} export started`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Wallet Management</h1>
          <p className="page-description">Monitor user wallets and consultant earnings</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExport}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2.5">
                <ArrowDownLeft className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(summary.recharges)}</p>
                <p className="text-sm text-muted-foreground">Total Recharges</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <ArrowUpRight className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(summary.deductions)}</p>
                <p className="text-sm text-muted-foreground">Total Deductions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-info/10 p-2.5">
                <RefreshCcw className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">₹{summary.refunds.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Refunds</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-destructive/10 p-2.5">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.failed}</p>
                <p className="text-sm text-muted-foreground">Failed Transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="users">User Wallets</TabsTrigger>
          <TabsTrigger value="consultants">Consultant Earnings</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Filters */}
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by ID or user name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-muted/50 border-0"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[160px] bg-muted/50 border-0">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="credit">Credits</SelectItem>
                    <SelectItem value="debit">Debits</SelectItem>
                    <SelectItem value="refund">Refunds</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={fetchTransactions}
                  disabled={isLoading}
                >
                  <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card className="border-0 shadow-card">
            <CardHeader className="pb-0">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Wallet className="h-5 w-5 text-accent" />
                User Transactions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-4">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>User</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mt-2">Loading transactions...</p>
                        </td>
                      </tr>
                    ) : paginatedUserTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-muted-foreground">
                          No transactions found
                        </td>
                      </tr>
                    ) : paginatedUserTransactions.map((txn) => {
                      const TypeIcon = typeConfig[txn.type as keyof typeof typeConfig].icon;
                      return (
                        <tr key={txn.id}>
                          <td className="font-mono text-xs">{txn.id}</td>
                          <td className="font-medium">{txn.user}</td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <TypeIcon className={cn("h-4 w-4", typeConfig[txn.type as keyof typeof typeConfig].color)} />
                              <span>{typeConfig[txn.type as keyof typeof typeConfig].label}</span>
                            </div>
                          </td>
                          <td className={cn("font-semibold", txn.type === "credit" || txn.type === "refund" ? "text-success" : "")}>
                            {txn.type === "debit" ? "-" : "+"}₹{txn.amount}
                          </td>
                          <td>{txn.method}</td>
                          <td>
                            <span className={cn(
                              "status-badge",
                              txn.status === "success" ? "status-approved" : "status-rejected"
                            )}>
                              {txn.status === "success" ? "Success" : "Failed"}
                            </span>
                          </td>
                          <td className="text-muted-foreground text-sm">{txn.date}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination for User Transactions */}
              {!isLoading && userTransactions.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-muted/50">
                  <p className="text-sm text-muted-foreground">
                    Showing <span className="font-medium">{Math.min(userTransactions.length, (userPage - 1) * ITEMS_PER_PAGE + 1)}</span> to{" "}
                    <span className="font-medium">{Math.min(userTransactions.length, userPage * ITEMS_PER_PAGE)}</span> of{" "}
                    <span className="font-medium">{userTransactions.length}</span> transactions
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setUserPage(1)}
                      disabled={userPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setUserPage(prev => Math.max(1, prev - 1))}
                      disabled={userPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-1 mx-2">
                      {Array.from({ length: userTotalPages }, (_, i) => i + 1)
                        .filter(page => {
                          return (
                            page === 1 ||
                            page === userTotalPages ||
                            Math.abs(page - userPage) <= 1
                          );
                        })
                        .map((page, index, array) => {
                          const showEllipsis = index > 0 && page - array[index - 1] > 1;
                          return (
                            <div key={page} className="flex items-center gap-1">
                              {showEllipsis && <span className="px-2 text-muted-foreground">...</span>}
                              <Button
                                variant={userPage === page ? "default" : "outline"}
                                size="sm"
                                className={cn(
                                  "h-8 w-8 p-0",
                                  userPage === page && "bg-primary text-primary-foreground"
                                )}
                                onClick={() => setUserPage(page)}
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
                      onClick={() => setUserPage(prev => Math.min(userTotalPages, prev + 1))}
                      disabled={userPage === userTotalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setUserPage(userTotalPages)}
                      disabled={userPage === userTotalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consultants" className="space-y-4">
          {/* Consultant Earnings Table */}
          <Card className="border-0 shadow-card">
            <CardHeader className="pb-0">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Wallet className="h-5 w-5 text-accent" />
                Consultant Earnings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-4">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Earning ID</th>
                      <th>Consultant</th>
                      <th>Session</th>
                      <th>Gross</th>
                      <th>Commission (20%)</th>
                      <th>Net Earning</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mt-2">Loading earnings...</p>
                        </td>
                      </tr>
                    ) : paginatedConsultantEarnings.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-muted-foreground">
                          No earnings found
                        </td>
                      </tr>
                    ) : paginatedConsultantEarnings.map((earning) => (
                      <tr key={earning.id}>
                        <td className="font-mono text-xs">{earning.id}</td>
                        <td className="font-medium">{earning.consultant}</td>
                        <td className="font-mono text-xs text-muted-foreground">{earning.session}</td>
                        <td>₹{earning.gross?.toFixed(2) || '0.00'}</td>
                        <td className="text-muted-foreground">₹{earning.commission?.toFixed(2) || '0.00'}</td>
                        <td className="font-semibold text-success">₹{earning.net?.toFixed(2) || '0.00'}</td>
                        <td>
                          <span className={cn(
                            "status-badge",
                            earning.status === "credited" ? "status-approved" : "status-pending"
                          )}>
                            {earning.status === "credited" ? "Credited" : "Pending"}
                          </span>
                        </td>
                        <td className="text-muted-foreground text-sm">{earning.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination for Consultant Earnings */}
              {!isLoading && consultantEarnings.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-muted/50">
                  <p className="text-sm text-muted-foreground">
                    Showing <span className="font-medium">{Math.min(consultantEarnings.length, (consultantPage - 1) * ITEMS_PER_PAGE + 1)}</span> to{" "}
                    <span className="font-medium">{Math.min(consultantEarnings.length, consultantPage * ITEMS_PER_PAGE)}</span> of{" "}
                    <span className="font-medium">{consultantEarnings.length}</span> earnings
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setConsultantPage(1)}
                      disabled={consultantPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setConsultantPage(prev => Math.max(1, prev - 1))}
                      disabled={consultantPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-1 mx-2">
                      {Array.from({ length: consultantTotalPages }, (_, i) => i + 1)
                        .filter(page => {
                          return (
                            page === 1 ||
                            page === consultantTotalPages ||
                            Math.abs(page - consultantPage) <= 1
                          );
                        })
                        .map((page, index, array) => {
                          const showEllipsis = index > 0 && page - array[index - 1] > 1;
                          return (
                            <div key={page} className="flex items-center gap-1">
                              {showEllipsis && <span className="px-2 text-muted-foreground">...</span>}
                              <Button
                                variant={consultantPage === page ? "default" : "outline"}
                                size="sm"
                                className={cn(
                                  "h-8 w-8 p-0",
                                  consultantPage === page && "bg-primary text-primary-foreground"
                                )}
                                onClick={() => setConsultantPage(page)}
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
                      onClick={() => setConsultantPage(prev => Math.min(consultantTotalPages, prev + 1))}
                      disabled={consultantPage === consultantTotalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setConsultantPage(consultantTotalPages)}
                      disabled={consultantPage === consultantTotalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
