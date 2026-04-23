import React, { useState } from "react";
import { X, Wallet, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface WithdrawFundsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onContinue: (amount: number) => void;
    availableBalance: number;
}

const quickAmounts = [1000, 2000, 5000];

const WithdrawFundsModal: React.FC<WithdrawFundsModalProps> = ({
    isOpen,
    onClose,
    onContinue,
    availableBalance,
}) => {
    const [amount, setAmount] = useState<number | "">("");

    if (!isOpen) return null;

    const isValid =
        typeof amount === 'number' && amount >= 100 && amount <= availableBalance;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-[1.5rem] bg-card p-6 shadow-2xl border border-border animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Wallet className="w-4.5 h-4.5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold font-display text-foreground leading-tight">Withdraw</h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Balance Card */}
                <div className="mt-5 rounded-xl bg-gradient-to-br from-primary to-purple-600 p-4 text-white shadow-lg shadow-primary/20">
                    <p className="text-[10px] font-medium opacity-80 uppercase tracking-wider">Available Balance</p>
                    <div className="mt-0.5 flex items-center justify-between">
                        <p className="text-xl font-bold">
                            ₹{availableBalance.toLocaleString()}
                        </p>
                        <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                            <span >
                                <Wallet className="w-5 h-5" />
                            </span>
                        </div>
                    </div>
                </div>

                {/* Amount Input */}
                <div className="mt-6">
                    <label className="text-xs font-bold text-foreground ml-1">
                        Amount to Withdraw
                    </label>
                    <div className="mt-1.5 flex items-center rounded-xl bg-muted/50 border border-border/60 px-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                        <span className="text-lg font-bold text-muted-foreground">₹</span>
                        <input
                            type="number"
                            min={0}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full bg-transparent px-2 py-3 text-base font-bold outline-none placeholder:text-muted-foreground/50"
                            placeholder="0"
                        />
                    </div>
                </div>

                {/* Quick Select */}
                <div className="mt-5">
                    <p className="mb-2 text-xs font-bold text-foreground ml-1">
                        Quick Select
                    </p>
                    <div className="flex gap-1.5">
                        {quickAmounts.map((val) => (
                            <button
                                key={val}
                                onClick={() => setAmount(val)}
                                className={cn(
                                    "flex-1 rounded-lg border border-border py-2 text-xs font-bold transition-all",
                                    amount === val ? "bg-primary text-white border-primary shadow-md shadow-primary/10" : "bg-card text-foreground hover:bg-muted"
                                )}
                            >
                                ₹{val}
                            </button>
                        ))}
                        <button
                            onClick={() => setAmount(availableBalance)}
                            className={cn(
                                "flex-1 rounded-lg border border-border py-2 text-xs font-bold transition-all",
                                amount === availableBalance ? "bg-primary text-white border-primary shadow-md shadow-primary/10" : "bg-card text-foreground hover:bg-muted"
                            )}
                        >
                            All
                        </button>
                    </div>
                </div>

                {/* Info Box */}
                <div className="mt-5 rounded-xl bg-blue-500/5 border border-blue-500/10 p-3 text-[10px] text-blue-600/80 space-y-0.5 font-medium">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-blue-500" />
                        <p>Min ₹100 • 1-2 work days • No fees</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-xl border border-border px-3 py-3 text-xs font-bold text-muted-foreground hover:bg-muted transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={!isValid}
                        onClick={() => onContinue(Number(amount))}
                        className="flex-1 rounded-xl bg-primary px-3 py-3 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50 disabled:grayscale shadow-md shadow-primary/20 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                    >
                        Continue
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WithdrawFundsModal;
