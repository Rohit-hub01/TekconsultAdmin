import { PaymentMethod } from "./types";
import { Header, Footer } from "./shared-components";

const methods: PaymentMethod[] = [
    {
        id: "1",
        type: "BANK",
        name: "HDFC Bank",
        subtitle: "Account ending 4532",
        isPrimary: true,
    },
    {
        id: "2",
        type: "BANK",
        name: "ICICI Bank",
        subtitle: "Account ending 7890",
    },
    {
        id: "3",
        type: "UPI",
        name: "UPI",
        subtitle: "rajesh@upi",
    },
];

export default function SelectPaymentMethod({
    amount,
    selected,
    onSelect,
    onNext,
    onClose,
}: {
    amount: number;
    selected: PaymentMethod | null;
    onSelect: (m: PaymentMethod) => void;
    onNext: () => void;
    onClose: () => void;
}) {
    return (
        <div className="w-full max-w-sm rounded-[1.5rem] bg-card p-6 shadow-2xl border border-border animate-in zoom-in-95 duration-200">
            <Header title="Receipt Method" onClose={onClose} />

            <p className="text-xs text-muted-foreground mb-4">
                Choose where to receive your funds
            </p>

            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 flex justify-between items-center mb-5">
                <span className="text-xs font-medium text-muted-foreground">Amount</span>
                <span className="text-base font-bold text-primary">₹{amount.toLocaleString()}</span>
            </div>

            <p className="text-xs font-bold text-foreground mb-2.5 ml-1">Select Method</p>

            <div className="space-y-2">
                {methods.map((m) => (
                    <button
                        key={m.id}
                        onClick={() => onSelect(m)}
                        className={`w-full rounded-xl border p-3 flex justify-between items-center transition-all ${selected?.id === m.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "border-border/60 hover:bg-muted/50"
                            }`}
                    >
                        <div className="text-left">
                            <p className="text-sm font-bold text-foreground leading-tight">{m.name}</p>
                            <p className="text-[10px] text-muted-foreground font-medium">{m.subtitle}</p>
                        </div>
                        {m.isPrimary && (
                            <span className="text-[9px] font-bold uppercase tracking-wider rounded-md bg-emerald-100 px-1.5 py-0.5 text-emerald-700">
                                Primary
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <button className="mt-3 text-primary text-xs font-bold hover:underline transition-all flex items-center gap-1 ml-1">
                + Add Method
            </button>

            <Footer
                left="Cancel"
                right="Review"
                onLeft={onClose}
                onRight={onNext}
                disabled={!selected}
            />
        </div>
    );
}
