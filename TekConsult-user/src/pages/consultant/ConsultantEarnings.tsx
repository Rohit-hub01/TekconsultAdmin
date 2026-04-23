import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  CreditCard,
  DollarSign,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import WithdrawFundsModal from '@/components/consultant/WithdrawFundsModal';
import WithdrawFlowModal from '@/components/consultant/withdrawal-flow/WithdrawFlowModal';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { paymentAPI, WalletTransaction, Withdrawal } from '@/services/api';
import { Loader2 } from 'lucide-react';

const withdrawalHistory = [
  { id: 1, amount: 2300, type: 'Bank Transfer', date: '2026-02-01', status: 'completed' },
  { id: 2, amount: 1500, type: 'Bank Transfer', date: '2026-01-25', status: 'completed' },
  { id: 3, amount: 850, type: 'UPI', date: '2026-01-20', status: 'completed' },
  { id: 4, amount: 1200, type: 'Bank Transfer', date: '2026-01-15', status: 'completed' },
];

const transactionHistory = [
  { id: 1, name: 'Anjali M.', type: 'Session Payment', amount: 250, date: '2026-02-03' },
  { id: 2, name: 'Rahul P.', type: 'Session Payment', amount: 300, date: '2026-02-03' },
  { id: 3, name: 'Priya S.', type: 'Session Payment', amount: 280, date: '2026-02-04' },
  { id: 4, name: 'Arjun K.', type: 'Session Payment', amount: 200, date: '2026-02-04' },
];

const ConsultantEarnings = () => {
  const { consultant } = useAuth();
  const navigate = useNavigate();
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [apiTotalEarnings, setApiTotalEarnings] = useState<number>(0);
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [bankDetails, setBankDetails] = useState<{ bankName: string; accountNumber: string } | null>(null);

  // Pagination states
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);

  const [withdrawalPage, setWithdrawalPage] = useState(1);
  const [withdrawalTotalPages, setWithdrawalTotalPages] = useState(1);
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);
  const [timeFilter, setTimeFilter] = useState('30days');

  // Generate years from joining date to current year
  const getYearOptions = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    // Use joiningDate if available; otherwise just show last few years
    const joinDateStr = consultant?.joiningDate;
    const startYear = joinDateStr ? new Date(joinDateStr).getFullYear() : currentYear - 2;

    for (let year = currentYear; year >= startYear; year--) {
      years.push(year);
    }
    return years;
  };

  const handleTimeFilterChange = (value: string) => {
    setTimeFilter(value);
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        let startDate: string | undefined;
        let endDate: string | undefined;

        if (timeFilter !== 'all') {
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

        const skip = (currentPage - 1) * ITEMS_PER_PAGE;
        const walletData = await paymentAPI.getWalletTransactions(skip, ITEMS_PER_PAGE, startDate, endDate);
        setTransactions(walletData.transactions || []);
        setApiTotalEarnings(walletData.totalEarnings || 0);
        setTotalPages(walletData.totalPages || 1);
        setTotalTransactions(walletData.totalCount || 0);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactions();
  }, [currentPage, timeFilter]);

  useEffect(() => {
    const fetchWithdrawals = async () => {
      try {
        const skip = (withdrawalPage - 1) * ITEMS_PER_PAGE;
        const withdrawalsData = await paymentAPI.getWithdrawalHistory(skip, ITEMS_PER_PAGE);
        setWithdrawals(withdrawalsData.withdrawals || []);
        setWithdrawalTotalPages(withdrawalsData.totalPages || 1);
        setTotalWithdrawals(withdrawalsData.totalCount || 0);
      } catch (error) {
        console.error('Error fetching withdrawals:', error);
        setWithdrawals([]);
      }
    };
    fetchWithdrawals();
  }, [withdrawalPage]);

  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        const [balanceData, bankData] = await Promise.all([
          paymentAPI.getWalletBalance(),
          paymentAPI.getBankDetails()
        ]);
        setBalance(balanceData);
        setBankDetails(bankData);
      } catch (error) {
        console.error('Error fetching static earnings data:', error);
      }
    };
    fetchStaticData();
  }, []);

  // Use the total earnings from the API
  const totalEarnings = apiTotalEarnings;
  const availableBalance = balance;

  const handleWithdrawAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setIsWithdrawOpen(false);
    // Add a slight delay for better transition between modals
    setTimeout(() => {
      setIsFlowModalOpen(true);
    }, 300);
  };

  const finalizeWithdrawal = () => {
    // This would ideally refresh data or handle the local state update
    // But the success screen in the modal already shows the confirmation
    setBalance(prev => prev - selectedAmount);
  };

  const renderTransactionList = (txnList: WalletTransaction[]) => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    if (txnList.length === 0) {
      return (
        <div className="text-center py-12 bg-card border border-dashed rounded-xl text-muted-foreground">
          No transactions found
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 gap-3">
          {txnList.map((transaction) => (
            <div key={transaction.transactionId} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:shadow-sm transition-all">
              <div className="flex items-center gap-3 flex-1">
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold',
                  transaction.transactionType === 1 ? 'bg-green-500' : 'bg-red-500'
                )}>
                  {transaction.transactionType === 1 ? <DollarSign className="w-5 h-5" /> : <TrendingUp className="w-5 h-5 rotate-180" />}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{transaction.paymentMethod || (transaction.transactionType === 1 ? 'Earnings' : 'Withdrawal')}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(transaction.timestamp).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={cn('font-bold text-lg',
                  transaction.transactionType === 1 ? 'text-green-600' : 'text-red-600'
                )}>
                  {transaction.transactionType === 1 ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">ID: {transaction.transactionId.slice(0, 8)}...</p>
              </div>
            </div>
          ))}
        </div>

        {/* Transaction Pagination */}
        {!isLoading && transactions.length > 0 && totalPages > 1 && (
          <div className="flex justify-end items-center gap-2 py-8 bg-background">
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
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-6 pt-6 pb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Earnings & Withdrawals</h1>
      </div>

      {/* Main Content Grid */}
      <div className="px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Earnings Overview - Left Column */}
          <div className="lg:col-span-1">
            <div>
              <h2 className="font-semibold text-lg text-foreground mb-4">Earnings Overview</h2>

              {/* Total Earnings Card */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white mb-4">
                <p className="text-sm font-medium text-green-100 mb-2">Total Earnings</p>
                <h3 className="text-4xl font-bold mb-4">₹{totalEarnings.toLocaleString()}</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-green-100 mb-1">Status</p>
                    <p className="text-xl font-bold">Active</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-100 mb-1">Currency</p>
                    <p className="text-xl font-bold">INR</p>
                  </div>
                </div>
              </div>

              {/* Available Balance */}
              <div className="bg-card border border-border rounded-2xl p-6 mb-4">
                <p className="text-sm text-muted-foreground mb-2">Available Balance</p>
                <h3 className="text-3xl font-bold text-foreground">₹{availableBalance.toLocaleString()}</h3>
              </div>

              {/* Withdraw Button */}
              <Button
                onClick={() => setIsWithdrawOpen(true)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-base font-semibold h-12 rounded-xl shadow-lg shadow-purple-600/20 active:scale-[0.98] transition-all"
              >
                <Banknote className="w-5 h-5 mr-2" />
                Withdraw Funds
              </Button>

              <WithdrawFundsModal
                isOpen={isWithdrawOpen}
                onClose={() => setIsWithdrawOpen(false)}
                onContinue={handleWithdrawAmountSelect}
                availableBalance={availableBalance}
              />

              <WithdrawFlowModal
                isOpen={isFlowModalOpen}
                amount={selectedAmount}
                onClose={() => setIsFlowModalOpen(false)}
                onSuccess={finalizeWithdrawal}
              />
            </div>
          </div>

          {/* Transaction History - Mobile Only (Below actions, before Right Column) */}
          <div className="lg:hidden mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg text-foreground">Transactions</h2>
              <div className="w-32">
                <Select value={timeFilter} onValueChange={handleTimeFilterChange}>
                  <SelectTrigger className="rounded-full border-border/60 bg-muted/40 h-8 flex items-center gap-2 text-xs">
                    <Filter className="w-3 h-3 text-muted-foreground" />
                    <SelectValue placeholder="Range" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/60">
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="30days">30 Days</SelectItem>
                    <SelectItem value="3months">3 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-3">
              {renderTransactionList(transactions)}
            </div>
          </div>

          {/* Right Column - Withdrawal History & Bank Account */}
          <div className="lg:col-span-1">
            <h2 className="font-semibold text-lg text-foreground mb-4">Withdrawal History</h2>

            <div className="space-y-3 mb-6">
              {withdrawals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-xl">
                  No withdrawals found
                </div>
              ) : (
                <>
                  {withdrawals.map((withdrawal) => (
                    <div key={withdrawal.requestId} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:shadow-sm transition-all">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-5 h-5 text-red-600 rotate-180" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-foreground">{withdrawal.bankDetails || 'Withdrawal'}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(withdrawal.requestedAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-sm text-foreground">₹{withdrawal.amount.toLocaleString()}</p>
                        <span className={cn(
                          "inline-block text-[10px] px-2 py-0.5 rounded font-medium mt-1",
                          withdrawal.status === 0 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                        )}>
                          {withdrawal.status === 0 ? 'Pending' : 'Completed'}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Withdrawal Pagination */}
                  {withdrawalTotalPages > 1 && (
                    <div className="flex justify-end items-center gap-2 mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setWithdrawalPage(prev => Math.max(prev - 1, 1))}
                        disabled={withdrawalPage === 1}
                        className="text-muted-foreground hover:text-primary h-8 px-2 text-xs"
                      >
                        <ChevronLeft className="w-3 h-3 mr-1" />
                        Prev
                      </Button>
                      <span className="text-xs font-medium text-foreground">
                        {withdrawalPage} / {withdrawalTotalPages}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setWithdrawalPage(prev => Math.min(prev + 1, withdrawalTotalPages))}
                        disabled={withdrawalPage === withdrawalTotalPages}
                        className="text-muted-foreground hover:text-primary h-8 px-2 text-xs"
                      >
                        Next
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bank Account Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Bank Account</p>
                  <p className="text-xs text-muted-foreground">
                    {bankDetails
                      ? `${bankDetails.bankName} •••• ${bankDetails.accountNumber.slice(-4)}`
                      : 'No bank account added'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/consultant/bank-details')}
                className="w-full mt-3 h-9 text-sm text-primary border-blue-300 hover:bg-blue-100"
              >
                Update Bank Details
              </Button>
            </div>
          </div>

          {/* Transaction History - Full Width Bottom */}
          {/* <div className="lg:col-span-1">
            <h2 className="font-semibold text-lg text-foreground mb-4">Recent Sessions</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {transactionHistory.map((transaction, index) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold', 
                      ['bg-purple-500', 'bg-pink-500', 'bg-blue-500', 'bg-orange-500'][index % 4]
                    )}>
                      {transaction.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground">{transaction.name}</p>
                      <p className="text-xs text-muted-foreground">{transaction.type}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-sm text-green-600">+₹{transaction.amount}</p>
                    <p className="text-xs text-muted-foreground">{transaction.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div> */}
        </div>
      </div>

      <div className="hidden lg:block px-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg text-foreground">Transaction History</h2>
          <div className="w-48">
            <Select value={timeFilter} onValueChange={handleTimeFilterChange}>
              <SelectTrigger className="rounded-full border-border/60 bg-muted/40 h-9 flex items-center gap-2">
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

        <div className="space-y-3 mt-4">
          {renderTransactionList(transactions)}
        </div>
      </div>
    </div>
  );
};

export default ConsultantEarnings;
