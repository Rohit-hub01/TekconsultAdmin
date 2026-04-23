import { useState, useEffect } from 'react';
import { Plus, ArrowUpRight, ArrowDownLeft, CreditCard, Smartphone, ArrowLeft, Wallet, Landmark, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { paymentAPI, WalletTransaction } from '@/services/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Transaction } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const quickAmounts = [100, 500, 1000, 2000, 5000];

const TransactionItem = ({ txn }: { txn: Transaction }) => (
  <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
    <div
      className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center',
        txn.type === 'credit' ? 'bg-success/10' : 'bg-destructive/10'
      )}
    >
      {txn.type === 'credit' ? (
        <ArrowDownLeft className="w-5 h-5 text-success" />
      ) : (
        <ArrowUpRight className="w-5 h-5 text-destructive" />
      )}
    </div>
    <div className="flex-1">
      <p className="font-medium text-foreground">{txn.description}</p>
      <p className="text-sm text-muted-foreground">
        {txn.date.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </p>
    </div>
    <div className="text-right">
      <p
        className={cn(
          'font-semibold',
          txn.type === 'credit' ? 'text-success' : 'text-destructive'
        )}
      >
        {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
      </p>
    </div>
  </div>
);

const UserWallet = () => {
  const { user, consultant, updateWalletBalance } = useAuth();
  const [view, setView] = useState<'wallet' | 'add-money'>('wallet');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [timeFilter, setTimeFilter] = useState('30days');

  // Pagination states
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);

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

  const handleTimeFilterChange = (value: string) => {
    setTimeFilter(value);
  };

  // Fetch transactions and balance
  useEffect(() => {
    const fetchData = async () => {
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
        const [walletData, balanceData] = await Promise.all([
          paymentAPI.getWalletTransactions(skip, ITEMS_PER_PAGE, startDate, endDate),
          paymentAPI.getWalletBalance()
        ]);

        // Map API data to UI format
        const txnsList = walletData.transactions || [];
        const formattedTxns = txnsList.map((txn: WalletTransaction) => ({
          id: txn.transactionId,
          type: txn.transactionType === 1 ? 'credit' : 'debit',
          amount: txn.amount, // API returns absolute amount
          description: txn.paymentMethod || 'Wallet Transaction',
          date: new Date(txn.timestamp),
          status: txn.status === 1 ? 'success' : 'pending'
        }));


        setTransactions(formattedTxns);
        setBalance(balanceData);
        setTotalPages(walletData.totalPages || 1);
        setTotalTransactions(walletData.totalCount || 0);
      } catch (error) {
        console.error('Failed to fetch wallet data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [view, timeFilter, currentPage]); // Refetch when switching back to wallet view, time filter changes, or page changes

  const handleAddMoney = async () => {
    const value = parseInt(amount);
    if (!value || value < 10) {
      toast({
        title: 'Invalid Amount',
        description: 'Minimum recharge amount is ₹10',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Call API to create Stripe checkout session
      const checkoutUrl = await paymentAPI.addMoney(value);

      // Redirect to Stripe checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Payment failed:', error);
      toast({
        title: 'Payment Failed',
        description: 'Unable to process payment. Please try again.',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  const recentTransactions = transactions.slice(0, 3);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (view === 'add-money') {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 bg-background sticky top-0 z-10">
          <Button variant="ghost" size="icon" onClick={() => setView('wallet')} className="-ml-2">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-semibold">Add Money</h1>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Current Balance Card */}
          <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-sm">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <span className="text-muted-foreground font-medium">Current Balance</span>
            </div>
            <p className="text-3xl font-bold text-primary ml-12 -mt-2">₹{balance.toLocaleString()}</p>
          </div>

          {/* Enter Amount */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Enter Amount</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-medium text-muted-foreground">
                ₹
              </span>
              <Input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 h-14 text-lg font-semibold bg-muted/30 border-muted-foreground/20 rounded-xl"
              />
            </div>
          </div>

          {/* Quick Select */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">Quick Select</Label>
            <div className="flex flex-wrap gap-3">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt.toString())}
                  className={cn(
                    "px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                    amount === amt.toString() ? "border-primary bg-primary/5 text-primary" : "border-border bg-background hover:bg-muted"
                  )}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
              <div className={cn("flex items-center space-x-3 border rounded-xl p-4 cursor-pointer transition-all", paymentMethod === 'upi' ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border")}>
                <RadioGroupItem value="upi" id="upi" />
                <Label htmlFor="upi" className="flex-1 flex items-center gap-3 cursor-pointer">
                  <Smartphone className="w-5 h-5 text-primary" />
                  <span>UPI / QR Code</span>
                </Label>
              </div>

              <div className={cn("flex items-center space-x-3 border rounded-xl p-4 cursor-pointer transition-all", paymentMethod === 'card' ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border")}>
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex-1 flex items-center gap-3 cursor-pointer">
                  <CreditCard className="w-5 h-5 text-blue-500" />
                  <span>Credit / Debit Card</span>
                </Label>
              </div>

              <div className={cn("flex items-center space-x-3 border rounded-xl p-4 cursor-pointer transition-all", paymentMethod === 'netbanking' ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border")}>
                <RadioGroupItem value="netbanking" id="netbanking" />
                <Label htmlFor="netbanking" className="flex-1 flex items-center gap-3 cursor-pointer">
                  <Landmark className="w-5 h-5 text-green-500" />
                  <span>Net Banking</span>
                </Label>
              </div>
            </RadioGroup>
          </div>




          {/* Bottom Button */}
          <div className="pt-4 pb-4">
            <Button
              onClick={handleAddMoney}
              disabled={!amount || parseInt(amount) < 10 || isProcessing}
              className="w-full h-14 text-lg font-semibold rounded-xl gradient-primary shadow-purple"
            >
              {isProcessing ? 'Processing...' : `Add ₹${amount || '0'} to Wallet`}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Uses 'wallet' view
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-primary px-6 pt-6 pb-10 rounded-[1.5rem] mt-2">
        <h1 className="font-display text-2xl font-bold text-primary-foreground mb-4">
          My Wallet
        </h1>

        {/* Balance Card */}
        <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 border border-primary-foreground/20">
          <p className="text-primary-foreground/80 text-sm">Available Balance</p>
          <p className="text-primary-foreground text-4xl font-bold mt-1">
            ₹{balance.toLocaleString()}
          </p>

          <Button
            onClick={() => setView('add-money')}
            className="mt-4 bg-primary-foreground text-primary hover:bg-primary-foreground/90 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Money
          </Button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="px-6 py-6">
        <h2 className="font-display text-lg font-semibold mb-4">Transaction History</h2>

        {/* Recent 3 Transactions */}
        {!isLoading && recentTransactions.length > 0 && (
          <div className="mb-8 space-y-3">
            {recentTransactions.map((txn) => (
              <TransactionItem key={txn.id} txn={txn} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-4 pt-6 border-t border-border/40">
          <p className="text-sm font-medium text-muted-foreground">Showing history for</p>
          <div className="w-44">
            <Select value={timeFilter} onValueChange={handleTimeFilterChange}>
              <SelectTrigger className="rounded-xl border-border/60 bg-muted/40 h-10 flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
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

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6 p-1 bg-muted/50 rounded-xl">
            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">All</TabsTrigger>
            <TabsTrigger value="credit" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Money Added</TabsTrigger>
            <TabsTrigger value="debit" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Spent</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-0">
            {transactions.map((txn) => (
              <TransactionItem key={txn.id} txn={txn} />
            ))}
            {transactions.length === 0 && <p className="text-center text-muted-foreground py-8">No transactions found</p>}
          </TabsContent>

          <TabsContent value="credit" className="space-y-3 mt-0">
            {transactions.filter(t => t.type === 'credit').map((txn) => (
              <TransactionItem key={txn.id} txn={txn} />
            ))}
            {transactions.filter(t => t.type === 'credit').length === 0 && <p className="text-center text-muted-foreground py-8">No credit transactions found</p>}
          </TabsContent>

          <TabsContent value="debit" className="space-y-3 mt-0">
            {transactions.filter(t => t.type === 'debit').map((txn) => (
              <TransactionItem key={txn.id} txn={txn} />
            ))}
            {transactions.filter(t => t.type === 'debit').length === 0 && <p className="text-center text-muted-foreground py-8">No debit transactions found</p>}
          </TabsContent>
        </Tabs>

        {/* Pagination Controls */}
        {!isLoading && transactions.length > 0 && totalPages > 1 && (
          <div className="flex justify-end items-center gap-2 py-8 bg-background">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
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
              onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages || isLoading}
              className="text-muted-foreground hover:text-primary transition-colors gap-1 h-9 px-3"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserWallet;
