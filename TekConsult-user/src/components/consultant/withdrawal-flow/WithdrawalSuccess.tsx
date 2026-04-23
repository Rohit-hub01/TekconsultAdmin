import { PaymentMethod } from "./types";
import { Row } from "./shared-components";
import { Check } from "lucide-react";

export default function WithdrawalSuccess({
    amount,
    method,
    onDone,
}: {
    amount: number;
    method: PaymentMethod;
    onDone: () => void;
}) {
    return (
        <div className="w-full max-w-sm rounded-[1.5rem] bg-card p-6 shadow-2xl border border-border text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-md shadow-emerald-500/10">
                <Check className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold font-display text-foreground">Success!</h2>
            <p className="mt-1 text-xs text-muted-foreground px-4 leading-tight">
                Your withdrawal request has been submitted successfully.
            </p>

            <div className="mt-6 rounded-xl border border-border/60 bg-muted/20 p-4 text-left space-y-2">
                <Row label="Amount" value={`₹${amount.toLocaleString()}`} />
                <Row label="Method" value={method.name} />
                <Row label="Status" value="Processing" orange />
            </div>

            <div className="mt-5 p-3 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-[10px] text-primary font-medium leading-relaxed">
                    You'll be notified once the transfer is completed.
                </p>
            </div>

            <button
                onClick={onDone}
                className="mt-6 w-full rounded-xl bg-primary py-3.5 text-xs font-bold text-white shadow-md shadow-primary/20 hover:opacity-90 transition-all active:scale-[0.98]"
            >
                Done
            </button>
        </div>
    );
}
