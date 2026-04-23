import { X, Wallet, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Header = ({ title, onClose }: { title: string; onClose?: () => void }) => (
    <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Wallet className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold font-display text-foreground leading-tight">{title}</h2>
        </div>
        {onClose && (
            <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        )}
    </div>
);

export const Row = ({
    label,
    value,
    green,
    orange,
    bold
}: {
    label: string;
    value: string;
    green?: boolean;
    orange?: boolean;
    bold?: boolean;
}) => (
    <div className="flex justify-between items-center py-0.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn(
            "text-xs font-medium",
            green && "text-emerald-600",
            orange && "text-amber-600",
            bold && "text-sm font-bold text-foreground"
        )}>
            {value}
        </span>
    </div>
);

export const Footer = ({
    left,
    right,
    onLeft,
    onRight,
    disabled,
    loading
}: {
    left: string;
    right: string;
    onLeft: () => void;
    onRight: () => void;
    disabled?: boolean;
    loading?: boolean;
}) => (
    <div className="flex gap-2 mt-6">
        <button
            onClick={onLeft}
            disabled={loading}
            className="flex-1 rounded-xl border border-border px-3 py-3 text-xs font-bold text-muted-foreground hover:bg-muted transition-all disabled:opacity-50"
        >
            {left}
        </button>
        <button
            disabled={disabled || loading}
            onClick={onRight}
            className="flex-1 rounded-xl bg-primary px-3 py-3 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50 disabled:grayscale shadow-md shadow-primary/20 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
        >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : right}
            {!loading && <ChevronRight className="w-3.5 h-3.5" />}
        </button>
    </div>
);
