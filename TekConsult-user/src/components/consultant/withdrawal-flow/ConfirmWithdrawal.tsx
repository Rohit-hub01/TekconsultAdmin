import { PaymentMethod } from "./types";
import { Header, Footer, Row } from "./shared-components";

export default function ConfirmWithdrawal({
    amount,
    method,
    onBack,
    onConfirm,
    loading
}: {
    amount: number;
    method: PaymentMethod;
    onBack: () => void;
    onConfirm: () => void;
    loading?: boolean;
}) {
    return (
        <div className="w-full max-w-sm rounded-[1.5rem] bg-card p-6 shadow-2xl border border-border animate-in zoom-in-95 duration-200">
            <Header title="Final Review" />

            <p className="text-xs text-muted-foreground mb-4 font-medium px-1">
                Please review withdrawal details
            </p>

            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 mb-4">
                <Row label="Amount" value={`₹${amount.toLocaleString()}`} />
                <Row label="Fee" value="₹0" green />
                <div className="pt-1.5 border-t border-border/60">
                    <Row label="Total" value={`₹${amount.toLocaleString()}`} bold />
                </div>
            </div>

            <div className="rounded-xl border border-border/60 p-3 mb-4 bg-muted/20 transition-colors">
                <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Transfer to</p>
                <p className="text-sm font-bold text-foreground leading-tight">{method.name}</p>
                <p className="text-[10px] text-muted-foreground font-medium">{method.subtitle}</p>
            </div>

            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-[10px] text-amber-700 flex items-start gap-2.5 leading-relaxed">
                <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px]">⏳</span>
                </div>
                <p>Transfer will be completed within 1–2 business days.</p>
            </div>

            <Footer
                left="Back"
                right="Submit"
                onLeft={onBack}
                onRight={onConfirm}
                loading={loading}
            />
        </div>
    );
}
